/**
 * useSocket – Socket.IO has been removed.
 * Real-time messaging is handled via email notifications (Resend)
 * and 30-second polling on the frontend.
 * This file is kept as an empty stub to avoid import errors.
 */
export function useSocket(_userId: string) {
  return { current: null };
}
