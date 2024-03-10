import { Sparkle, SwitchCamera } from "lucide-react";
import { useRouter } from "next/router";
import { useConnectWalletStateStore } from "package/connect_wallet";
import { Mode, useMode } from "~/lib/state/fan/left-side-mode";
import { api } from "~/utils/api";

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
      className="btn btn-ghost btn-active w-full  items-center  gap-x-4 "
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
  const user = api.fan.user.getUser.useQuery();
  const handleClick = () => {
    setSelectedMenu(Mode.Creator);
    router.push("/fans/creator");
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
  const creator = api.fan.creator.meCreator.useQuery();

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

export function Profile() {
  const { isAva } = useConnectWalletStateStore();
  const { selectedMenu, getAnotherMenu, toggleSelectedMenu } = useMode();

  const creator = api.fan.creator.meCreator.useQuery();

  if (isAva) {
    if (selectedMenu == Mode.User) {
      return <UserAvater />;
    } else return <CreatorAvater />;
  }
}
