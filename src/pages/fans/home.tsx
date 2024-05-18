import React from "react";
import Head from "next/head";
import { PostCard } from "~/components/fan/creator/post";

import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc";
import { useUserStellarAcc } from "~/lib/state/wallete/userAccBalances";
// import { useConnectWalletStateStore } from "package/connect_wallet";

export default function Home() {
  // const acc = api.wallate.acc.getUserPubAssetBallances.useQuery(undefined, {
  //   onSuccess: (data) => {
  //     toast.success("Data fetched successfully");
  //     useUserStellarAcc;
  //     console.log(data);
  //   },
  //   onError: (error) => {
  //     toast.error("Failed to fetch data");
  //     console.log(error);
  //   },
  // });
  return (
    <>
      <Head>
        <title>BandFan</title>
        <meta
          name="description"
          content="A subscription-based platform that connects bands & creators with their fans on Stellar Blockchain."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="">
        <AuthShowcase />
      </main>
    </>
  );
}

function AuthShowcase() {
  return (
    <div className="p-5">
      <h1 className="hidden text-2xl font-bold md:flex">Homepage</h1>
      <div className="mt-10 flex flex-col items-center">
        <AllRecentPost />
      </div>
    </div>
  );
}

function AllRecentPost() {
  const posts = api.fan.post.getAllRecentPosts.useInfiniteQuery(
    {
      limit: 5,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.nextCursor;
      },

      refetchOnWindowFocus: false,
    },
  );

  const handleFetchNextPage = () => {
    void posts.fetchNextPage();
  };

  const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery();

  // if (isLoading2) return <div>Loading to fetch membership...</div>;

  if (posts.isLoading)
    return (
      <div className="flex flex-col gap-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );

  if (posts.data) {
    return (
      <div className="flex flex-col gap-4">
        {posts.data.pages.map((page) => (
          <>
            {page.posts.map((post) => (
              <PostCard
                priority={1}
                comments={post._count.comments}
                creator={post.creator}
                key={post.id}
                post={post}
                like={post._count.likes}
                show={(() => {
                  if (post.subscription) {
                    const bal = getAssetBalanceFromBalance({
                      balances: accBalances.data,
                      code: post.creator.pageAsset?.code,
                      issuer: post.creator.pageAsset?.issuer,
                    });
                    if (post.subscription.price <= bal) {
                      return true;
                    }

                    return false;
                  } else return true;
                })()}
                media={post.medias.length > 0 ? post.medias[0] : undefined}
              />
            ))}
          </>
        ))}

        {posts.hasNextPage && (
          <button onClick={handleFetchNextPage} className="btn">
            {posts.isFetching && (
              <span className="loading loading-spinner"></span>
            )}
            See more
          </button>
        )}
      </div>
    );
  }
}

export function PostSkeleton() {
  return (
    <div className="flex w-64 flex-col gap-4">
      <div className="skeleton h-32 w-full"></div>
      <div className="skeleton h-4 w-28"></div>
      <div className="skeleton h-4 w-full"></div>
      <div className="skeleton h-4 w-full"></div>
    </div>
  );
}

// function CreatorSecret() {
//   const { email, uid } = useConnectWalletStateStore();

//   console.log(email, uid);

//   const secret = api.fan.creator.getCreatorSecret.useQuery({ email, uid });
//   if (secret.isLoading) return <div>Loading...</div>;
//   if (secret.data) return <div>{secret.data}</div>;
//   if (secret.error) return <div>{secret.error.message}</div>;
// }
