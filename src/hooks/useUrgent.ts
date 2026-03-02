import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "./useApi";
import { useHouseholdStore } from "@/stores";
import { API } from "@/data/api/endpoints";
import type { UrgentProblem } from "@/domain/models";

interface UrgentResponse {
  data: UrgentProblem[];
}

interface UrgentDetailResponse {
  data: UrgentProblem;
}

function useHouseholdIdRef() {
  const { activeHouseholdId } = useHouseholdStore();
  const ref = useRef(activeHouseholdId);
  ref.current = activeHouseholdId;
  return ref;
}

export function useUrgentProblems(filters?: { active?: boolean }) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).urgent
    : null;

  let url = endpoints?.list ?? "";
  if (filters?.active !== undefined) url += `?active=${filters.active}`;

  return useApiQuery<UrgentResponse>(
    ["urgent", activeHouseholdId ?? "", String(filters?.active ?? "")],
    url,
    { enabled: !!activeHouseholdId },
  );
}

export function useUrgentProblem(problemId: string) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).urgent
    : null;

  return useApiQuery<UrgentDetailResponse>(
    ["urgent", problemId],
    endpoints?.detail(problemId) ?? "",
    { enabled: !!activeHouseholdId && !!problemId },
  );
}

export function useCreateUrgentProblem() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<UrgentDetailResponse, Record<string, unknown>>(
    "post",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).urgent.list;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["urgent"] });
      },
    },
  );
}

export function useResolveUrgentProblem(problemId: string) {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<UrgentDetailResponse, Record<string, unknown>>(
    "patch",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).urgent.detail(problemId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["urgent"] });
      },
    },
  );
}

export function useUpdateUrgentProblem(problemId: string) {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<UrgentDetailResponse, Record<string, unknown>>(
    "patch",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).urgent.detail(problemId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["urgent"] });
        queryClient.invalidateQueries({ queryKey: ["urgent", problemId] });
      },
    },
  );
}

export function useDeleteUrgentProblem() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<void, string>(
    "delete",
    (problemId) => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).urgent.detail(problemId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["urgent"] });
      },
    },
  );
}
