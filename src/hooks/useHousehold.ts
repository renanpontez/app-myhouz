import { useCallback, useEffect } from "react";
import { useHouseholdStore } from "@/stores";
import { getHttpClient } from "@/core/config";
import { API } from "@/data/api/endpoints";
import { useAuthStore } from "@/stores";
import type {
  Household,
  HouseholdMemberWithProfile,
  HouseholdWithRole,
  MemberRole,
} from "@/domain/models";

interface MembersResponse {
  data: HouseholdMemberWithProfile[];
}

interface HouseholdDetailResponse {
  data: Household;
}

interface HouseholdsResponse {
  data: HouseholdWithRole[];
}

export function useHousehold() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const {
    activeHouseholdId,
    household,
    members,
    role,
    setActiveHouseholdId,
    setHousehold,
    setMembers,
    setRole,
    isOwner,
    reset,
  } = useHouseholdStore();

  const httpClient = getHttpClient();

  const fetchHousehold = useCallback(async () => {
    if (!activeHouseholdId) return;

    try {
      const endpoints = API.household(activeHouseholdId);

      const [householdRes, membersRes] = await Promise.all([
        httpClient.get<HouseholdDetailResponse>(endpoints.detail),
        httpClient.get<MembersResponse>(endpoints.members.list),
      ]);

      setHousehold(householdRes.data.data);
      setMembers(membersRes.data.data);

      // Determine role from members list
      const { user } = useAuthStore.getState();
      if (user) {
        const myMembership = membersRes.data.data.find(
          (m) => m.user_id === user.id,
        );
        setRole((myMembership?.role as MemberRole) ?? null);
      }
    } catch (error: any) {
      console.error("Failed to fetch household:", error);
      // If 403 Forbidden, the activeHouseholdId is stale (wrong user) — reset it
      if (error?.response?.status === 403) {
        console.warn("Household access forbidden — resetting stale household ID");
        reset();
      }
    }
  }, [activeHouseholdId, httpClient, setHousehold, setMembers, setRole, reset]);

  const fetchHouseholds = useCallback(async (): Promise<HouseholdWithRole[]> => {
    try {
      const response = await httpClient.get<HouseholdsResponse>(
        API.user.households,
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to fetch households:", error);
      return [];
    }
  }, [httpClient]);

  const switchHousehold = useCallback(
    (householdId: string) => {
      setActiveHouseholdId(householdId);
    },
    [setActiveHouseholdId],
  );

  // Auto-fetch household data when activeHouseholdId changes
  // Gate on isInitialized to prevent 401s before auth session is ready
  useEffect(() => {
    if (isInitialized && isAuthenticated && activeHouseholdId) {
      fetchHousehold();
    }
  }, [isInitialized, isAuthenticated, activeHouseholdId, fetchHousehold]);

  return {
    activeHouseholdId,
    household,
    members,
    role,
    isOwner: isOwner(),
    setActiveHouseholdId,
    switchHousehold,
    fetchHousehold,
    fetchHouseholds,
    reset,
  };
}
