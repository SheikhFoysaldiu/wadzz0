import { createTRPCRouter } from "~/server/api/trpc";
import { fanRouter } from "./routers/fan/root";
import { musicRouter } from "./routers/music/root";
import { marketplaceRouter } from "./routers/marketplace/root";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  fan: fanRouter,
  music: musicRouter,
  marketplace: marketplaceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
