/**
 * useAuth – centralized access to the current logged-in user.
 * Reads from localStorage so the key is kept in one place.
 */
export function useAuth() {
  try {
    return JSON.parse(localStorage.getItem('canvas_user') || '{}');
  } catch {
    return {};
  }
}
