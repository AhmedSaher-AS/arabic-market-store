export const DOWNLOAD_EVENT_RETENTION_DAYS = 365;

export function downloadEventCleanupBefore(now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - DOWNLOAD_EVENT_RETENTION_DAYS);
  return cutoff;
}
