import { create } from "zustand";

type AppState = {
  image: string | null;
  zoom: number;
  setImage: (img: string) => void;
  setZoom: (z: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  image: null,
  zoom: 1,
  setImage: (img) => set({ image: img }),
  setZoom: (z) => set({ zoom: z }),
}));