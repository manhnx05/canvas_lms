import { useAuthContext } from '../context/AuthContext';
import { User } from '@/src/types';

/**
 * useAuth – centralized access to the current logged-in user via AuthContext.
 */
export function useAuth(): Partial<User> {
  const { currentUser } = useAuthContext();
  return currentUser || {};
}
