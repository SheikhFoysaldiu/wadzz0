import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";

export async function EnableCors(req: NextApiRequest, res: NextApiResponse) {
  await NextCors(req, res, {
    // Options
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    origin: "*",
    optionsSuccessStatus: 200,
  });
}
