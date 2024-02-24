import React, { useEffect, useState } from "react";
import LeftBar from "./left-sidebar";
import RightBar from "./right-sidebar";
import BottomNav from "./mobile/bottom-nav";
import TopNav from "./mobile/top-nav";
import { ConnectWalletButton } from "package/connect_wallet";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import Header from "./header";

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { data } = useSession();

  return (
    <div className={clsx(" flex h-screen flex-col", className)}>
      <Header />

      <div className="flex-1 overflow-auto bg-base-100/50">
        <div className="flex h-full border-t-2">
          <LeftBar />
          <div className="flex-1 border-x-2 ">
            <div className="h-full overflow-y-auto bg-base-100/80 scrollbar-hide">
              {data?.user.id ? (
                <>{children}</>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ConnectWalletButton />
                </div>
              )}
              {/* <BottomNav /> */}
            </div>
          </div>

          <RightBar />
        </div>
      </div>
    </div>
  );
}
