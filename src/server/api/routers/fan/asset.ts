import { z } from "zod";
import { ShopItemSchema } from "~/components/fan/creator/add-shop-item";
import { NftFormSchema } from "~/components/marketplace/nft_create";

import {
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopRouter = createTRPCRouter({
  createAsset: protectedProcedure
    .input(NftFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        code,
        coverImgUrl,
        description,

        mediaType,
        mediaUrl,
        name,
        price,
        issuer,
        limit,
        tier,

        isAdmin,
      } = input;

      if (issuer) {
        const userId = ctx.session.user.id;
        const creatorId = isAdmin ? undefined : userId; // for admin creator and placer id is undefined
        const nftType = isAdmin ? "ADMIN" : "FAN";

        console.log("mediaType", mediaType, mediaUrl);

        const asset = await ctx.db.asset.create({
          data: {
            code,
            issuer: issuer.publicKey,
            name,
            mediaType,
            mediaUrl,
            marketItems: {
              create: {
                price,
                placerId: creatorId,
                type: nftType,
              },
            },
            description,
            thumbnail: coverImgUrl,
            creatorId,
            limit,
            tierId: tier ? Number(tier) : undefined,
          },
        });
      }
    }),

  deleteAsset: protectedProcedure // fix the logic
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.asset.delete({
        where: { id: input },
      });
    }),

  // search: publicProcedure
  //   .input(
  //     z.object({
  //       limit: z.number(),
  //       // cursor is a reference to the last item in the previous batch
  //       // it's used to fetch the next batch
  //       cursor: z.number().nullish(),
  //       skip: z.number().optional(),
  //       searchInput: z.string(),
  //     }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const { limit, skip, cursor, searchInput } = input;
  //     const items = await ctx.db.shopAsset.findMany({
  //       take: limit + 1,
  //       skip: skip,
  //       cursor: cursor ? { id: cursor } : undefined,
  //       where: {
  //         OR: [
  //           {
  //             name: {
  //               contains: searchInput,
  //               mode: "insensitive",
  //             },
  //           },
  //           {
  //             description: {
  //               contains: searchInput,
  //               mode: "insensitive",
  //             },
  //           },
  //           {
  //             asset: {
  //               code: {
  //                 contains: searchInput,
  //                 mode: "insensitive",
  //               },
  //               issuer: {
  //                 contains: searchInput,
  //                 mode: "insensitive",
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       include: { asset: { select: { code: true, issuer: true } } },
  //     });

  //     let nextCursor: typeof cursor | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop(); // return the last item from the array
  //       nextCursor = nextItem?.id;
  //     }

  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),

  buyAsset: protectedProcedure
    .input(z.object({ shopAssetId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { shopAssetId } = input;
      // return await ctx.db..create({
      //   data: {
      //     userId: ctx.session.user.id,
      //     shopAssetId: shopAssetId,
      //   },
      // });
    }),

  // getAllPopularAsset: publicProcedure
  //   .input(
  //     z.object({
  //       limit: z.number(),
  //       // cursor is a reference to the last item in the previous batch
  //       // it's used to fetch the next batch
  //       cursor: z.number().nullish(),
  //       skip: z.number().optional(),
  //     }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const { limit, skip, cursor } = input;
  //     const items = await ctx.db.shopAsset.findMany({
  //       take: limit + 1,
  //       skip: skip,
  //       cursor: cursor ? { id: cursor } : undefined,
  //       orderBy: { UserShopAsset: { _count: "desc" } },
  //       include: { asset: { select: { code: true, issuer: true } } },
  //     });

  //     let nextCursor: typeof cursor | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop(); // return the last item from the array
  //       nextCursor = nextItem?.id;
  //     }

  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),

  // getUserShopAsset: protectedProcedure.query(async ({ ctx }) => {
  //   return await ctx.db.userShopAsset.findMany({
  //     where: { userId: ctx.session.user.id },
  //     include: {
  //       shopAsset: {
  //         include: { asset: { select: { code: true, issuer: true } } },
  //       },
  //     },
  //   });
  // }),

  myAssets: creatorProcedure.query(async ({ ctx }) => {
    const shopAsset = await ctx.db.asset.findMany({
      where: { creatorId: ctx.session.user.id },
      select: { code: true, issuer: true, thumbnail: true, id: true },
    });

    const pageAsset = await ctx.db.creatorPageAsset.findUnique({
      where: { creatorId: ctx.session.user.id },
      select: { code: true, issuer: true, creatorId: true, thumbnail: true },
    });

    return { shopAsset, pageAsset };
  }),

  getCreatorAsset: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { creatorId } = input;
      return await ctx.db.creatorPageAsset.findUnique({
        where: { creatorId: creatorId },
        select: { code: true, issuer: true },
      });
    }),
});
