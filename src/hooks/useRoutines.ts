import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "./useApi";
import { useHouseholdStore } from "@/stores";
import { API } from "@/data/api/endpoints";
import type { RoutineTaskWithCompletions } from "@/domain/models";

interface RoutinesResponse {
  data: RoutineTaskWithCompletions[];
}

interface RoutineResponse {
  data: RoutineTaskWithCompletions;
}

/** Keep a ref in sync with the React-hook value so mutation closures always read the latest. */
function useHouseholdIdRef() {
  const { activeHouseholdId } = useHouseholdStore();
  const ref = useRef(activeHouseholdId);
  ref.current = activeHouseholdId;
  return ref;
}

export function useRoutines() {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).routines
    : null;

  const url = endpoints ? `${endpoints.list}?include=completions` : "";

  return useApiQuery<RoutinesResponse>(
    ["routines", activeHouseholdId ?? ""],
    url,
    { enabled: !!activeHouseholdId },
  );
}

export function useRoutine(taskId: string) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).routines
    : null;

  return useApiQuery<RoutineResponse>(
    ["routine", taskId],
    endpoints?.detail(taskId) ?? "",
    { enabled: !!activeHouseholdId && !!taskId },
  );
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<RoutineResponse, Record<string, unknown>>(
    "post",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).routines.list;
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ["routines"] });
      },
    },
  );
}

export function useUpdateRoutine(taskId: string) {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<RoutineResponse, Record<string, unknown>>(
    "patch",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).routines.detail(taskId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["routines"] });
        queryClient.invalidateQueries({ queryKey: ["routine", taskId] });
      },
    },
  );
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<void, string>(
    "delete",
    (taskId) => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).routines.detail(taskId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["routines"] });
      },
    },
  );
}

export function useToggleRoutine() {
  const idRef = useHouseholdIdRef();

  return useApiMutation<RoutineResponse, { taskId: string; date?: string }>(
    "post",
    (vars) => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).routines.toggle(vars.taskId);
    },
  );
}
