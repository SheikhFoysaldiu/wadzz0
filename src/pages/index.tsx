import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { PostCard } from "~/components/creator/CreatPost";

import { api } from "~/utils/api";

export default function Home() {
  return (
    <>
      <Head>
        <title>Patreon</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex w-full flex-col items-center overflow-y-auto">
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
    <div className="flex flex-col items-center justify-center gap-4">
      <div>
        <AllCreators />
        <AllRecentPost />
      </div>
    </div>
  );
}

function AllCreators() {
  const { data: creators } = api.creator.getAllCreator.useQuery();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">All creators</p>
      <ul>
        {creators?.map((creator) => (
          <li key={creator.id}>
            <Link href={`/creator/${creator.id}`}>{creator.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllRecentPost() {
  const { data: posts, isLoading } = api.post.getAllRecentPosts.useQuery();
  const { data: user_subscriptions, isLoading: isLoading2 } =
    api.member.getAllMembership.useQuery();

  console.log(user_subscriptions, "us");

  if (isLoading2) return <div>Loading to fetch membership...</div>;

  if (isLoading) return <div>Loading...</div>;
  if (posts) {
    return (
      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            like={post._count.Like}
            show={user_subscriptions?.some(
              (el) => el.id == post.subscriptionId,
            )}
          />
        ))}
      </div>
    );
  }
}
