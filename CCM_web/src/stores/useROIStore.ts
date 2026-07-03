import { create } from "zustand";

type Box = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number[];
};

type State = {
  boxes: Box[];
  selectedId: number | null;
  setBoxes: (b: Box[]) => void;
  updateBox: (id: number, data: Partial<Box>) => void;
  selectBox: (id: number) => void;
};

export const useROIStore = create<State>((set) => ({
  boxes: [],
  selectedId: null,

  setBoxes: (b) => set({ boxes: b }),

  updateBox: (id, data) =>
    set((state) => ({
      boxes: state.boxes.map((b) =>
        b.id === id ? { ...b, ...data } : b
      ),
    })),

  selectBox: (id) => set({ selectedId: id }),
}));