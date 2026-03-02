import { formatDisplayName } from "./format";
import type { HouseholdMemberWithProfile } from "@/domain/models";

export function getMemberName(
  userId: string | null | undefined,
  members: HouseholdMemberWithProfile[],
): string {
  if (!userId) return "";
  const m = members.find((mem) => mem.user_id === userId || mem.id === userId);
  if (!m) return "";
  return formatDisplayName(m.profile.name);
}
