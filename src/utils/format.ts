export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** "RENAN MARTINS" → "Renan M." */
export function formatDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const firstPart = parts[0];
  if (!firstPart) return fullName;
  const first = toTitleCase(firstPart);
  if (parts.length === 1) return first;
  const lastPart = parts[parts.length - 1];
  if (!lastPart) return first;
  const lastInitial = lastPart.charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

export function shortDayName(date: Date, locale: string): string {
  const day = date.toLocaleDateString(locale, { weekday: "short" });
  return day.slice(0, 3).toUpperCase();
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}
