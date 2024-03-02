import Head from "next/head";
import { PostCard } from "~/components/fan/creator/post";

import { api } from "~/utils/api";
import Main from "~/components/wallete/main";

export default function Home() {
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
      <Main tags={[]} />
      {/* <div className="mt-10 flex flex-col items-center">
        <AllRecentPost />
      </div> */}
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

  const { data: user_subscriptions, isLoading: isLoading2 } =
    api.fan.member.getAllSubscription.useQuery();

  // if (isLoading2) return <div>Loading to fetch membership...</div>;

  if (posts.isLoading) return <div>Loading...</div>;
  if (posts.data) {
    return (
      <div className="flex flex-col gap-4">
        {posts.data.pages.map((page) => (
          <>
            {page.posts.map((post) => (
              <PostCard
                priority={post.subscription?.priority}
                comments={post._count.comments}
                creator={post.creator}
                key={post.id}
                post={post}
                like={post._count.likes}
                show={
                  !post.subscription ||
                  user_subscriptions?.some(
                    (el) =>
                      // el.s.creatorId == post.creatorId &&
                      post.subscription,
                    // el.subscription.priority <= post.subscription.priority,
                  )
                }
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
