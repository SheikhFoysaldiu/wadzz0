import { Input } from "~/components/shadcn/ui/input";
import { Button } from "~/components/shadcn/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";

import WBRightSideBar from "~/components/wallet-balance/wb-right-sidebar";
import { useSession } from "next-auth/react";

import { Send } from "lucide-react";
import { useModal } from "~/components/hooks/use-modal-store";
import { api } from "~/utils/api";
import TransactionHistory from "~/components/wallet-balance/transactionHistory";

const Wallets = () => {
  const session = useSession();
  const { onOpen } = useModal();
  const { data, isLoading } =
    api.walletBalance.wallBalance.getNativeBalance.useQuery();

  if (isLoading || !data) {
    return <div>Loading...</div>;
  }

  return (
    <div className=" min-h-screen w-full overflow-hidden lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-semibold md:text-xl">Wallet Balance</h1>
            <Button variant="default" onClick={() => onOpen("send assets")}>
              <Send size={15} className="mr-2" /> SEND ASSETS
            </Button>
          </div>
          <div className="flex flex-col gap-6 md:grid md:grid-cols-6">
            <div className="flex flex-col gap-6 md:col-span-4 lg:col-span-3 xl:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <h1 className="flex items-center text-4xl font-bold">
                    {data?.balance} XLM
                  </h1>
                </CardContent>
              </Card>
              <TransactionHistory />
            </div>
            <div className="flex flex-col gap-6 md:col-span-2 lg:col-span-3 xl:col-span-2">
              <WBRightSideBar />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default Wallets;
