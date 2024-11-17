import { BASE_URL } from "../common";


export const JoinBounty = async ({ bountyId }: { bountyId: string }) => {
    try {
        const response = await fetch(
            new URL("api/game/bounty/join_bounty", BASE_URL).toString(),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ bountyId: bountyId.toString() }),
            }
        );

        if (!response.ok) {
            throw new Error("Failed to Join Bounty ");
        }

        const data = await response.json() as string;
        return data;
    } catch (error) {
        console.error("Error failed to Join Bounty:", error);
        throw error;
    }
};
