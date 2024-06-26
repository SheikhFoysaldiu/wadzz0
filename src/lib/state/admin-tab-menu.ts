import { create } from "zustand";

export enum AdminNavigation {
  WALLET = "wallet",
  NFT = "nft",
  ALBUM = "album",
  ADMIN = "admin",
  PINS = "pins",
  CREATORS = "creators",
  USERS = "users",
}

interface MarketMenurState {
  selectedMenu: AdminNavigation;
  setSelectedMenu: (menu: AdminNavigation) => void;
}

export const useAdminMenu = create<MarketMenurState>((set) => ({
  selectedMenu: AdminNavigation.WALLET,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));
