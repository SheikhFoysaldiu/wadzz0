import { SubmitHandler, useForm } from "react-hook-form";
// import { PinataResponse, pinFileToIPFS } from "~/lib/pinata/upload";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { UploadButton } from "~/utils/uploadthing";
import Image from "next/image";
import toast from "react-hot-toast";
import clsx from "clsx";
import { api } from "~/utils/api";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import { AccountSchema, clientSelect } from "~/lib/stellar/fan/utils";
import { PlusIcon } from "lucide-react";

export const SongFormSchema = z.object({
  name: z.string(),
  artist: z.string(),
  musicUrl: z.string(),
  description: z.string(),
  coverImgUrl: z.string(),
  albumId: z.number(),
  price: z.number().nonnegative(),
  limit: z.number().nonnegative().int(),
  code: z
    .string()
    .min(4, { message: "Minimum 4 char" })
    .max(12, { message: "Maximum 12 char" }),
  issuer: AccountSchema.optional(),
});

type SongFormType = z.TypeOf<typeof SongFormSchema>;

export default function SongCreate({ albumId }: { albumId: number }) {
  const modalRef = useRef<HTMLDialogElement>(null);

  const [musicUrl, setMusicUrl] = useState<string>();
  const [coverImgUrl, setCover] = useState<string>();
  const { needSign, pubkey, walletType } = useConnectWalletStateStore();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    control,
  } = useForm<z.infer<typeof SongFormSchema>>({
    resolver: zodResolver(SongFormSchema),
    defaultValues: { albumId },
  });

  const addSong = api.music.song.create.useMutation({
    onSuccess: () => {
      toast.success("Song added");
    },
  });

  const xdrMutation = api.music.steller.getMusicAssetXdr.useMutation({
    onSuccess(data, variables, context) {
      const { issuer, xdr } = data;
      setValue("issuer", issuer);
      clientsign({
        presignedxdr: xdr,
        pubkey,
        walletType,
        test: clientSelect(),
      })
        .then((res) => {
          if (true) {
            const data = getValues();
            // res && addMutation.mutate(data);
            console.log(data.code, data.issuer?.publicKey, "asset info");
            addSong.mutate(data);
          } else {
            toast.error(
              "Transection failed in Steller Network. Please try again.",
            );
          }
        })
        .catch((e) => console.log(e));

      // const { issuer, xdr } = data;
      // setValue("issuer", issuer);
      // const formData = getValues();
      // // res && addMutation.mutate(data);
      // addSong.mutate(formData);
    },
    onError(err, variables, context) {
      toast.error("Error");
      console.log(err);
    },
  });

  // Function to upload the selected file to Pinata

  const onSubmit: SubmitHandler<z.infer<typeof SongFormSchema>> = (data) => {
    toast.success("form ok");
    xdrMutation.mutate({
      code: data.code,
      limit: data.limit,

      signWith: needSign(),
      ipfsHash: "test",
    });
  };

  console.log("errors", errors);

  const handleModal = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      <dialog className="modal" ref={modalRef}>
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              // onClick={handleCloseClick}
            >
              ✕
            </button>
          </form>
          <h3 className="text-lg font-bold">Add Music Asset</h3>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <div className="rounded-md bg-base-200 p-2">
                <div className="rounded-md bg-base-200 p-2">
                  <label className="label font-bold">Song Info</label>
                  <div className="w-full max-w-xs">
                    <label className="label">Name</label>
                    <input
                      minLength={2}
                      required
                      {...register("name")}
                      className="input input-bordered input-sm  w-full"
                      placeholder="Enter Music Name"
                    />
                    {errors.name && (
                      <label className="label">
                        <span className="label-text-alt text-warning">
                          {errors.name.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="w-full max-w-xs">
                    <label className="label">Artist</label>
                    <input
                      {...register("artist")}
                      className="input input-bordered input-sm  w-full"
                      placeholder="Enter Artist Name"
                    />
                  </div>
                </div>
                <label className="label font-bold">Upload Files</label>
                <div className="form-control w-full max-w-xs">
                  <label className="label">
                    <span className="label-text">
                      Choose a thumbnail. (this will be used as NFT Image)
                    </span>
                  </label>

                  <div className="mt-4">
                    <UploadButton
                      endpoint="imageUploader"
                      content={{
                        button: "Add Thumbnail",
                        allowedContent: "Max (4MB)",
                      }}
                      onClientUploadComplete={(res) => {
                        // Do something with the response
                        // alert("Upload Completed");
                        const data = res[0];

                        if (data?.url) {
                          setCover(data.url);
                          setValue("coverImgUrl", data.url);
                        }
                        // updateProfileMutation.mutate(res);
                      }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        alert(`ERROR! ${error.message}`);
                      }}
                    />

                    {coverImgUrl && (
                      <>
                        <Image
                          className="p-2"
                          width={120}
                          height={120}
                          alt="preview image"
                          src={coverImgUrl}
                        />
                      </>
                    )}
                  </div>

                  <div className="form-control w-full max-w-xs">
                    <label className="label">
                      <span className="label-text">
                        Choose your music (required)
                      </span>
                    </label>

                    <UploadButton
                      endpoint="musicUploader"
                      content={{
                        button: "Add Song",
                      }}
                      onClientUploadComplete={(res) => {
                        // Do something with the response
                        // alert("Upload Completed");
                        const data = res[0];

                        if (data?.url) {
                          setMusicUrl(data.url);
                          setValue("musicUrl", data.url);
                        }
                        // updateProfileMutation.mutate(res);
                      }}
                      onUploadError={(error: Error) => {
                        // Do something with the error.
                        alert(`ERROR! ${error.message}`);
                      }}
                    />

                    {musicUrl && (
                      <>
                        <audio controls className="py-2">
                          <source src={musicUrl} type="audio/mpeg" />
                        </audio>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full max-w-xs">
                  <label className="label">Choose Song privacy type</label>
                  {/* <select
              className="select select-bordered select-sm w-full max-w-xs"
              onChange={onOptionChanged}
              value={privacyState}
            >
              {Object.values(SongPrivacy).map((privacy) => (
                <option key={privacy} value={privacy}>
                  {privacy}
                </option>
              ))}
            </select> */}
                </div>

                {/* {privacyState == SongPrivacy.RESTRICTED && ( */}
                <>
                  <div className="rounded-md bg-base-200 p-2">
                    <label className="label  font-bold">NFT Info</label>

                    <>
                      <div className="w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">Asset Name</span>
                          <span className="label-text-alt">
                            You can&apos;t change it later
                          </span>
                        </label>
                        <input
                          {...register("code")}
                          className={clsx(
                            "input input-bordered input-sm  w-full",
                            errors.code && "input-warning",
                          )}
                          placeholder="Enter Asset Name"
                        />
                        {errors.code && (
                          <label className="label">
                            <span className="label-text-alt text-warning">
                              {errors.code.message}
                            </span>
                          </label>
                        )}
                      </div>
                      <div className=" w-full max-w-xs ">
                        <label className="label">
                          <span className="label-text">Limit</span>
                          <span className="label-text-alt">
                            Default limit would be 1
                          </span>
                        </label>
                        <input
                          // disabled={trxdata?.successful ? true : false}
                          type="number"
                          {...register("limit", { valueAsNumber: true })}
                          className="input input-bordered input-sm  w-full"
                          placeholder="Enter limit of the new Asset"
                        />
                        {errors.limit && (
                          <div className="label">
                            <span className="label-text-alt">
                              {errors.limit.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                    <div className="w-full max-w-xs">
                      <label className="label">
                        <span className="label-text">Price</span>
                        <span className="label-text-alt">
                          Default price is 2XLM
                        </span>
                      </label>
                      <input
                        step="0.1"
                        type="number"
                        {...register("price", { valueAsNumber: true })}
                        className="input input-bordered input-sm  w-full"
                        placeholder="Price"
                      />
                      {errors.price && (
                        <div className="label">
                          <span className="label-text-alt">
                            {errors.price.message}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full max-w-xs">
                      <label className="label">Description</label>
                      <input
                        {...register("description")}
                        className="input input-bordered input-sm  w-full"
                        placeholder="Write a short Description"
                      />
                      {errors.description && (
                        <div className="label">
                          <span className="label-text-alt">
                            {errors.description.message}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              </div>

              <input className="btn btn-primary btn-sm mt-4" type="submit" />
            </div>
          </form>

          <div className="modal-action">
            <form method="dialog">
              <button
                className="btn"
                // onClick={handleCloseClick}
              >
                Close
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <button onClick={handleModal}>
        <PlusIcon />
      </button>
    </>
  );
}
