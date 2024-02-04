import { z } from "zod";
import { PostSchema } from "~/components/creator/CreatPost";
import { CommentSchema } from "~/pages/posts/[id]";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { NotificationEntity } from "~/utils/notificationConfig";

export const postRouter = createTRPCRouter({
  create: protectedProcedure
    .input(PostSchema)
    .mutation(async ({ ctx, input }) => {
      // simulate a slow db call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return ctx.db.post.create({
        data: {
          heading: input.heading,
          content: input.content,
          creatorId: input.id,
          subscriptionId: input.subscription
            ? Number(input.subscription)
            : null,
          mediaType: input.mediaType,
          mediaUrl: input.mediaUrl,
        },
      });
    }),

  getPosts: protectedProcedure
    .input(
      z.object({
        pubkey: z.string().min(56, { message: "pubkey is more than 56" }),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await ctx.db.post.findMany({
        where: {
          creatorId: input.pubkey,
        },
        include: {
          _count: {
            select: {
              Like: {
                where: { status: true },
              },
              Comment: true,
            },
          },
          subscription: true,
        },
      });
    }),

  getAllRecentPosts: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.post.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: true,
        _count: {
          select: { Like: true, Comment: true },
        },
      },
    });
  }),

  getAPost: protectedProcedure
    .input(z.number())
    .query(async ({ input, ctx }) => {
      return await ctx.db.post.findUnique({
        where: { id: input },
        include: { _count: { select: { Like: true, Comment: true } } },
      });
    }),

  getSecretMessage: protectedProcedure.query(async ({ ctx }) => {
    return "secret message";
  }),

  likeApost: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: postId, ctx }) => {
      const userId = ctx.session.user.id;

      const oldLike = await ctx.db.like.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      if (oldLike) {
        await ctx.db.like.update({
          data: { status: true },
          where: {
            postId_userId: { postId: postId, userId },
          },
        });
        return oldLike;
      } else {
        // first time.
        const like = await ctx.db.like.create({
          data: { userId, postId },
        });
        // create notification
        ctx.db.post
          .findUnique({ where: { id: postId }, select: { creatorId: true } })
          .then((creator) => {
            if (creator) {
              ctx.db.notificationObject.create({
                data: {
                  actorId: userId,
                  entiryId: NotificationEntity.Like,
                  Notification: {
                    create: [{ notifierId: creator.creatorId }],
                  },
                },
              });
            }
          });

        return like;
      }
    }),

  unLike: protectedProcedure
    .input(z.number())
    .mutation(async ({ input: postId, ctx }) => {
      await ctx.db.like.update({
        data: { status: false },
        where: {
          postId_userId: { postId: postId, userId: ctx.session.user.id },
        },
      });
    }),

  getLikes: publicProcedure
    .input(z.number())
    .query(async ({ input: postId, ctx }) => {
      return await ctx.db.like.count({
        where: { postId },
      });
    }),

  isLiked: protectedProcedure
    .input(z.number())
    .query(async ({ input: postId, ctx }) => {
      return await ctx.db.like.findFirst({
        where: { userId: ctx.session.user.id, postId, status: true },
      });
    }),

  getComments: publicProcedure
    .input(z.number())
    .query(async ({ input: postId, ctx }) => {
      return await ctx.db.comment.findMany({
        where: { postId },
      });
    }),

  createComment: protectedProcedure
    .input(CommentSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.create({
        data: {
          content: input.content,
          postId: input.postId,
          userId: ctx.session.user.id,
        },
      });
      // create notification
      ctx.db.post
        .findUnique({
          where: { id: input.postId },
          select: { creatorId: true },
        })
        .then((creator) => {
          creator &&
            ctx.db.notificationObject.create({
              data: {
                actorId: ctx.session.user.id,
                entiryId: NotificationEntity.Comment,
                Notification: {
                  create: [{ notifierId: creator.creatorId }],
                },
              },
            });
        });
      return comment;
    }),
});
