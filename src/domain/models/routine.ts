export type RecurrenceType = "daily" | "weekly" | "monthly" | "weekdays" | "weekends" | "custom";

export type RecurrenceMeta =
  | { type: "days_of_week"; days: number[] }
  | { type: "interval"; every: number; unit: "days" | "weeks" | "months" }
  | null;

export interface RoutineTask {
  id: string;
  household_id: string;
  title: string;
  recurrence: RecurrenceType;
  recurrence_meta: RecurrenceMeta;
  assigned_to: string | null;
  icon: string | null;
  is_active: boolean;
  starts_at: string | null;
  last_completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineTaskCompletion {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
}

export interface RoutineTaskWithCompletions extends RoutineTask {
  completions: RoutineTaskCompletion[];
}
