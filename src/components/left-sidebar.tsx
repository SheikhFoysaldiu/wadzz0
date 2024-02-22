import {
  ConnectWalletButton,
  useConnectWalletStateStore,
} from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import { Facebook, Instagram, Sparkle, SwitchCamera } from "lucide-react";

import Button from "./ui/button";
import Link from "next/link";
import Logo from "./logo";
import {
  HomeIcon,
  PenSquare,
  Search,
  Settings2,
  Diamond,
  Bell,
  Store,
} from "lucide-react";
import { api } from "~/utils/api";
import { Mode, useMode } from "~/lib/state/left-side-mode";
import { useRouter } from "next/router";
import Image from "next/image";

export const UserNavigation = {
  Home: { path: "/", icon: HomeIcon, text: "HOMEPAGE" },
  // Search: { path: "/search", icon: Search, text: "Search" },
  YourAsset: { path: "/assets", icon: Diamond, text: "MEMORIES" },
  Notification: { path: "/notification", icon: Bell, text: "NOTIFICATION" },
  Settings: { path: "/settings", icon: Settings2, text: "SETTINGS" },
} as const;

export const CreatorNavigation = {
  Page: { path: "/me/creator", icon: PenSquare, text: "Page" },
  Create: { path: "/posts/creator", icon: PenSquare, text: "Create" },
  Store: { path: "/store/creator", icon: Store, text: "Store" },
  Notification: {
    path: "/notification/creator",
    icon: Bell,
    text: "Notification",
  },
  Settings: { path: "/settings/creator", icon: Settings2, text: "Settings" },
} as const;

export default function LeftBar() {
  return (
    <div className="hidden flex-col items-center justify-between   bg-base-100/80 sm:flex sm:w-56 md:w-80">
      <div className="flex w-full flex-1 flex-col items-center gap-2  py-2">
        <div className="w-full flex-1 px-2">
          <NavigationButtons />
        </div>
      </div>
      <div className="flex w-full flex-col items-center px-2 py-4">
        <LeftBottom />
        {/* <ThemeChange /> */}
      </div>
    </div>
  );
}

function ThemeChange() {
  enum themes {
    LIGHT = "light",
    DARK = "forest",
  }
  const [theme, setTheme] = React.useState(themes.LIGHT);

  function toggleTheme() {
    if (theme == themes.LIGHT) setTheme(themes.DARK);
    else setTheme(themes.LIGHT);
  }

  React.useEffect(() => {
    const htmlElement = document.querySelector("html");
    if (!htmlElement) return;
    htmlElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    // <div className="dropdown dropdown-top dropdown-hover   w-full ">
    //   <div tabIndex={0} role="button" className="btn m-1 w-full px-8">
    //     Background Theme
    //   </div>
    //   <ul
    //     tabIndex={0}
    //     className="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
    //   >
    //     {themes.map((theme) => (
    //       <li key={theme}>
    //         <a onClick={() => setTheme(theme)}>{theme}</a>
    //       </li>
    //     ))}
    //   </ul>
    // </div>
    <label className="flex cursor-pointer gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
      <input
        type="checkbox"
        // value="forest"
        onClick={toggleTheme}
        className="theme-controller toggle"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </label>
  );
}

function NavigationButtons() {
  const { selectedMenu, toggleSelectedMenu } = useMode();

  function getNavigation() {
    if (selectedMenu == Mode.Creator) return CreatorNavigation;
    else return UserNavigation;
  }

  return (
    <div className="flex h-full w-full flex-col items-start justify-center gap-2 ">
      {Object.entries(getNavigation()).map(
        ([key, { path, icon: Icon, text }]) => (
          <Link href={path} className="w-full" key={key}>
            <Button
              path={path}
              icon={<Icon className="h-5 w-5" />}
              text={text}
            />
          </Link>
        ),
      )}
      <Profile />
    </div>
  );
}

function ProfileComponent({
  avaterUrl,
  handleModeChange,
  name,
  mode,
}: {
  avaterUrl: string | null;
  handleModeChange: () => void;
  name: string | null;
  mode: Mode;
}) {
  return (
    <div
      className="btn  w-full  items-center  gap-x-4 "
      onClick={handleModeChange}
    >
      <SwitchCamera />
      <p className="">Switch to {mode}</p>
      <Sparkle />
    </div>
  );
}

function UserAvater() {
  const router = useRouter();
  const { setSelectedMenu } = useMode();
  const user = api.user.getUser.useQuery();
  const handleClick = () => {
    setSelectedMenu(Mode.Creator);
    router.push("/me/creator");
  };
  if (user.data) {
    return (
      <ProfileComponent
        handleModeChange={handleClick}
        avaterUrl={user.data.image}
        mode={Mode.Creator}
        name={user.data.name}
      />
    );
  }
}
function CreatorAvater() {
  const router = useRouter();
  const { setSelectedMenu } = useMode();
  const creator = api.creator.meCreator.useQuery();

  const handleClick = () => {
    setSelectedMenu(Mode.User);
    router.push("/");
  };

  return (
    <ProfileComponent
      handleModeChange={handleClick}
      avaterUrl={creator?.data?.profileUrl ?? null}
      mode={Mode.User}
      name={creator?.data?.name ?? "Unknown"}
    />
  );
}

function Profile() {
  const { isAva } = useConnectWalletStateStore();
  const { selectedMenu, getAnotherMenu, toggleSelectedMenu } = useMode();

  const creator = api.creator.meCreator.useQuery();

  if (isAva) {
    if (selectedMenu == Mode.User) {
      return <UserAvater />;
    } else return <CreatorAvater />;
  }
}

function LeftBottom() {
  return (
    <div className="flex w-full flex-col justify-center gap-1">
      <ConnectWalletButton />
      <div className="flex justify-between space-x-2">
        <Link
          href={"https://facebook.com/wadzzo"}
          className="btn flex h-16 flex-col items-center  text-xs normal-case"
          target="_blank"
        >
          <Facebook size={20} />
          <span>Facebook</span>
        </Link>
        <Link
          href={"https://twitter.com/WadzzoApp"}
          className="btn flex h-16 flex-1 flex-col items-center text-xs normal-case "
          target="_blank"
        >
          <Image src="/images/icons/x.svg" alt="X" height={18} width={18} />
          <span>X</span>
        </Link>
        <Link
          href={"https://instagram.com/wadzzo/"}
          className="btn flex h-16 flex-col items-center text-xs normal-case"
          target="_blank"
        >
          <Instagram />
          <span>Instagram</span>
        </Link>
      </div>
      <div className="flex w-full flex-col text-center text-xs text-base-content">
        <p>© 2023 bandcoin.io</p>
        <div className="flex w-full justify-center gap-2 ">
          <Link className="link-hover link" href="/about">
            About
          </Link>
          <Link className="link-hover link" href="/privacy">
            Privacy
          </Link>
        </div>
        <p>v{1.1}</p>
      </div>
    </div>
  );
}
