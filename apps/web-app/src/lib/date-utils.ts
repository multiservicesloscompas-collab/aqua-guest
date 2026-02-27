export function getSafeTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

export function normalizeTimestamp(
  supabaseTimestamp: string | undefined,
  localTimestamp: string
): string {
  if (!supabaseTimestamp) {
    return localTimestamp;
  }

  const date = new Date(supabaseTimestamp);
  if (isNaN(date.getTime())) {
    return localTimestamp;
  }

  return supabaseTimestamp;
}

export function getSafeTimestampForSorting(timestamp: string): number {
  if (!timestamp) return 0;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

export function compareTimestamps(a: string, b: string): number {
  return getSafeTimestampForSorting(b) - getSafeTimestampForSorting(a);
}
