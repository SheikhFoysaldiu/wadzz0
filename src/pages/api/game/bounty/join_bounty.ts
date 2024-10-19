import { NotificationType } from "@prisma/client";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { getSession } from "next-auth/react";
import NextCors from "nextjs-cors";

import { z } from "zod";

import { db } from "~/server/db";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    await NextCors(req, res, {
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        origin: "*",
        optionsSuccessStatus: 200,
    });

    const session = await getToken({ req });

    console.log(session);
    if (!session) {
        res.status(401).json({
            error: "User is not authenticated",
        });
        return;
    }

    const data = z
        .object({ bountyId: z.string().transform(Number) })
        .safeParse(req.body);

    if (!data.success) {
        res.status(400).json({
            error: data.error,
        });
        return;
    }

    const userId = session.sub;

    if (!userId) {
        return res.status(404).json({
            error: "pubkey not found",
        });
    }

    const bounty = await db.bounty.findUnique({
        where: {
            id: data.data.bountyId,
        },
        include: {
            participants: {
                where: {
                    userId: userId,
                },
            },
        },
    });
    if (bounty?.participants.length) {
        throw new Error("You already joined this bounty");
    }
    if (bounty?.creatorId === userId) {
        throw new Error("You can't join your own bounty");
    }
    await db.bountyParticipant.create({
        data: {
            bountyId: data.data.bountyId,
            userId: userId,
        },
    });

    console.log("Bounty joined successfully");
    if (bounty?.creatorId) {
        await db.notificationObject.create({
            data: {
                actorId: userId,
                entityType: NotificationType.BOUNTY_PARTICIPANT,
                entityId: data.data.bountyId,
                isUser: true,
                Notification: {
                    create: [
                        {
                            notifierId: bounty.creatorId,
                            isCreator: true,
                        },
                    ],
                },
            },
        });
    }

    return res.status(200).json({
        success: true,
        data: "Bounty joined successfully",
    });

}