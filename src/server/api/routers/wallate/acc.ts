import { z } from "zod";
import {
  accountBalances,
  accountDetailsWithHomeDomain,
  getAccountInfos,
} from "~/lib/stellar/marketplace/test/acc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "~/server/api/trpc";
import { AssetSelectAllProperty } from "../marketplace/marketplace";
import { get } from "http";

export const accRouter = createTRPCRouter({
  getAccountInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    const { tokens: assets } = await accountDetailsWithHomeDomain({
      userPub: userId,
    });

    const dbAssets = await ctx.db.asset.findMany({
      where: {
        OR: assets.map((asset) => ({
          code: asset.code,
          issuer: asset.issuer,
        })),
      },
      select: AssetSelectAllProperty,
    });

    const accAssets = assets.filter((asset) => {
      return dbAssets.some((dbAsset) => {
        return dbAsset.code === asset.code && dbAsset.issuer === asset.issuer;
      });
    });

    return { dbAssets, accAssets };
  }),

  getAccountBalance: protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await getAccountInfos(userId);
  }),

  getUserPubAssetBallances: protectedProcedure.query(async ({ ctx, input }) => {
    const pubkey = ctx.session.user.id;

    return await accountBalances({ userPub: pubkey });
  }),

  getCreatorStorageInfo: protectedProcedure.query(async ({ ctx, input }) => {
    const creatorId = ctx.session.user.id;
    const storage = await ctx.db.creator.findUnique({
      where: { id: creatorId },
      select: { storagePub: true, storageSecret: true },
    });
    if (!storage?.storagePub) {
      throw new Error("storage does not exist");
    }

    const { tokens: assets } = await accountDetailsWithHomeDomain({
      userPub: storage.storagePub,
    });

    const dbAssets = await ctx.db.asset.findMany({
      where: {
        OR: assets.map((asset) => ({
          code: asset.code,
          issuer: asset.issuer,
        })),
      },
      select: AssetSelectAllProperty,
    });

    const accAssets = assets.filter((asset) => {
      return dbAssets.some((dbAsset) => {
        return dbAsset.code === asset.code && dbAsset.issuer === asset.issuer;
      });
    });

    return { dbAssets, accAssets };
  }),

  getAStorageAssetInMarket: protectedProcedure
    .input(z.object({ code: z.string(), issuer: z.string() }))
    .query(async ({ ctx, input }) => {
      const creatorId = ctx.session.user.id;
      return await ctx.db.marketAsset.findFirst({
        where: {
          placerId: creatorId,
          asset: { code: input.code, issuer: input.issuer },
        },
      });
    }),
});
