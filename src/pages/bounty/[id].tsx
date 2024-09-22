import clsx from "clsx";
import { format, formatDate } from "date-fns";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Clock,
  Crown,
  DatabaseZap,
  DollarSign,
  Edit,
  File,
  MessageSquare,
  Paperclip,
  Trash,
  Trophy,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { submitSignedXDRToServer4User } from "package/connect_wallet/src/lib/stellar/trx/payment_fb_g";
import { useState } from "react";
import toast from "react-hot-toast";
import { AddBountyComment } from "~/components/fan/creator/bounty/Add-Bounty-Comment";
import ViewBountyComment from "~/components/fan/creator/bounty/View-Bounty-Comment";
import { useModal } from "~/components/hooks/use-modal-store";
import { Preview } from "~/components/preview";
import { AvatarImage } from "~/components/shadcn/ui/avatar";
import { Badge } from "~/components/shadcn/ui/badge";
import { Button } from "~/components/shadcn/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/shadcn/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Separator } from "~/components/shadcn/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";
import Alert from "~/components/ui/alert";
import Avater from "~/components/ui/avater";
import useNeedSign from "~/lib/hook";
import { useBountyRightStore } from "~/lib/state/bounty/use-bounty-store";
import { usePopUpState } from "~/lib/state/right-pop";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import {
  PLATFORM_ASSET,
  PLATFORM_FEE,
  TrxBaseFeeInPlatformAsset,
} from "~/lib/stellar/constant";

import { useSession } from "next-auth/react";

import { api } from "~/utils/api";

import { clientsign, WalletType } from "package/connect_wallet";
import { clientSelect } from "~/lib/stellar/fan/utils";
import {
  getAssetPrice,
  getAssetToUSDCRate,
} from "~/lib/stellar/fan/get_token_price";
import Loading from "~/components/wallete/loading";
import { SubmissionViewType } from "@prisma/client";

const SingleBountyPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: Owner } = api.bounty.Bounty.isOwnerOfBounty.useQuery({
    BountyId: Number(id),
  });

  return <>{Owner?.isOwner ? <AdminBountyPage /> : <UserBountyPage />}</>;
};

export default SingleBountyPage;

