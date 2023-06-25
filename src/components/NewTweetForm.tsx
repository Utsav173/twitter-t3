import { useSession } from "next-auth/react";
import { Button } from "./Button";
import ProfileImage from "./ProfileImage";
import {
  type FormEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { api } from "~/utils/api";

function updateTextAreaSize(textArea?: HTMLTextAreaElement) {
  if (textArea == null) return;
  textArea.style.height = "0";
  textArea.style.height = `${textArea.scrollHeight}px`;
}

function Form() {
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>();
  const inputRef = useCallback((textArea: HTMLTextAreaElement) => {
    updateTextAreaSize(textArea);
    textAreaRef.current = textArea;
  }, []);

  useLayoutEffect(() => {
    updateTextAreaSize(textAreaRef.current);
  }, [inputValue]);

  if (session.status !== "authenticated") return null;
  const trpcUtils = api.useContext();

  const createTweet = api.tweet.create.useMutation({
    onSuccess: (newTweet) => {
      if (session.status !== "authenticated") return;
      void trpcUtils.tweet.infiniteFeed.invalidate({}, (oldData) => {
        if (oldData == null || oldData.pages[0] == null) return;
        const newCacheTweet = {
          ...newTweet,
          likeCount: 0,
          likedByMe: false,
          user: {
            id: session.data.user.id,
            name: session.data.user.name || null,
            image: session.data.user.image || null,
          },
        };
        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              tweets: [newCacheTweet, ...oldData.pages[0].tweets],
            },
            ...oldData.pages.slice(1),
          ],
        };
      });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createTweet.mutate({
      content: inputValue,
    });
    setInputValue("");
  }

  return (
    <form
      className="flex flex-col gap-2 border-b px-4 py-2"
      onSubmit={handleSubmit}
    >
      <div className="flex gap-4">
        <ProfileImage src={session.data?.user?.image} />
        <textarea
          style={{ height: 0 }}
          ref={inputRef}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What's happening"
          value={inputValue}
          name="tweet"
          className="flex-grow resize-none overflow-hidden p-4 text-lg outline-none"
        />
      </div>
      <Button type="submit" className="self-end bg-blue-400">
        Tweet
      </Button>
    </form>
  );
}

const NewTweetForm = () => {
  const session = useSession();
  if (session.status !== "authenticated") return null;
  return <Form />;
};

export default NewTweetForm;
