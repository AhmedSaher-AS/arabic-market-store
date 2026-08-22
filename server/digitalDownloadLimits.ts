export function remainingDownloads(maxDownloads: number, downloadCount: number) {
  return maxDownloads === 0 ? null : Math.max(0, maxDownloads - downloadCount);
}

export function isDownloadLimitReached(maxDownloads: number, downloadCount: number) {
  return maxDownloads > 0 && downloadCount >= maxDownloads;
}
