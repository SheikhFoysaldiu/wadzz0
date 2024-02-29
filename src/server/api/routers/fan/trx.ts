import { getAccSecret } from "package/connect_wallet";
import { Asset } from "stellar-sdk";
import { z } from "zod";
import { SignUser, WithSing } from "~/lib/stellar/utils";
import { buyAssetTrx } from "~/lib/stellar/fan/buy_asset";
import { clawBackAccCreate } from "~/lib/stellar/fan/clawback";
import { createAsset } from "~/lib/stellar/fan/create_asset";
import {
  getAssetNumberForXLM,
  getBandcoinPrice,
  getPlatfromAssetPrice,
} from "~/lib/stellar/fan/get_token_price";
import { signXdrTransaction } from "~/lib/stellar/fan/signXDR";
import { getClawbackAsPayment } from "~/lib/stellar/fan/subscribe";
import { AssetSchema } from "~/lib/stellar/fan/utils";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { createStorageTrx } from "~/lib/stellar/fan/create_storage";

export const trxRouter = createTRPCRouter({
  clawbackAssetCreationTrx: protectedProcedure
    .input(z.object({ code: z.string(), signWith: SignUser }))
    .mutation(async ({ ctx, input }) => {
      const { code, signWith } = input;
      const assetAmout = await getAssetNumberForXLM();

      return await clawBackAccCreate({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
        assetCode: code,
        signWith,
      });
    }),

  clawbackAssetPaymentTrx: protectedProcedure
    .input(
      AssetSchema.extend({
        creatorId: z.string(),
        price: z.number(),
        signWith: SignUser,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const price = input.price.toString();
      const xdr = await getClawbackAsPayment({
        creatorId: input.creatorId,
        price: price,
        assetInfo: input,
        userPubkey: ctx.session.user.id,
      });

      return await WithSing({ xdr, signWith: input.signWith });
    }),

  createAssetTrx: protectedProcedure
    .input(
      z.object({ code: z.string(), limit: z.number(), signWith: SignUser }),
    )
    .mutation(async ({ ctx, input }) => {
      const assetAmout = await getAssetNumberForXLM();

      return await createAsset({
        actionAmount: assetAmout.toString(),
        pubkey: ctx.session.user.id,
        code: input.code,
        limit: input.limit,
        signWith: input.signWith,
      });
    }),

  buyAssetTrx: protectedProcedure
    .input(
      AssetSchema.extend({
        signWith: SignUser,
        price: z.number(),
        creatorId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const price = input.price.toString();
      const customerPubkey = ctx.session.user.id; // is the custeomr
      const xdr = await buyAssetTrx({
        customerPubkey,
        assetType: input,
        creatorId: input.creatorId,
        price: price,
      });

      return await WithSing({ xdr, signWith: input.signWith });
    }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getAssetPrice: publicProcedure.query(async () => {
    return await getPlatfromAssetPrice();
  }),

  getAssetNumberforXlm: publicProcedure
    .input(z.number().optional())
    .query(async ({ input }) => {
      return await getAssetNumberForXLM(input);
    }),

  signXDRForFbGoogleEmail: protectedProcedure
    .input(z.object({ xdr: z.string(), uid: z.string(), email: z.string() }))
    .query(async ({ ctx, input }) => {
      const { xdr, uid, email } = input;
      const secret = await getAccSecret(uid, email);
      return signXdrTransaction(xdr, secret);
    }),

  createStorageAccount: protectedProcedure.mutation(async ({ ctx }) => {
    return await createStorageTrx({ pubkey: ctx.session.user.id });
  }),
});
