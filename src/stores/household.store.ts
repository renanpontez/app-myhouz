import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { getStorage } from "@/core/config";
import type { Household, HouseholdMemberWithProfile, MemberRole } from "@/domain/models";

const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    const value = getStorage().getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    getStorage().setString(name, value);
  },
  removeItem: (name: string) => {
    getStorage().delete(name);
  },
};

interface HouseholdState {
  activeHouseholdId: string | null;
  household: Household | null;
  members: HouseholdMemberWithProfile[];
  role: MemberRole | null;

  setActiveHouseholdId: (id: string | null) => void;
  setHousehold: (household: Household | null) => void;
  setMembers: (members: HouseholdMemberWithProfile[]) => void;
  setRole: (role: MemberRole | null) => void;
  isOwner: () => boolean;
  reset: () => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set, get) => ({
      activeHouseholdId: null,
      household: null,
      members: [],
      role: null,

      setActiveHouseholdId: (activeHouseholdId) => set({ activeHouseholdId }),
      setHousehold: (household) => set({ household }),
      setMembers: (members) => set({ members }),
      setRole: (role) => set({ role }),
      isOwner: () => get().role === "owner",

      reset: () =>
        set({
          activeHouseholdId: null,
          household: null,
          members: [],
          role: null,
        }),
    }),
    {
      name: "household-storage",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        activeHouseholdId: state.activeHouseholdId,
      }),
    },
  ),
);
