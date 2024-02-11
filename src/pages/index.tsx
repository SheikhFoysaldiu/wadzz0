import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { PostCard } from "~/components/creator/post";

import { api } from "~/utils/api";
import { CreatorAvater } from "./search";

export default function Home() {
  return (
    <>
      <Head>
        <title>Patreon</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="">
        <AuthShowcase />
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.post.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold">Home</h1>
      <div className="mt-10 flex flex-col items-center">
        <AllRecentPost />
      </div>
    </div>
  );
}

function AllRecentPost() {
  const { data, isLoading, fetchNextPage, hasNextPage } =
    api.post.getAllRecentPosts.useInfiniteQuery(
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
    void fetchNextPage();
  };

  const { data: user_subscriptions, isLoading: isLoading2 } =
    api.member.getAllSubscription.useQuery();

  // if (isLoading2) return <div>Loading to fetch membership...</div>;

  if (isLoading) return <div>Loading...</div>;
  if (data) {
    return (
      <div className="flex flex-col gap-4">
        {data.pages.map((page) => (
          <>
            {page.posts.map((post) => (
              <PostCard
                comments={post._count.Comment}
                creator={post.creator}
                key={post.id}
                post={post}
                like={post._count.Like}
                show={
                  !post.subscription ||
                  user_subscriptions?.some(
                    (el) =>
                      el.subscription.creatorId == post.creatorId &&
                      post.subscription &&
                      el.subscription.priority <= post.subscription.priority,
                  )
                }
              />
            ))}
          </>
        ))}

        {hasNextPage && (
          <button onClick={handleFetchNextPage} className="btn">
            {isLoading && <span className="loading loading-spinner"></span>}
            See more
          </button>
        )}
      </div>
    );
  }
}
