import clsx from "clsx";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React from "react";
// import Header from "./header";
// import RightDialog from "./right_dialog";

const RightDialog = dynamic(async () => await import("./right_dialog"));
const ConnectWalletButton = dynamic(
  async () => await import("../components/ui/wallate_button"),
);

const Header = dynamic(async () => await import("./header"));

const RightSideBar = dynamic(async () => await import("./right-sidebar"));
const LeftBar = dynamic(async () => await import("./left-sidebar"));

const BottomPlayerContainer = dynamic(() => import("./music/bottom_player"));
import { X } from "lucide-react";
import { ThemeProvider } from "./providers/theme-provider";
import ModalProvider from "./providers/modal-provider";

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const session = useSession();
  const router = useRouter();

  if (router.pathname === "/maps") {
    return (
      <div className="flex">
        <LeftBar className="hidden lg:flex" />
        {children}
      </div>
    );
  }

  return (
    <>
      <div className={clsx(" flex h-screen flex-col", className)}>
        <Header />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex-1 overflow-auto bg-base-100/50">
            <div className="flex h-full border-t-2">
              <LeftBar className="hidden lg:flex" />
              <div className="flex-1 border-x-2 ">
                <div className=" h-full overflow-y-auto bg-base-100/80 scrollbar-hide">
                  {session.status == "authenticated" ? (
                    <>
                      <ModalProvider />
                      {children}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ConnectWalletButton />
                    </div>
                  )}
                  <div className="h-44 " />
                  {/* <BottomNav /> */}
                </div>
              </div>

              {router.pathname !== "/walletBalance" &&
                session.status == "authenticated" && <RightSideBar />}
            </div>
          </div>
          <RightDialog />
          <BottomPlayerContainer />
        </ThemeProvider>
      </div>
    </>
  );
}