const UserBountyPage = () => {
  const { onOpen } = useModal();
  const session = useSession();
  const { needSign } = useNeedSign();
  const router = useRouter();
  const { id } = router.query;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const utils = api.useUtils();
  const { data, isLoading: bountyLoading } =
    api.bounty.Bounty.getBountyByID.useQuery({
      BountyId: Number(id),
    });

  const { data: submissionData } =
    api.bounty.Bounty.getBountyAttachmentByUserId.useQuery({
      BountyId: Number(id),
    });

  const bountyComment = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });

  const DeleteSubmissionMutation =
    api.bounty.Bounty.deleteBountySubmission.useMutation({
      onSuccess: async () => {
        toast.success("Submission Deleted");
        await utils.bounty.Bounty.getBountyAttachmentByUserId.refetch();
      },
    });
  const handleSubmissionDelete = (id: number) => {
    DeleteSubmissionMutation.mutate({
      submissionId: id,
    });
  };
  const { platformAssetBalance } = useUserStellarAcc();

  const joinBountyMutation = api.bounty.Bounty.joinBounty.useMutation({
    onSuccess: async (data) => {
      toast.success("Bounty Joined");
      await utils.bounty.Bounty.isAlreadyJoined.refetch();
      await router.push(`/bounty/${Number(id)}`);
    },
  });

  const handleJoinBounty = (id: number) => {
    joinBountyMutation.mutate({ BountyId: id });
  };

  const MakeSwapUpdateMutation = api.bounty.Bounty.makeSwapUpdate.useMutation({
    onSuccess: async (data) => {
      toast.success("Swap Successfull");

      await utils.bounty.Bounty.getBountyByID.refetch();
      setIsDialogOpen(false);
      setLoading(false);
    },
  });
  const swapAssetToUSDC = api.bounty.Bounty.swapAssetToUSDC.useMutation({
    onSuccess: async (data, variables) => {
      if (data) {
        setLoading(true);
        const clientResponse = await clientsign({
          presignedxdr: data.xdr,
          walletType: session.data?.user?.walletType,
          pubkey: data.pubKey,
          test: clientSelect(),
        });
        if (clientResponse) {
          setLoading(true);
          MakeSwapUpdateMutation.mutate({
            bountyId: variables.bountyId,
          });
        }
      }
    },
    onError: (error) => {
      setLoading(false);
      toast.error(error.message);
    },
  });
  const { data: oneUSDCEqual } =
    api.bounty.Bounty.getAssetToUSDCRate.useQuery();
  const { data: oneASSETEqual } = api.bounty.Bounty.getPlatformAsset.useQuery();
  const { data: getTrustCost } = api.bounty.Bounty.getTrustCost.useQuery();
  const handleSwap = (id: number, price: number) => {
    setLoading(true);

    swapAssetToUSDC.mutate({
      bountyId: id,
      price: price,
      signWith: needSign(),
    });
    setLoading(false);
  };

  const { data: Owner } = api.bounty.Bounty.isOwnerOfBounty.useQuery({
    BountyId: Number(id) ?? 0,
  });

  const isAlreadyJoin = api.bounty.Bounty.isAlreadyJoined.useQuery({
    BountyId: Number(id) ?? 0,
  });

  const getUserHasTrustLine = api.bounty.Bounty.hasUserTrustOnUSDC.useQuery();
  const getMotherTrustLine = api.bounty.Bounty.hasMotherTrustOnUSDC.useQuery();

  if (bountyLoading || isAlreadyJoin.isLoading) return <Loading />;
  if (data && isAlreadyJoin.data) {
    return (
      <div className=" py-8">
        <div className="p-2">
          {isAlreadyJoin.isLoading ? (
            <div className="mb-2.5 h-10  bg-gray-200 "></div>
          ) : isAlreadyJoin.data.isJoined || Owner?.isOwner ? (
            <Card
              className={clsx("mx-auto w-full max-w-4xl", {
                "blur-sm": !isAlreadyJoin.data,
              })}
            >
              <CardHeader>
                <div className="relative">
                  <Image
                    src={data?.imageUrls[0] ?? "/images/logo.png"}
                    alt={data?.title}
                    width={600}
                    height={300}
                    className="h-64 w-full rounded-t-lg object-cover"
                  />

                  <Badge
                    variant={
                      data?.status === "APPROVED"
                        ? "default"
                        : data?.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                    }
                    className="absolute right-4 top-4 px-3 py-1 text-lg"
                  >
                    {data?.status === "APPROVED"
                      ? "Approved"
                      : data?.status === "PENDING"
                        ? "Pending"
                        : "Rejected"}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <CardTitle className="text-3xl">{data?.title}</CardTitle>
                </div>
                {/* <div className="mt-2 flex items-center text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              <span>Deadline:</span>
            </div> */}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>

                    <TabsTrigger value="submissions" className="relative">
                      Submissions{" "}
                    </TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                  </TabsList>
                  <TabsContent value="details" className="mt-4">
                    <Preview value={data?.description} />
                  </TabsContent>

                  <TabsContent value="submissions" className="mt-4">
                    <div className="mt-4">
                      <h1 className="mt-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white  lg:text-4xl">
                        Your Submissions
                      </h1>
                      {submissionData?.length === 0 && (
                        <p className="w-full text-center">
                          There is no submission yet
                        </p>
                      )}
                      {submissionData?.map((submission, id) => (
                        <div key={id}>
                          <div className="mb-6 flex flex-col gap-4   rounded-lg bg-white p-4 shadow-md ">
                            <div className=" flex flex-col gap-2">
                              <div className="flex flex-col items-start gap-2 ">
                                {submission.content.length > 400 ? (
                                  <ShowMore content={submission.content} />
                                ) : (
                                  <Preview value={submission.content} />
                                )}
                              </div>
                              <p className=" text-xs text-gray-700">
                                {format(
                                  new Date(submission.createdAt),
                                  "MMMM dd, yyyy",
                                )}
                              </p>
                              <p className=" flex items-center gap-2 text-xs text-gray-700">
                                CHECK SEEN STATUS :{" "}
                                {submission.status === "UNCHECKED" ? (
                                  <>
                                    {submission.status}
                                    <span className="me-3 flex h-2 w-2 rounded-full bg-blue-600 "></span>{" "}
                                  </>
                                ) : submission.status === "CHECKED" ? (
                                  <>
                                    {submission.status}
                                    <span className="me-3 flex h-2 w-2 rounded-full bg-yellow-300"></span>{" "}
                                  </>
                                ) : submission.status === "ONREVIEW" ? (
                                  <>
                                    {submission.status}
                                    <span className="me-3 flex h-2 w-2 rounded-full bg-purple-500"></span>{" "}
                                  </>
                                ) : submission.status === "REJECTED" ? (
                                  <>
                                    {submission.status}
                                    <span className="me-3 flex h-2 w-2 rounded-full bg-red-500  "></span>{" "}
                                  </>
                                ) : (
                                  <>
                                    {submission.status}
                                    <span className="me-3 flex h-2 w-2 rounded-full bg-green-500 "></span>{" "}
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <Button
                                className="  "
                                onClick={() =>
                                  onOpen("view attachment", {
                                    attachment: submission.attachmentUrl,
                                  })
                                }
                                variant="outline"
                              >
                                <Paperclip size={16} className="mr-2" /> View
                                Attachment
                              </Button>
                              <div className="flex items-center justify-between gap-2">
                                <Button
                                  // disabled={data?.winner?.name ? true : false}
                                  onClick={() =>
                                    onOpen("upload file", {
                                      submissionId: submission.id,
                                      bountyId: data.id,
                                    })
                                  }
                                >
                                  <Edit />
                                </Button>
                                <Button
                                  disabled={data?.winner?.name ? true : false}
                                  variant="destructive"
                                  onClick={() =>
                                    handleSubmissionDelete(submission.id)
                                  }
                                >
                                  <Trash />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="comments" className="mt-4">
                    <div className="space-y-4">
                      <AddBountyComment bountyId={Number(id)} />
                      <div className="max-h-[650px]">
                        {bountyComment.data &&
                          bountyComment.data.length > 0 && (
                            <div className="mb-10 px-4">
                              <div className=" flex flex-col gap-4 rounded-lg border-2 border-base-200 ">
                                <div className=" mt-1 flex flex-col gap-2  rounded-lg p-2">
                                  {bountyComment.data?.map((comment) => (
                                    <>
                                      <ViewBountyComment
                                        key={comment.id}
                                        comment={comment}
                                        bountyChildComments={
                                          comment.bountyChildComments
                                        }
                                      />
                                      <Separator />
                                    </>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-6 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div className="flex flex-col gap-4  md:flex-row md:items-center md:space-x-4">
                    <Badge variant="secondary" className="flex items-center">
                      <Trophy className="mr-1 h-4 w-4" />
                      {data?.priceInUSD} USD
                    </Badge>
                    <Badge variant="destructive" className="flex items-center">
                      <Trophy className="mr-1 h-4 w-4" />
                      {data?.priceInBand.toFixed(3)} {PLATFORM_ASSET.code}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center">
                      <Users className="mr-1 h-4 w-4" />
                      {data?._count.participants} participants
                    </Badge>
                    <Badge variant="secondary" className="flex items-center">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {data?._count.comments} comments
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Avater className="h-8 w-8" />
                    <div>
                      <Link
                        href={`/fans/creator/${data?.creator.id}`}
                        className="mr-3 inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white"
                      >
                        {" "}
                        <p className="text-sm font-medium">Created by</p>
                        <p className="text-sm text-muted-foreground">
                          {data?.creator.name}
                        </p>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex   space-x-4">
                  <Button
                    variant="destructive"
                    disabled={data?.winner?.name ? true : false}
                    className=""
                    onClick={() =>
                      onOpen("upload file", {
                        bountyId: data.id,
                      })
                    }
                  >
                    Submit Solution
                  </Button>
                </div>
                {data.winnerId &&
                  data.winnerId === session.data?.user.id &&
                  (session.data?.user?.walletType === WalletType.emailPass ||
                    session.data?.user?.walletType === WalletType.apple ||
                    session.data?.user?.walletType === WalletType.google) && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="">
                          <Dialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                className=""
                                disabled={
                                  loading || data.isSwaped
                                    ? true
                                    : false ||
                                      swapAssetToUSDC.isLoading ||
                                      MakeSwapUpdateMutation.isLoading
                                }
                              >
                                <span className="flex items-center">
                                  {PLATFORM_ASSET.code}{" "}
                                  <ArrowRight className="ml-2 mr-2" size={16} />{" "}
                                  USDC
                                </span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Confirmation </DialogTitle>
                              </DialogHeader>
                              {!getMotherTrustLine.data ? (
                                <Alert
                                  className="flex  items-center justify-center"
                                  type="error"
                                  content={`Please Contact Admin. support@bandcoin.io`}
                                />
                              ) : !getUserHasTrustLine.data &&
                                getTrustCost &&
                                oneUSDCEqual &&
                                oneASSETEqual ? (
                                <>
                                  {" "}
                                  <div className="">
                                    <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                                      <div className="space-y-2">
                                        <dl className="flex items-center justify-between gap-4">
                                          <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                                            Transaction Cost
                                          </dt>
                                          <dd className="text-base font-medium text-gray-900 dark:text-white">
                                            {(
                                              data?.priceInBand +
                                              Number(
                                                TrxBaseFeeInPlatformAsset,
                                              ) +
                                              Number(PLATFORM_FEE)
                                            ).toFixed(2)}{" "}
                                            {PLATFORM_ASSET.code}
                                          </dd>
                                        </dl>

                                        <dl className="flex items-center justify-between gap-4">
                                          <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                                            Trust Cost
                                          </dt>
                                          <dd className="text-base font-medium text-green-500">
                                            {getTrustCost} {PLATFORM_ASSET.code}
                                          </dd>
                                        </dl>
                                      </div>

                                      <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                                        <dt className="text-base font-bold text-gray-900 dark:text-white">
                                          Total
                                        </dt>
                                        <dd className="text-base font-bold text-gray-900 dark:text-white">
                                          {(
                                            data?.priceInBand +
                                            Number(TrxBaseFeeInPlatformAsset) +
                                            Number(PLATFORM_FEE) +
                                            getTrustCost
                                          ).toFixed(2)}{" "}
                                          {PLATFORM_ASSET.code}
                                        </dd>
                                      </dl>
                                      <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                                        <dt className="text-base font-bold text-gray-900 dark:text-white">
                                          Swapped Amount
                                        </dt>
                                        <dd className="text-base font-bold text-gray-900 dark:text-white">
                                          {(
                                            data.priceInBand *
                                            (oneASSETEqual / oneUSDCEqual)
                                          ).toFixed(3)}{" "}
                                          USDC
                                        </dd>
                                      </dl>
                                    </div>

                                    <span className="text-xs text-red-500">
                                      NOTE: This is a one time operation! You
                                      can
                                      {"'t"} undo this operation
                                    </span>
                                  </div>
                                  <DialogFooter className=" w-full">
                                    <div className="flex w-full gap-4  ">
                                      <DialogClose className="w-full">
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                        >
                                          Cancel
                                        </Button>
                                      </DialogClose>
                                      <Button
                                        disabled={
                                          loading || data.isSwaped
                                            ? true
                                            : false ||
                                              swapAssetToUSDC.isLoading ||
                                              MakeSwapUpdateMutation.isLoading
                                        }
                                        variant="destructive"
                                        onClick={() =>
                                          handleSwap(data.id, data.priceInBand)
                                        }
                                        className="w-full"
                                      >
                                        Confirm
                                      </Button>
                                    </div>
                                  </DialogFooter>
                                </>
                              ) : (
                                <>
                                  {" "}
                                  <div className="">
                                    <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                                      <div className="space-y-2">
                                        <dl className="flex items-center justify-between gap-4">
                                          <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                                            Transaction Cost
                                          </dt>
                                          <dd className="text-base font-medium text-gray-900 dark:text-white">
                                            {(
                                              data?.priceInBand +
                                              Number(
                                                TrxBaseFeeInPlatformAsset,
                                              ) +
                                              Number(PLATFORM_FEE)
                                            ).toFixed(2)}{" "}
                                            {PLATFORM_ASSET.code}
                                          </dd>
                                        </dl>

                                        <dl className="flex items-center justify-between gap-4">
                                          <dt className="text-base font-normal text-gray-500 dark:text-gray-400">
                                            Trust Cost
                                          </dt>
                                          <dd className="text-base font-medium text-green-500">
                                            {getTrustCost} {PLATFORM_ASSET.code}
                                          </dd>
                                        </dl>
                                      </div>

                                      <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                                        <dt className="text-base font-bold text-gray-900 dark:text-white">
                                          Total
                                        </dt>
                                        <dd className="text-base font-bold text-gray-900 dark:text-white">
                                          {(
                                            data?.priceInBand +
                                            Number(TrxBaseFeeInPlatformAsset) +
                                            Number(PLATFORM_FEE)
                                          ).toFixed(2)}{" "}
                                          {PLATFORM_ASSET.code}
                                        </dd>
                                      </dl>
                                      <dl className="flex items-center justify-between gap-4 border-t border-gray-200 pt-2 dark:border-gray-700">
                                        <dt className="text-base font-bold text-gray-900 dark:text-white">
                                          Swapped Amount
                                        </dt>
                                        {oneASSETEqual && oneUSDCEqual && (
                                          <dd className="text-base font-bold text-gray-900 dark:text-white">
                                            {(
                                              data.priceInBand *
                                              (oneASSETEqual / oneUSDCEqual)
                                            ).toFixed(3)}{" "}
                                            USDC
                                          </dd>
                                        )}
                                      </dl>
                                    </div>

                                    <span className="text-xs text-red-500">
                                      NOTE: This is a one time operation! You
                                      can
                                      {"'t"} undo this operation
                                    </span>
                                  </div>
                                  {oneUSDCEqual && oneASSETEqual && (
                                    <div>
                                      You will get total{" "}
                                      {data.priceInBand *
                                        (oneASSETEqual / oneUSDCEqual)}{" "}
                                      USDC
                                    </div>
                                  )}
                                  <DialogFooter className=" w-full">
                                    <div className="flex w-full gap-4  ">
                                      <DialogClose className="w-full">
                                        <Button
                                          variant="outline"
                                          className="w-full"
                                        >
                                          Cancel
                                        </Button>
                                      </DialogClose>
                                      <Button
                                        disabled={
                                          loading || data.isSwaped
                                            ? true
                                            : false ||
                                              swapAssetToUSDC.isLoading ||
                                              MakeSwapUpdateMutation.isLoading
                                        }
                                        variant="destructive"
                                        onClick={() =>
                                          handleSwap(data.id, data.priceInBand)
                                        }
                                        className="w-full"
                                      >
                                        Confirm
                                      </Button>
                                    </div>
                                  </DialogFooter>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </>
                  )}
              </CardFooter>
            </Card>
          ) : data.requiredBalance > platformAssetBalance ? (
            <Alert
              className="flex  items-center justify-center"
              type="error"
              content={`You don't have Sufficient Balance ,To join this bounty, you need minimum  
                
                ${data.requiredBalance} ${PLATFORM_ASSET.code} `}
            />
          ) : (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
              <Alert
                className="flex  items-center justify-center"
                type="success"
                content={`You can join this bounty by clicking the button below`}
              />
              <Button
                className="w-1/2 rounded-lg"
                disabled={
                  joinBountyMutation.isLoading || isAlreadyJoin.isLoading
                }
                onClick={() => handleJoinBounty(data.id)}
              >
                Join Bounty
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // return (
  //   <main className="  bg-white py-2 dark:bg-gray-900 md:px-40 md:py-4">
  //     <div className=" flex justify-between px-4 ">
  //       <article className=" mx-auto w-full ">
  //         <header className=" mb-4 lg:mb-6">
  //           <div className="flex items-center justify-between ">
  //             <address className="mb-6 flex items-center not-italic">
  //               <Link href={`/fans/creator/${data?.creator.id}`}>
  //                 <div className="mr-3 inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white">
  //                   <Avater
  //                     className="h-12 w-12"
  //                     url={data?.creator.profileUrl}
  //                   />
  //                   <div className="flex flex-col gap-2">
  //                     <Link
  //                       href={`/fans/creator/${data?.creator.id}`}
  //                       rel="author"
  //                       className="text-xl font-bold text-gray-900 dark:text-white"
  //                     >
  //                       {data?.creator.name}
  //                     </Link>
  //                     <p className="mt-1 text-xs font-medium text-slate-600">
  //                       WINNER:{" "}
  //                       {data.winner?.name ? (
  //                         <span className="me-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
  //                           {data.winner.name}
  //                         </span>
  //                       ) : (
  //                         <span className="me-2 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
  //                           NOT ANNOUNCED
  //                         </span>
  //                       )}
  //                     </p>

  //                     <p className="mt-1 text-xs font-medium uppercase text-slate-600">
  //                       STATUS:
  //                       {data.status === "PENDING" ? (
  //                         <span className="items-center whitespace-nowrap rounded-md bg-indigo-500/20 px-2 py-1 uppercase text-indigo-900">
  //                           {" "}
  //                           {data.status}
  //                         </span>
  //                       ) : data.status === "APPROVED" ? (
  //                         <span className="items-center whitespace-nowrap rounded-md bg-green-500/20 px-2 py-1 uppercase text-green-900">
  //                           {data.status}
  //                         </span>
  //                       ) : (
  //                         <span className=" select-none items-center whitespace-nowrap rounded-md bg-red-500/20 px-2 py-1 uppercase text-red-900">
  //                           {" "}
  //                           {data.status}
  //                         </span>
  //                       )}
  //                     </p>
  //                   </div>
  //                 </div>
  //               </Link>
  //             </address>
  //           </div>

  //           <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white  lg:text-4xl">
  //             {data?.title}
  //           </h1>
  //         </header>
  //         <div>
  //           <Preview value={data?.description} />

  //           <div className="flex flex-col items-center  justify-center gap-4">
  //             {data.imageUrls.map((url) => (
  //               <Image
  //                 key={url}
  //                 src={url}
  //                 alt="bounty image"
  //                 width={1000}
  //                 height={1000}
  //                 className="h-full w-full "
  //               />
  //             ))}
  //           </div>
  //           <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white ">
  //             Prize in USD : ${data?.priceInUSD}
  //           </h1>
  //           <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-white ">
  //             Prize in {PLATFROM_ASSET.code} : {data?.priceInBand}
  //           </h1>
  //           <p className="mt-1 text-xs font-medium text-slate-600">
  //             Posted on {format(new Date(data.createdAt), "MMMM dd, yyyy")}
  //           </p>
  //         </div>
  //       </article>
  //     </div>

  //     <div className="mb-6 mt-2  flex flex-col gap-4   rounded-lg bg-white p-6 shadow-md">
  //       <div className="flex items-center justify-between">
  //         <h1 className="text-center text-2xl font-extrabold text-gray-900 dark:text-white">
  //           Your Recent Submissions
  //         </h1>
  //         <div className="flex items-center justify-center ">
  //           <Button
  //             disabled={data?.winner?.name ? true : false}
  //             className=""
  //             onClick={() =>
  //               onOpen("upload file", {
  //                 bountyId: data.id,
  //               })
  //             }
  //           >
  //             <UploadCloud className="mr-2" /> Attach Your Submission
  //           </Button>
  //         </div>
  //       </div>
  //       {submissionData?.length === 0 && (
  //         <p className="w-full text-center">There is no submission yet</p>
  //       )}
  //       {submissionData?.map((submission, id) => (
  //         <div key={id}>
  //           <div className="mb-6 flex flex-col gap-4   rounded-lg bg-white p-6 shadow-md ">
  //             <div className=" flex flex-col gap-2">
  //               <div className="flex items-center gap-4">
  //                 <p className="  ">{submission.content}</p>
  //               </div>
  //               <p className=" text-xs text-gray-700">
  //                 {format(new Date(submission.createdAt), "MMMM dd, yyyy")}
  //               </p>
  //             </div>

  //             <div className="flex items-center justify-between">
  //               <Button
  //                 className="  "
  //                 onClick={() =>
  //                   onOpen("view attachment", {
  //                     attachment: submission.attachmentUrl,
  //                   })
  //                 }
  //                 variant="outline"
  //               >
  //                 <Paperclip size={16} className="mr-2" /> View Attachment
  //               </Button>
  //               <Button
  //                 disabled={data?.winner?.name ? true : false}
  //                 variant="destructive"
  //                 onClick={() => handleSubmissionDelete(submission.id)}
  //               >
  //                 <Trash />
  //               </Button>
  //             </div>
  //           </div>
  //         </div>
  //       ))}
  //     </div>

  //     <div className="mb-6 flex items-center justify-between">
  //       <h2 className="ml-4 mt-2 text-lg font-bold text-gray-900 dark:text-white lg:text-2xl">
  //         Discussion ({totalComment?.length})
  //       </h2>
  //     </div>
  //     <AddBountyComment bountyId={Number(id)} />
  //     {bountyComment.data && bountyComment.data.length > 0 && (
  //       <div className="mb-10 px-4">
  //         <div className=" flex flex-col gap-4 rounded-lg border-2 border-base-200 ">
  //           <div className=" mt-1 flex flex-col gap-4  rounded-lg p-2">
  //             {bountyComment.data?.map((comment) => (
  //               <>
  //                 <ViewBountyComment
  //                   key={comment.id}
  //                   comment={comment}
  //                   bountyChildComments={comment.bountyChildComments}
  //                 />
  //                 <Separator />
  //               </>
  //             ))}
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </main>
  // );
};

const AdminBountyPage = () => {
  const { onOpen } = useModal();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();
  const [loadingBountyId, setLoadingBountyId] = useState<number | null>(null);
  const { needSign } = useNeedSign();
  const { id } = router.query;
  console.log(id);
  const { data } = api.bounty.Bounty.getBountyByID.useQuery({
    BountyId: Number(id),
  });
  const { data: totalComment } = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });

  const DeleteMutation = api.bounty.Bounty.deleteBounty.useMutation({
    onSuccess: async (data, variables) => {
      setLoadingBountyId(variables.BountyId);
      await router.push("/fans/creator/bounty");
      toast.success("Bounty Deleted");
      setLoadingBountyId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setLoadingBountyId(null);
    },
  });

  const { data: allSubmission } =
    api.bounty.Bounty.getBountyAllSubmission.useQuery({
      BountyId: Number(id),
    });

  const bountyComment = api.bounty.Bounty.getBountyComments.useQuery({
    bountyId: Number(id),
  });

  const GetDeleteXDR = api.bounty.Bounty.getDeleteXdr.useMutation({
    onSuccess: async (data, variables) => {
      setLoadingBountyId(variables.bountyId);
      if (data) {
        const res = await submitSignedXDRToServer4User(data);
        if (res) {
          DeleteMutation.mutate({
            BountyId: GetDeleteXDR.variables?.bountyId ?? 0,
          });
        }
      }
      setLoadingBountyId(null);
    },
  });

  const MakeWinnerMutation = api.bounty.Bounty.makeBountyWinner.useMutation({
    onSuccess: async (data, variables) => {
      setLoadingBountyId(variables.BountyId);
      toast.success("Winner Marked");
      setLoadingBountyId(null);
      setIsDialogOpen(false);
    },
  });

  const GetSendBalanceToWinnerXdr =
    api.bounty.Bounty.getSendBalanceToWinnerXdr.useMutation({
      onSuccess: async (data, variables) => {
        setLoadingBountyId(variables.BountyId);
        if (data) {
          const res = await submitSignedXDRToServer4User(data);
          if (res) {
            MakeWinnerMutation.mutate({
              BountyId: variables?.BountyId,
              userId: variables?.userId,
            });
          }
        }
        setLoadingBountyId(null);
      },
      onError: (error) => {
        toast.error(error.message);
        setLoadingBountyId(null);
      },
    });
  const handleWinner = (bountyId: number, userId: string, prize: number) => {
    setLoadingBountyId(bountyId);
    GetSendBalanceToWinnerXdr.mutate({
      BountyId: bountyId,
      userId: userId,
      prize: prize,
    });
    setLoadingBountyId(null);
  };

  const handleDelete = (id: number, prize: number) => {
    setLoadingBountyId(id);
    GetDeleteXDR.mutate({ prize: prize, bountyId: id });
    setLoadingBountyId(null);
  };

  const UpdateSubmissionStatusMutation =
    api.bounty.Bounty.updateBountySubmissionStatus.useMutation();

  const updateSubmissionStatus = (
    creatorId: string,
    submissionId: number,
    status: SubmissionViewType,
  ) => {
    UpdateSubmissionStatusMutation.mutate({
      creatorId: creatorId,
      submissionId: submissionId,
      status: status,
    });
  };

  if (data)
    return (
      <div className="py-4">
        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader>
            <div className="relative">
              <Image
                src={data?.imageUrls[0] ?? "/images/logo.png"}
                alt={data?.title}
                width={1000}
                height={1000}
                className="h-64 w-full rounded-t-lg object-cover"
              />

              <Badge
                variant={
                  data?.status === "APPROVED"
                    ? "default"
                    : data?.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                }
                className="absolute right-4 top-4 px-3 py-1 text-lg"
              >
                {data?.status === "APPROVED"
                  ? "Approved"
                  : data?.status === "PENDING"
                    ? "Pending"
                    : "Rejected"}
              </Badge>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <CardTitle className="flex w-full items-center justify-between text-3xl">
                <div>{data?.title}</div>
                {data.imageUrls.length > 0 && (
                  <Button
                    variant="outline"
                    className="mb-2 me-2 rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
                    onClick={() =>
                      onOpen("view attachment", {
                        attachment: data.imageUrls,
                      })
                    }
                  >
                    View Attachment
                  </Button>
                )}
              </CardTitle>
            </div>
            {/* <div className="mt-2 flex items-center text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              <span>Deadline:</span>
            </div> */}
          </CardHeader>
          <CardContent className="w-full">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>

                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <Preview value={data?.description} />
              </TabsContent>

              <TabsContent value="submissions" className="mt-4">
                <p>Total submissions: {data?._count.submissions}</p>

                <div className="mt-4">
                  <h1 className="mt-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white  lg:text-4xl">
                    Recent Submissions
                  </h1>
                  {allSubmission?.length === 0 && (
                    <p className="mb-6 mt-2  flex flex-col gap-4 rounded-lg  bg-white p-6 text-center shadow-md">
                      There is no submission yet
                    </p>
                  )}
                  {allSubmission?.map((submission, id) => (
                    <div key={id}>
                      <div className="mb-6 flex flex-col gap-4   rounded-lg bg-white p-6 shadow-md ">
                        <div className="flex items-center">
                          <Avater
                            className="h-12 w-12"
                            url={submission.user.image}
                          />
                          <div className="flex w-full items-center justify-between">
                            <div className="ml-2">
                              <div className="text-sm ">
                                <span className="font-semibold">
                                  {submission.user.name}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 ">
                                {format(
                                  new Date(submission.createdAt),
                                  "MMMM dd, yyyy",
                                )}
                              </div>
                            </div>
                            <SubmissionStatusSelect
                              defaultValue={submission.status as string}
                              submissionId={submission.id}
                              creatorId={data.creatorId}
                              updateSubmissionStatus={updateSubmissionStatus}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 ">
                          {submission.content.length > 400 ? (
                            <ShowMore content={submission.content} />
                          ) : (
                            <Preview value={submission.content} />
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="">
                            <Dialog
                              open={isDialogOpen}
                              onOpenChange={setIsDialogOpen}
                            >
                              <div className="flex items-start justify-between">
                                <DialogTrigger asChild>
                                  <Button
                                    disabled={
                                      loadingBountyId === data.id ||
                                      data.winner?.name
                                        ? true
                                        : false ||
                                          GetSendBalanceToWinnerXdr.isLoading
                                    }
                                    className=" me-2  bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300 "
                                    variant="outline"
                                  >
                                    <Crown size={16} className="mr-2" /> MARK AS
                                    WINNER
                                  </Button>
                                </DialogTrigger>
                                <Button
                                  className="  "
                                  onClick={() => {
                                    updateSubmissionStatus(
                                      data.creatorId,
                                      submission.id,
                                      "CHECKED",
                                    ),
                                      onOpen("view attachment", {
                                        attachment: submission.attachmentUrl,
                                      });
                                  }}
                                  variant="outline"
                                >
                                  <Paperclip size={16} className="mr-2" /> View
                                  Attachment
                                </Button>
                              </div>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Confirmation </DialogTitle>
                                </DialogHeader>
                                <div className="mt-6 w-full space-y-6 sm:mt-8 lg:mt-0 lg:max-w-xs xl:max-w-md">
                                  <div className="flow-root">
                                    Do you want to make {submission.user.name}{" "}
                                    as a winner? This action can{"'t"} be
                                    undone.
                                  </div>
                                </div>
                                <DialogFooter className=" w-full">
                                  <div className="flex w-full gap-4  ">
                                    <DialogClose className="w-full">
                                      <Button
                                        variant="outline"
                                        className="w-full"
                                      >
                                        Cancel
                                      </Button>
                                    </DialogClose>
                                    <Button
                                      disabled={
                                        loadingBountyId === data.id ||
                                        data.winner?.name
                                          ? true
                                          : false ||
                                            GetSendBalanceToWinnerXdr.isLoading
                                      }
                                      variant="destructive"
                                      type="submit"
                                      onClick={() =>
                                        handleWinner(
                                          data.id,
                                          submission.userId,
                                          data.priceInBand,
                                        )
                                      }
                                      className="w-full"
                                    >
                                      Confirm
                                    </Button>
                                  </div>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="comments" className="mt-4">
                <div className="space-y-4">
                  <AddBountyComment bountyId={Number(id)} />
                  <div className="max-h-[650px]">
                    {bountyComment.data && bountyComment.data.length > 0 && (
                      <div className="mb-10 px-4">
                        <div className=" flex flex-col gap-4 rounded-lg border-2 border-base-200 ">
                          <div className=" mt-1 flex flex-col gap-2  rounded-lg p-2">
                            {bountyComment.data?.map((comment) => (
                              <>
                                <ViewBountyComment
                                  key={comment.id}
                                  comment={comment}
                                  bountyChildComments={
                                    comment.bountyChildComments
                                  }
                                />
                                <Separator />
                              </>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-6 flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <div className="flex flex-col gap-4  md:flex-row md:items-center md:space-x-4">
                <Badge variant="secondary" className="flex items-center">
                  <DollarSign className="mr-1 h-4 w-4" />
                  {data?.priceInUSD} USD
                </Badge>
                <Badge variant="destructive" className="flex items-center">
                  <Trophy className="mr-1 h-4 w-4" />
                  {data?.priceInBand.toFixed(3)} {PLATFORM_ASSET.code}
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  {data?._count.participants} participants
                </Badge>
                <Badge variant="secondary" className="flex items-center">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  {data?._count.comments} comments
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Avater className="h-8 w-8" />
                <div>
                  <Link
                    href={`/fans/creator/${data?.creator.id}`}
                    className="mr-3 inline-flex items-center gap-2 text-sm text-gray-900 dark:text-white"
                  >
                    {" "}
                    <p className="text-sm font-medium">Created by</p>
                    <p className="text-sm text-muted-foreground">
                      {data?.creator.name}
                    </p>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="flex space-x-4">
              <Button
                onClick={() => onOpen("edit bounty", { bountyId: data.id })}
              >
                Edit Bounty
              </Button>
              <div className="flex flex-col gap-2">
                <div className="">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        disabled={
                          loadingBountyId === data.id || data.winner?.name
                            ? true
                            : false
                        }
                        variant="destructive"
                      >
                        Delete Bounty
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Confirmation </DialogTitle>
                      </DialogHeader>

                      <div className=" py-2">
                        Do you want to delete this bounty?
                      </div>

                      <DialogFooter className=" w-full">
                        <div className="flex w-full gap-4  ">
                          <DialogClose className="w-full">
                            <Button variant="outline" className="w-full">
                              Cancel
                            </Button>
                          </DialogClose>
                          <Button
                            disabled={
                              loadingBountyId === data.id || data.winner?.name
                                ? true
                                : false
                            }
                            variant="destructive"
                            type="submit"
                            onClick={() =>
                              handleDelete(data.id, data.priceInBand)
                            }
                            className="w-full"
                          >
                            Confirm
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
};
function ShowMore({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  return (
    <>
      <p>
        {isExpanded ? (
          <Preview value={content} />
        ) : (
          <Preview value={content.slice(0, 400)} />
        )}
      </p>

      <button
        className="ml-4 text-red-400 underline"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Show Less" : "Show More"}
      </button>
    </>
  );
}
const SubmissionStatusSelect = ({
  defaultValue,
  submissionId,
  creatorId,
  updateSubmissionStatus,
}: {
  defaultValue: string;
  submissionId: number;
  creatorId: string;
  updateSubmissionStatus: (
    creatorId: string,
    submissionId: number,
    status: SubmissionViewType,
  ) => void;
}) => {
  const handleStatusChange = (value: SubmissionViewType) => {
    updateSubmissionStatus(creatorId, submissionId, value);
  };

  return (
    <Select onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder={defaultValue} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="CHECKED">CHECKED</SelectItem>
        <SelectItem value="ONREVIEW">REVIEW</SelectItem>
        <SelectItem value="APPROVED">APPROVED</SelectItem>
        <SelectItem value="REJECTED">REJECTED</SelectItem>
      </SelectContent>
    </Select>
  );
};
