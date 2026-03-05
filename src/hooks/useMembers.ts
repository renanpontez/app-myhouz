import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "./useApi";
import { useHouseholdStore } from "@/stores";
import { API } from "@/data/api/endpoints";
import type { HouseholdMemberWithProfile, HouseholdInvite, MemberRole } from "@/domain/models";

interface MembersResponse {
  data: HouseholdMemberWithProfile[];
}

interface InvitesResponse {
  data: HouseholdInvite[];
}

interface InviteResponse {
  data: HouseholdInvite;
}

export function useMembers() {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).members
    : null;

  return useApiQuery<MembersResponse>(
    ["members", activeHouseholdId ?? ""],
    endpoints?.list ?? "",
    { enabled: !!activeHouseholdId },
  );
}

export function useChangeRole() {
  const queryClient = useQueryClient();
  const { activeHouseholdId } = useHouseholdStore();

  return useApiMutation<void, { memberId: string; role: MemberRole }>(
    "patch",
    (vars) => {
      if (!activeHouseholdId) return "";
      return API.household(activeHouseholdId).members.detail(vars.memberId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["members"] });
      },
    },
  );
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { activeHouseholdId } = useHouseholdStore();

  return useApiMutation<void, string>(
    "delete",
    (memberId) => {
      if (!activeHouseholdId) return "";
      return API.household(activeHouseholdId).members.detail(memberId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["members"] });
      },
    },
  );
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).members
    : null;

  return useApiMutation<void, void>("post", endpoints?.leave ?? "", {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}

export function useInvites() {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).invites
    : null;

  return useApiQuery<InvitesResponse>(
    ["invites", activeHouseholdId ?? ""],
    endpoints?.list ?? "",
    { enabled: !!activeHouseholdId },
  );
}

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).invites
    : null;

  return useApiMutation<InviteResponse, { email?: string; role?: string }>(
    "post",
    endpoints?.list ?? "",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["invites"] });
      },
    },
  );
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const { activeHouseholdId } = useHouseholdStore();

  return useApiMutation<void, string>(
    "post",
    (inviteId) => {
      if (!activeHouseholdId) return "";
      return API.household(activeHouseholdId).invites.revoke(inviteId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["invites"] });
      },
    },
  );
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useApiMutation<void, { code: string }>("post", API.invites.accept, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}
