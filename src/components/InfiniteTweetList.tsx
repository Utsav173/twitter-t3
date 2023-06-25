import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import ProfileImage from "./ProfileImage";
import HeartButton from "./HeartButton";
import { api } from "~/utils/api";
import Loader from "./Loader";
type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  isInProfile?: boolean;
  user: { id: string; image: string | null; name: string | null };
};

type InfiniteTweetListProps = {
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean | undefined;
  fetchNewTweets: () => Promise<unknown>;
  tweets?: Tweet[];
  isInProfile?: boolean;
};

const InfiniteTweetList = ({
  tweets,
  isError,
  isLoading,
  fetchNewTweets,
  hasMore = false,
  isInProfile,
}: InfiniteTweetListProps) => {
  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center pt-10">
        <Loader />
      </div>
    );
  }
  if (isError) {
    return <div>Error</div>;
  }
  if (tweets == null || tweets.length === 0) {
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No tweets yet</h2>
    );
  }

  return (
    <InfiniteScroll
      dataLength={tweets.length}
      next={fetchNewTweets}
      hasMore={hasMore}
      loader={
        <div className="flex w-full items-center justify-center pt-4">
          <Loader />
        </div>
      }
    >
      {tweets.map((tweet) => (
        <TweetCard key={tweet.id} {...tweet} isInProfile={isInProfile} />
      ))}
    </InfiniteScroll>
  );
};

export default InfiniteTweetList;
const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

function TweetCard({
  id,
  user,
  content,
  createdAt,
  likeCount,
  likedByMe,
  isInProfile = false,
}: Tweet) {
  const trpcUtils = api.useContext();
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;

        const countModifier = addedLike ? 1 : -1;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((tweet) => {
                if (tweet.id === id) {
                  return {
                    ...tweet,
                    likeCount: tweet.likeCount + countModifier,
                    likedByMe: addedLike,
                  };
                }

                return tweet;
              }),
            };
          }),
        };
      };

      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData
      );
      trpcUtils.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: user.id },
        updateData
      );
    },
  });
  function handleToggleLike() {
    toggleLike.mutate({
      id,
    });
  }
  return (
    <li className="flex gap-4 border-b px-4 py-4">
      {isInProfile ? (
        <ProfileImage src={user.image} />
      ) : (
        <Link href={`/profile/${user.id}`}>
          <ProfileImage src={user.image} />
        </Link>
      )}
      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          {isInProfile ? (
            <p className="font-bold outline-none hover:underline focus-visible:underline">
              {user.name}
            </p>
          ) : (
            <Link
              href={`/profile/${user.id}`}
              className="font-bold outline-none hover:underline focus-visible:underline"
            >
              {user.name}
            </Link>
          )}
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormatter.format(createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{content}</p>
        <HeartButton
          likedByMe={likedByMe}
          likeCount={likeCount}
          isLoading={toggleLike.isLoading}
          onClick={handleToggleLike}
        />
      </div>
    </li>
  );
}
