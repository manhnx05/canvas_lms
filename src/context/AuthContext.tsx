import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/src/types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('canvas_user');
      const token = localStorage.getItem('canvas_token');
      
      if (saved && token) {
        const user = JSON.parse(saved);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      localStorage.removeItem('canvas_user');
      localStorage.removeItem('canvas_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (user: User, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('canvas_user', JSON.stringify(user));
    localStorage.setItem('canvas_token', token);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('canvas_user');
    localStorage.removeItem('canvas_token');
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
