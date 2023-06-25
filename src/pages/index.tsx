import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import { useState } from "react";
import FollowingTweets from "~/components/FollowingTweets";
import NewTweetForm from "~/components/NewTweetForm";
import RecentTweets from "~/components/RecentTweets";

const TABS = ["Recent", "Following"] as const;

const Home: NextPage = () => {
  const session = useSession();
  const [selectedTab, setSelectedTab] = useState<(typeof TABS)[number]>(
    TABS[0]
  );
  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-white pt-2">
        <h1 className="mb-2 px-4 text-lg font-bold">Home</h1>
        {session.status === "authenticated" && (
          <div className="my-2 flex transition-all">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`mx-2 flex-grow rounded-full px-4 py-2 transition-all ${
                  selectedTab === tab
                    ? "bg-blue-500 text-white"
                    : "text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </header>
      <NewTweetForm />
      {selectedTab === "Recent" ? <RecentTweets /> : <FollowingTweets />}
    </>
  );
};

export default Home;
