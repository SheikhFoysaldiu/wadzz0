import { getTailwindScreenSize } from "~/lib/clientUtils";
import { MarketAssetType } from "./market_right";
import { useMarketRightStore } from "~/lib/state/marketplace/right";
import AssetView from "./asset/asset_view";

function MarketAssetComponent({ item }: { item: MarketAssetType }) {
  const { thumbnail } = item;

  const urs = useMarketRightStore();
  return (
    <div>
      <button
        onClick={() => {
          urs.setData(item);
          if (!getTailwindScreenSize().includes("xl")) {
            urs.setOpen(true);
          }
        }}
        className="btn relative h-fit w-full overflow-hidden  py-4 "
      >
        <AssetView code={item.code} />
      </button>
    </div>
  );
}

export default MarketAssetComponent;