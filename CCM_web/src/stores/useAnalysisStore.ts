import { create } from "zustand";

export const useAnalysisStore =
create((set)=>({

 patches:[],

 updatePatch:(patch:any)=>
    set((state:any)=>({
      patches:[
        ...state.patches.filter(
          (p:any)=>p.id!==patch.id
        ),
        patch
      ]
    }))
}));