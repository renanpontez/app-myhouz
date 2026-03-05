export type MemberRole = "owner" | "member" | "guest";

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMemberWithProfile extends HouseholdMember {
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface HouseholdWithRole {
  household: Household;
  role: MemberRole;
}
