import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery, useApiMutation } from "./useApi";
import { useHouseholdStore } from "@/stores";
import { API } from "@/data/api/endpoints";
import type { HouseholdItem } from "@/domain/models";

interface ItemsResponse {
  data: HouseholdItem[];
}

interface ItemResponse {
  data: HouseholdItem;
}

function useHouseholdIdRef() {
  const { activeHouseholdId } = useHouseholdStore();
  const ref = useRef(activeHouseholdId);
  ref.current = activeHouseholdId;
  return ref;
}

export function useItems(filters?: { type?: string; status?: string }) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).items
    : null;

  let url = endpoints?.list ?? "";
  if (filters) {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  return useApiQuery<ItemsResponse>(
    ["items", activeHouseholdId ?? "", filters?.type ?? "", filters?.status ?? ""],
    url,
    { enabled: !!activeHouseholdId },
  );
}

export function useItem(itemId: string) {
  const { activeHouseholdId } = useHouseholdStore();
  const endpoints = activeHouseholdId
    ? API.household(activeHouseholdId).items
    : null;

  return useApiQuery<ItemResponse>(
    ["item", itemId],
    endpoints?.detail(itemId) ?? "",
    { enabled: !!activeHouseholdId && !!itemId },
  );
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<ItemResponse, Partial<HouseholdItem>>(
    "post",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).items.list;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      },
    },
  );
}

export function useUpdateItem(itemId: string) {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<ItemResponse, Partial<HouseholdItem>>(
    "patch",
    () => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).items.detail(itemId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
        queryClient.invalidateQueries({ queryKey: ["item", itemId] });
      },
    },
  );
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  const idRef = useHouseholdIdRef();

  return useApiMutation<void, string>(
    "delete",
    (itemId) => {
      const id = idRef.current;
      if (!id) return "";
      return API.household(id).items.detail(itemId);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["items"] });
      },
    },
  );
}
