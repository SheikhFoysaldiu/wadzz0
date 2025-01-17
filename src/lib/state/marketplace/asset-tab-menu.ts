import { create } from "zustand";

export enum AssetMenu {
  OWN = "Wallet",
  STORAGE = "Storage",
}

interface MarketMenurState {
  selectedMenu: AssetMenu;
  setSelectedMenu: (menu: AssetMenu) => void;
}

export const useAssetMenu = create<MarketMenurState>((set) => ({
  selectedMenu: AssetMenu.OWN,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
