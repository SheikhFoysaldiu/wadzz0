import { add } from "date-fns";
import { z } from "zod";
import { AddAssetTrustLine, BalanceWithHomeDomain, NativeBalance, RecentTransactionHistory, SendAssets } from "~/lib/stellar/walletBalance/acc";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";


export const WBalanceRouter = createTRPCRouter({
  getWalletsBalance : protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await BalanceWithHomeDomain({userPub: userId});

  }),
  getNativeBalance : protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await NativeBalance({userPub: userId});
  }),
  sendWalletAssets :  protectedProcedure
    .input(
       z.object({
      recipientId: z.string().min(1, {
        message: "Recipient Id is required.",
      }),
      amount: z.number().positive({
        message: "Amount must be greater than zero.",
      }),
      asset_code: z.string().min(1, {
        message: "Asset code is required.",
      }),
      asset_type : z.string().min(1, {
        message: "Asset type is required.",
      }),
       asset_issuer : z.string().min(1, {
        message: "Asset Issuer is required.",
      }),
})
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;

      return await SendAssets({ userPubKey: userPubKey, input});
     
    }),

  addTrustLine : protectedProcedure.input(
  z.object({
      // trustLimit: z.number().positive({
      //   message: "Trust Limit must be greater than zero.",
      // }),
      asset_code: z.string().min(1, {
        message: "Asset code is required.",
      }),

       asset_issuer : z.string().min(1, {
        message: "Asset Issuer is required.",
      })
    
}
  ))
  .mutation(async ({ input, ctx }) => {
    const userPubKey = ctx.session.user.id;
    return await AddAssetTrustLine({ userPubKey: userPubKey, input});
  }),

  transactionHistory : protectedProcedure.input(
    z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.number().nullish(), 
    }),
  )
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    return await RecentTransactionHistory ({ userPubKey: userId, input});
  }),



});
