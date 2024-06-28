import { z } from "zod";
import { createPinFormSchema } from "~/components/maps/modals/create-pin";

import {
  adminProcedure,
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { randomLocation as getLocationInLatLngRad } from "~/utils/map";

export const pinRouter = createTRPCRouter({
  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  createPin: creatorProcedure
    .input(createPinFormSchema.extend({ pageAsset: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const {
        isSinglePin,
        radius,
        pinNumber,
        pinCollectionLimit,
        tokenAmount: totalTokenAmount,
        token: tokenId,
        pageAsset,
      } = input;

      console.log("pageAsset", pageAsset);

      const claimAmount = totalTokenAmount
        ? totalTokenAmount / pinCollectionLimit
        : undefined;

      if (isSinglePin) {
        return await ctx.db.location.create({
          data: {
            claimAmount,
            assetId: tokenId,
            pageAsset: pageAsset,
            autoCollect: input.autoCollect,
            limit: input.pinCollectionLimit,
            endDate: input.endDate,
            latitude: input.lat,
            longitude: input.lng,
            title: input.title,
            creatorId: ctx.session.user.id,
            isActive: true,
            startDate: input.startDate,
            description: input.description,
          },
        });
      } else {
        if (!pinNumber) throw new Error("Pin number is required");
        let claimAmount: number;
        if (totalTokenAmount) {
          const amountPerPin = totalTokenAmount / pinNumber;
          claimAmount = amountPerPin / pinCollectionLimit;
        }

        const locations = Array.from({ length: pinNumber }).map(() => {
          const randomLocatin = getLocationInLatLngRad(
            input.lat,
            input.lng,
            input.radius,
          );
          return {
            claimAmount,
            assetId: tokenId,
            pageAsset: pageAsset,
            autoCollect: input.autoCollect,
            limit: input.pinCollectionLimit,
            endDate: input.endDate,
            latitude: randomLocatin.latitude,
            longitude: randomLocatin.longitude,
            title: input.title,
            creatorId: ctx.session.user.id,
            isActive: true,
            startDate: input.startDate,
            description: input.description,
          };
        });
        console.log(locations);

        await ctx.db.locationGroup.create({
          data: {
            creatorId: ctx.session.user.id,
            locations: {
              createMany: {
                data: locations,
              },
            },
          },
        });
      }
    }),

  getMyPins: creatorProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.location.findMany({
      where: {
        creatorId: ctx.session.user.id,
        endDate: { gte: new Date() },
        approved: { equals: true },
      },
      include: { _count: { select: { consumers: true } } },
    });

    return pins;
  }),

  getPins: adminProcedure.query(async ({ ctx, input }) => {
    const pins = await ctx.db.location.findMany({
      where: { approved: { equals: null }, endDate: { gte: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    return pins;
  }),

  getPinsGrops: adminProcedure.query(async ({ ctx }) => {
    const pins = await ctx.db.locationGroup.findMany({
      include: { locations: true },
    });

    return pins;
  }),

  approvePins: adminProcedure
    .input(z.object({ pins: z.array(z.number()), approved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.location.updateMany({
        where: {
          id: {
            in: input.pins,
          },
        },
        data: {
          approved: input.approved,
        },
      });
    }),

  getConsumedLocated: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const consumedLocations = await ctx.db.locationConsumer.findMany({
      where: {
        userId,
      },
      include: { location: true },
    });
    return consumedLocations;
  }),
});
