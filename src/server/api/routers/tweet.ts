import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  infiniteProfileFeed: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(async ({ ctx, input: { userId, limit = 10, cursor } }) => {
      const currentUserId = ctx.session?.user.id;
      const tweets = await ctx.prisma.tweet.findMany({
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        where: {
          userId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: {
            select: {
              likes: true,
            },
          },
          likes:
            currentUserId !== null
              ? { where: { userId: currentUserId } }
              : false,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined;
      if (tweets.length > limit) {
        const nextItem = tweets.pop();
        if (nextItem != null) {
          nextCursor = {
            id: nextItem.id,
            createdAt: nextItem.createdAt,
          };
        }
      }
      return {
        tweets: tweets.map((tweet) => {
          return {
            id: tweet.id,
            content: tweet.content,
            createdAt: tweet.createdAt,
            likeCount: tweet._count.likes,
            user: tweet.user,
            likedByMe: tweet.likes?.length > 0,
          };
        }),
        nextCursor,
      };
    }),
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx }) => {
      const tweet = await ctx.prisma.tweet.create({
        data: {
          content,
          userId: ctx.session.user.id,
        },
      });
      void ctx.revalidateSSG?.(`/profile/${ctx.session.user.id}`);

      return tweet;
    }),
  infiniteFeed: publicProcedure
    .input(
      z.object({
        onlyFollowing: z.boolean().optional(),
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      })
    )
    .query(
      async ({ input: { onlyFollowing = false, limit = 10, cursor }, ctx }) => {
        const currentUserId = ctx.session?.user.id;
        const whereCause =
          currentUserId == null || !onlyFollowing
            ? undefined
            : {
                user: {
                  followers: {
                    some: {
                      id: currentUserId,
                    },
                  },
                },
              };
        const tweets = await ctx.prisma.tweet.findMany({
          take: limit + 1,
          cursor: cursor ? { createdAt_id: cursor } : undefined,
          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "desc",
            },
          ],
          where: whereCause,
          select: {
            id: true,
            content: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
              },
            },
            likes:
              currentUserId !== null
                ? { where: { userId: currentUserId } }
                : false,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });
        let nextCursor: typeof cursor | undefined;
        if (tweets.length > limit) {
          const nextItem = tweets.pop();
          if (nextItem != null) {
            nextCursor = {
              id: nextItem.id,
              createdAt: nextItem.createdAt,
            };
          }
        }
        return {
          tweets: tweets.map((tweet) => {
            return {
              id: tweet.id,
              content: tweet.content,
              createdAt: tweet.createdAt,
              likeCount: tweet._count.likes,
              user: tweet.user,
              likedByMe: tweet.likes?.length > 0,
            };
          }),
          nextCursor,
        };
      }
    ),
  toggleLike: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ input: { id }, ctx }) => {
      const data = { tweetId: id, userId: ctx.session.user.id };
      const existingLike = await ctx.prisma.like.findUnique({
        where: {
          userId_tweetId: data,
        },
      });
      if (existingLike == null) {
        await ctx.prisma.like.create({ data });
        return { addedLike: true };
      } else {
        await ctx.prisma.like.delete({
          where: {
            userId_tweetId: data,
          },
        });
        return { removedLike: true };
      }
    }),
});
