import React from "react";
// import Hamburger from "./hamburger";
import { ConnectWalletButton } from "package/connect_wallet";

import Logo from "./logo";
import { Hammer } from "lucide-react";
import { MobileHeaderAvater } from "./mobile/top-nav";
import Hamburger from "./hamburger";

interface HeaderProps {
  key?: React.Key;
}

function Header(_props: HeaderProps) {
  return (
    <header className="h-20 bg-base-100/20 px-2 py-4">
      <div
        className={"flex items-center justify-between gap-2  md:justify-center"}
      >
        <div className="flex">
          <div className="md:hidden">
            <Hamburger />
          </div>
          <Logo className="hidden sm:flex" />
        </div>
        <div className="self-end md:hidden">
          {/* <MobileHeaderAvater /> */}
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}

export default Header;
