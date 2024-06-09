import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import internal from "stream";
import { db } from "~/server/db";
import { Brand } from "~/types/game/brand";

// import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getSession({ req });

  // Check if the user is authenticated
  if (!session) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }

  const follows = await db.follow.findMany({
    where: { userId: session.user.id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          profileUrl: true,
          pageAsset: { select: { code: true, thumbnail: true } },
        },
      },
    },
  });

  const bands: Brand[] = follows.map((follow) => {
    const brand = follow.creator;
    return {
      id: brand.id,
      first_name: brand.name,
      last_name: brand.name,
      email: "",
      logo: brand.pageAsset?.thumbnail ?? "https://picsum.photos/200/300",
      followed_by_current_user: true,
    };
  });

  res.status(200).json({ users: bands });
}
