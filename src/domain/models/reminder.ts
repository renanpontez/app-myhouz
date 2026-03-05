export interface Reminder {
  id: string;
  household_id: string;
  title: string;
  due_at: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}
