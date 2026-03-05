export interface UrgentProblem {
  id: string;
  household_id: string;
  title: string;
  description: string;
  is_active: boolean;
  reported_by: string;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
}
