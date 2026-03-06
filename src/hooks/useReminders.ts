import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "./useApi";
import { useHouseholdStore } from "@/stores";
import { API } from "@/data/api/endpoints";
import type { Reminder } from "@/domain/models";

interface RemindersResponse {
  data: Reminder[];
}

interface ReminderResponse {
  data: Reminder;
}

function useHouseholdIdRef() {
  const { activeHouseholdId } = useHouseholdStore();
  const ref = useRef(activeHouseholdId);
  ref.current = activeHouseholdId;
  return ref;
}

export function useReminders(filters?: { status?: string; search?: string }) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).reminders
    : null;

  let url = endpoints?.list ?? "";
  if (filters) {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  return useApiQuery<RemindersResponse>(
    ["reminders", activeHouseholdId ?? "", filters?.status ?? "", filters?.search ?? ""],
    url,
    { enabled: !!activeHouseholdId },
  );
}

export function useReminder(reminderId: string) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).reminders
    : null;

  return useApiQuery<ReminderResponse>(
    ["reminder", reminderId],
    endpoints?.detail(reminderId) ?? "",
    { enabled: !!activeHouseholdId && !!reminderId },
  );
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<ReminderResponse, Record<string, unknown>>(
    "post",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).reminders.list;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reminders"] });
      },
    },
  );
}

export function useUpdateReminder(reminderId: string) {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<ReminderResponse, Record<string, unknown>>(
    "patch",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).reminders.detail(reminderId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reminders"] });
        queryClient.invalidateQueries({ queryKey: ["reminder", reminderId] });
      },
    },
  );
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<void, string>(
    "delete",
    (reminderId) => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).reminders.detail(reminderId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reminders"] });
      },
    },
  );
}

export function useToggleReminder() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<ReminderResponse, string>(
    "post",
    (reminderId) => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).reminders.toggle(reminderId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reminders"] });
      },
    },
  );
}
