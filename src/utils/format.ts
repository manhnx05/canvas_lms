/**
 * format – shared formatting utilities to avoid duplication across components.
 */

/** Format file size in human-readable form */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

/** Check whether a MIME type is an image */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/** Format a Date to a short Vietnamese-friendly string */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Format a Date to HH:MM time string */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
