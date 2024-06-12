import { sign } from "crypto";
import { add } from "date-fns";
import { z } from "zod";
import { SignUser } from "~/lib/stellar/utils";
import { AddAssetTrustLine, BalanceWithHomeDomain, AcceptClaimableBalance, NativeBalance, PendingAssetList, RecentTransactionHistory, SendAssets, DeclineClaimableBalance } from "~/lib/stellar/walletBalance/acc";

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
      signWith: SignUser,
})
    )
    .mutation(async ({ input, ctx }) => {
      const userPubKey = ctx.session.user.id;
      console.log("USER", ctx.session.user)
      console.log("SignWith", input.signWith)
      return await SendAssets({ userPubKey: userPubKey, 
        recipientId: input.recipientId,
        amount: input.amount,
        asset_code: input.asset_code,
        asset_type: input.asset_type,
        asset_issuer: input.asset_issuer,
        signWith: input.signWith
      });
     
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
      }),
      signWith: SignUser,
    
}
  ))
  .mutation(async ({ input, ctx }) => {
    const userPubKey = ctx.session.user.id;
    return await AddAssetTrustLine({ userPubKey: userPubKey,
      asset_code: input.asset_code,
      asset_issuer: input.asset_issuer,
      signWith: input.signWith
    });
  }),

getTransactionHistory: protectedProcedure.input(
  z.object({
    limit: z.number().min(1).max(100).nullish().default(10),
    cursor: z.string().nullish().default(null), // Ensure cursor is a string
  }),
)
.query(async ({ input, ctx }) => {
  const userId = ctx.session.user.id;
  return await RecentTransactionHistory({ userPubKey: userId, input });
}),

  getPendingAssetList : protectedProcedure.query(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;
    return await PendingAssetList({userPubKey: userId});
  }),

  claimBalance :protectedProcedure.input(
  z.object({
      // trustLimit: z.number().positive({
      //   message: "Trust Limit must be greater than zero.",
      // }),
      balanceId: z.string().min(1, {
        message: "BalanceId is required.",
      }),   
       signWith: SignUser, 
    },
   
  ))
  .mutation(async ({ input, ctx }) => {
    const userPubKey = ctx.session.user.id;
    return await AcceptClaimableBalance({ userPubKey: userPubKey, 
      balanceId: input.balanceId,
      signWith: input.signWith
    });
  }),

declineClaimBalance :protectedProcedure.input(
  z.object({
      // trustLimit: z.number().positive({
      //   message: "Trust Limit must be greater than zero.",
      // }),
      balanceId: z.string().min(1, {
        message: "BalanceId is required.",
      }),  
        signWith: SignUser, 
    }
  ))
  .mutation(async ({ input, ctx }) => {
    const userPubKey = ctx.session.user.id;
    return await DeclineClaimableBalance({ 
      pubKey: userPubKey,
      balanceId: input.balanceId,
      signWith: input.signWith
     });
  }),

});
