const DAY_PREFIX_PATTERN = /^Day\s+\d+\s*:\s*/i;

/** Remove a leading "Day N:" prefix from a stored day title. */
export function stripDayPrefix(title: string): string {
  return title.replace(DAY_PREFIX_PATTERN, "").trim();
}

/** Format a day heading as "Day N: Title" without duplicating the prefix. */
export function formatDayHeading(dayNumber: number, title: string): string {
  const cleanTitle = stripDayPrefix(title);
  return cleanTitle ? `Day ${dayNumber}: ${cleanTitle}` : `Day ${dayNumber}`;
}
