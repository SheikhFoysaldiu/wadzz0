import clsx from "clsx";
import AssetView from "~/components/marketplace/asset/asset_view";
import { MoreAssetsSkeleton } from "~/components/marketplace/bandcoin_nfts";
import { getTailwindScreenSize } from "~/utils/clientUtils";
import { useAssetRightStore } from "~/lib/state/assets_right";
import {
  AssetMenu,
  useAssetMenu,
} from "~/lib/state/marketplace/asset-tab-menu";
import { usePopUpState } from "~/lib/state/right-pop";

import { api } from "~/utils/api";

export default function MyAssetsPage() {
  return (
    <div className="p-5">
      <AssetTabs />
      <RenderTabs />
    </div>
  );
}
function RenderTabs() {
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  switch (selectedMenu) {
    case AssetMenu.OWN:
      return <MyAssets />;
    case AssetMenu.STORAGE:
      return <MyStorageAsset />;
  }
}

function MyStorageAsset() {
  const { setData } = useAssetRightStore();
  const acc = api.wallate.acc.getCreatorStorageInfo.useQuery();

  if (acc.isLoading) return <MoreAssetsSkeleton />;
  if (acc.data)
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="main-asset-area"
      >
        {acc.data.dbAssets.map((asset, i) => {
          return (
            <div key={i}>
              <button
                className="btn relative h-fit w-full overflow-hidden  py-4 "
                onClick={() => {
                  const copies = acc.data.accAssets[i]?.copies ?? 0;
                  setData({ ...asset, copies });
                }}
              >
                {/* <p>{acc.data.accAssets[i]?.copies}</p> */}
                <AssetView code={asset.code} thumbnail={asset.thumbnail} />
              </button>
            </div>
          );
        })}
      </div>
    );
}

function MyAssets() {
  const acc = api.wallate.acc.getAccountInfo.useQuery();
  const { setData } = useAssetRightStore();
  const pop = usePopUpState();

  if (acc.isLoading) return <MoreAssetsSkeleton />;
  if (acc.data)
    return (
      <div
        style={{
          scrollbarGutter: "stable",
        }}
        className="main-asset-area"
      >
        {acc.data.dbAssets.map((asset, i) => {
          // if (asset.copies > 0)
          return (
            <div key={i}>
              <button
                className="btn relative h-fit w-full overflow-hidden  py-4 "
                onClick={() => {
                  const copies = acc.data.accAssets[i]?.copies ?? 0;
                  setData({ ...asset, copies });
                  if (!getTailwindScreenSize().includes("xl")) {
                    pop.setOpen(true);
                  }
                }}
              >
                <AssetView code={asset.code} thumbnail={asset.thumbnail} />
              </button>
            </div>
          );
        })}
      </div>
    );
}

function AssetTabs() {
  const { selectedMenu, setSelectedMenu } = useAssetMenu();
  const { setData } = useAssetRightStore();

  return (
    <div role="tablist" className="tabs-boxed tabs my-5 ">
      {Object.values(AssetMenu).map((key) => {
        return (
          <a
            key={key}
            onClick={handleClick(key)}
            role="tab"
            className={clsx(
              "tab",
              selectedMenu == key && "tab-active text-primary",
              "font-bold",
            )}
          >
            {key}
          </a>
        );
      })}
    </div>
  );

  function handleClick(key: AssetMenu) {
    return () => {
      setSelectedMenu(key);
      setData(undefined);
    };
  }
}
