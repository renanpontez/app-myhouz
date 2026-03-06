export type ItemType = "buy" | "repair" | "fix";
export type ItemPriority = "low" | "medium" | "high";
export type ItemStatus = "pending" | "in_progress" | "done";

export interface HouseholdItem {
  id: string;
  household_id: string;
  name: string;
  type: ItemType;
  priority: ItemPriority;
  status: ItemStatus;
  assigned_to: string | null;
  added_by: string;
  notes: string | null;
  price: number | null;
  photos: string[] | null;
  link: string | null;
  tags: string[] | null;
  icon: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}
