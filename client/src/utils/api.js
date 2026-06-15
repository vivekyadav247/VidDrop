// API base URL — uses Vite proxy in dev, full URL in production
const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch video/audio metadata for a given URL
 */
export async function fetchMediaInfo(url) {
  const res = await fetch(`${API_BASE}/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to retrieve media information.');
  return data;
}

/**
 * Start a background download, returns { downloadId }
 */
export async function startDownload({ url, quality, formatType, title, thumbnail }) {
  const res = await fetch(`${API_BASE}/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, quality, formatType, title, thumbnail }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start download process.');
  return data;
}

/**
 * Returns an EventSource connected to the SSE progress stream
 */
export function createProgressStream(downloadId) {
  return new EventSource(`${API_BASE}/download/progress/${downloadId}`);
}

/**
 * Cancel an active download
 */
export async function cancelDownload(downloadId) {
  const res = await fetch(`${API_BASE}/download/cancel/${downloadId}`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cancel download.');
  return data;
}

/**
 * Returns the URL to trigger the file download
 */
export function getFileDownloadUrl(downloadId) {
  return `${API_BASE}/download/file/${downloadId}`;
}

/**
 * Simple URL validation
 */
export function isValidUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
