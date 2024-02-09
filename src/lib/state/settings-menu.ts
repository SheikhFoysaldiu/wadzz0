import { create } from "zustand";

export enum SettingsMenu {
  Basic = "Basic",
  Membership = "Memberships",
  Assets = "Assets",
}

interface SettingsMenuState {
  selectedMenu: SettingsMenu;
  setSelectedMenu: (menu: SettingsMenu) => void;
}

export const useSettingsMenu = create<SettingsMenuState>((set) => ({
  selectedMenu: SettingsMenu.Basic,
  setSelectedMenu: (menu) => set({ selectedMenu: menu }),
}));