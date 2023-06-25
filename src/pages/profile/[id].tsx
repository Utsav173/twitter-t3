import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import React from "react";
import { ssgHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";
import ErrorPage from "next/error";
import Link from "next/link";
import { IconHoverEffect } from "~/components/HeartButton";
import { VscArrowLeft } from "react-icons/vsc";
import ProfileImage from "~/components/ProfileImage";
import InfiniteTweetList from "~/components/InfiniteTweetList";
import FollowButton from "~/components/FollowButton";

const profilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  const { data: profile } = api.profile.getByID.useQuery({ id });

  const tweets = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    {
      userId: id,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const trpcUtils = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcUtils.profile.getByID.setData({ id }, (oldData) => {
        if (oldData == null) return;
        const countModifier = addedFollow ? 1 : -1;
        return {
          ...oldData,
          followersCount: oldData.followersCount + countModifier,
          isFollowing: addedFollow,
        };
      });
    },
  });
  if (profile == null || profile.name == null) {
    return <ErrorPage statusCode={404} />;
  } else {
    return (
      <>
        <Head>
          <title>{`Profile | ${profile?.name}`}</title>
        </Head>
        <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
          <Link href=".." className="mr-2">
            <IconHoverEffect>
              <VscArrowLeft className="h-6 w-6" />
            </IconHoverEffect>
          </Link>
          <ProfileImage src={profile.image} className="flex-shrink-0" />
          <div className="ml-2 flex-grow">
            <h1 className="text-lg font-bold">{profile.name}</h1>
            <div className="font-light text-gray-500">
              {profile.tweetCount}{" "}
              {getPlural(profile.tweetCount, "Tweet", "Tweets")} -{" "}
              {profile.followersCount}{" "}
              {getPlural(profile.followersCount, "Follower", "Followers")} -{" "}
              {profile.followsCount} Following
            </div>
          </div>
          <FollowButton
            isFollowing={profile.isFollowing}
            isLoading={toggleFollow.isLoading}
            userId={id}
            onClick={() => toggleFollow.mutate({ userId: id })}
          />
        </header>
        <main>
          <InfiniteTweetList
            tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
            isError={tweets.isError}
            isLoading={tweets.isLoading}
            hasMore={tweets.hasNextPage}
            fetchNewTweets={tweets.fetchNextPage}
            isInProfile={true}
          />
        </main>
      </>
    );
  }
};

const pluralRules = new Intl.PluralRules();
function getPlural(number: number, singular: string, plural: string) {
  return pluralRules.select(number) === "one" ? singular : plural;
}
export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>
) {
  const id = context.params?.id;
  if (id == null) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const ssg = ssgHelper();
  await ssg.profile.getByID.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}

export default profilePage;
