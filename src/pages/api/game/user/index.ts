import type { NextApiRequest, NextApiResponse } from "next";

import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const session = await getSession({ req });

    if (session) {
      // console.log(session.user);
      return res.status(200).json(session.user);
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "An error occurred while processing your request" });
  }
}