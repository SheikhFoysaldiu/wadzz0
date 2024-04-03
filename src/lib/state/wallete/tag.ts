import { create } from "zustand";

interface TagState {
  selectedTag?: string;
  selectTag: (tag?: string) => void;
}

export const useTagStore = create<TagState>((set, get) => ({
  selectedTag: "bandcoin",
  selectTag: (tag) => set({ selectedTag: tag }),
}));
