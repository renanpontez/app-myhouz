export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface HouseholdInvite {
  id: string;
  household_id: string;
  code: string;
  email: string | null;
  role: "member" | "guest";
  status: InviteStatus;
  invited_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}
