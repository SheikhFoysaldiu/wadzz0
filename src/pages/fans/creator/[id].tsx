import { useRouter } from "next/router";
import React from "react";
import { PostCard } from "~/components/fan/creator/post";
import { api } from "~/utils/api";
import { Creator, Subscription } from "@prisma/client";
import MemberShipCard from "~/components/fan/creator/card";
import { clientsign, useConnectWalletStateStore } from "package/connect_wallet";
import toast from "react-hot-toast";
import { MyAssetType } from "~/lib/stellar/fan/utils";
import {
  CreatorProfileMenu,
  useCreatorProfileMenu,
} from "~/lib/state/fan/creator-profile-menu";
import clsx from "clsx";
// import { ShopItem } from "~/components/fan/creator/shop";
import { CreatorBack } from "~/pages/fans/creator";

export default function CreatorPage() {
  const router = useRouter();
  const creatorId = router.query.id;

  if (typeof creatorId == "string" && creatorId.length === 56) {
    return <CreatorPageView creatorId={creatorId} />;
  }

  return <div>Error</div>;
}

function CreatorPageView({ creatorId }: { creatorId: string }) {
  const { data: creator } = api.fan.creator.getCreator.useQuery({
    id: creatorId,
  });
  if (creator)
    return (
      <div className="flex w-full flex-col gap-4 overflow-y-auto">
        <div className="flex w-full flex-col items-center pb-48">
          <>
            <CreatorBack creator={creator} />
            <ChooseMemberShip creator={creator} />
            <Tabs />
            <RenderTabs creatorId={creatorId} />
          </>
        </div>
      </div>
    );
}

function CreatorPosts({ creatorId }: { creatorId: string }) {
  const { data, isLoading, error } = api.fan.post.getPosts.useInfiniteQuery(
    {
      pubkey: creatorId,
      limit: 10,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  if (error) return <div>{error.message}</div>;
  if (isLoading) return <div>Loading...</div>;

  if (data.pages.length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {data.pages.map((page) =>
          page.posts.map((el) => (
            <PostCard
              priority={1}
              comments={el._count.comments}
              creator={el.creator}
              like={el._count.likes}
              key={el.id}
              post={el}
              show={(() => {
                if (el.subscription == null) return true;
                if (el.subscription) {
                  return el.subscription.price <= 10;
                }
              })()}
            />
          )),
        )}
      </div>
    );
  } else {
    return <p>No post</p>;
  }
}

function RenderTabs({ creatorId }: { creatorId: string }) {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  switch (selectedMenu) {
    case CreatorProfileMenu.Contents:
      return <CreatorPosts creatorId={creatorId} />;
    case CreatorProfileMenu.Shop:
    // return <AllShopItems creatorId={creatorId} />;
  }
}

function Tabs() {
  const { selectedMenu, setSelectedMenu } = useCreatorProfileMenu();
  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {Object.values(CreatorProfileMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={() => setSelectedMenu(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );
}

export function ChooseMemberShip({ creator }: { creator: Creator }) {
  const { data: subscriptonModel, isLoading } =
    api.fan.member.getCreatorMembership.useQuery(creator.id);

  if (subscriptonModel && subscriptonModel.length > 0) {
    return (
      <div className="mb-10 flex flex-col gap-4">
        <h2 className="text-center text-2xl font-bold">Choose Membership</h2>
        {isLoading && <div>Loading...</div>}

        <SubscriptionGridWrapper itemLength={subscriptonModel.length}>
          {subscriptonModel?.map((el) => (
            // <p key={el.id}>{el.code}</p>
            <SubscriptionCard key={el.id} creator={creator} subscription={el} />
          ))}
        </SubscriptionGridWrapper>
      </div>
    );
  }
}

export function SubscriptionGridWrapper({
  children,
  itemLength,
}: {
  children: React.ReactNode;
  itemLength: number;
}) {
  function getGridColNumber(element: number) {
    if (element === 1) {
      return "grid-cols-1";
    }
    if (element === 2) {
      return "gird-cols-1 sm:grid-cols-2";
    }
    if (element === 3) {
      return "gird-cols-1 sm:grid-cols-2 md:grid-cols-3";
    }
  }
  return (
    <div
      className={clsx(
        "grid   justify-items-center gap-2  ",
        getGridColNumber(itemLength),
      )}
    >
      {children}
    </div>
  );
}

export type SubscriptionType = Omit<Subscription, "issuerPrivate">;

function SubscriptionCard({
  subscription,
  creator,
}: {
  subscription: SubscriptionType;
  creator: Creator;
}) {
  const { data: subscriptions } = api.fan.member.userSubscriptions.useQuery();

  return (
    <MemberShipCard
      key={subscription.id}
      className=" bg-neutral text-neutral-content"
      creator={creator}
      subscription={subscription}
    >
      {/* <div className="card-actions justify-end"> */}
      {/* <SubscribeMembership
        creator={creator}
        subscription={subscription}
        disabled={subscriptions?.some(
          (sub) => sub.subscriptionId === subscription.id,
        )}
      /> */}
    </MemberShipCard>
  );
}

// function AllShopItems({ creatorId }: { creatorId: string }) {
//   const { data: items, isLoading } = api.fan.asset.getCreatorShopAsset.useQuery(
//     {
//       creatorId,
//     },
//   );
//   if (isLoading) return <div>Loading...</div>;

//   if (items && items.length > 0) {
//     return (
//       <div className="flex flex-col items-center">
//         <p className="my-5 text-center text-lg font-bold">Shop items</p>
//         <div className="flex flex-col gap-2">
//           {items.map((item) => (
//             <ShopItem key={item.id} item={item} />
//           ))}
//         </div>
//       </div>
//     );
//   } else {
//     return <p>There is no nft item</p>;
//   }
// }
