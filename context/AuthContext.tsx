
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { mockBackend } from '../services/mockBackend';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check local storage for persisted session id (mock session)
    const storedUserId = localStorage.getItem('auro_session_uid');
    if (storedUserId) {
      mockBackend.getUser(storedUserId)
        .then(user => {
          if (user) {
            setState({ user, isAuthenticated: true, isLoading: false });
          } else {
            setState({ user: null, isAuthenticated: false, isLoading: false });
          }
        })
        .catch(() => {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await mockBackend.login(email, pass);
    localStorage.setItem('auro_session_uid', user.id);
    setState({ user, isAuthenticated: true, isLoading: false });
  };

  const register = async (name: string, email: string, pass: string, referralCode?: string) => {
    const user = await mockBackend.register(name, email, pass, referralCode);
    localStorage.setItem('auro_session_uid', user.id);
    setState({ user, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('auro_session_uid');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const refreshUser = async () => {
    if (state.user) {
      const updatedUser = await mockBackend.getUser(state.user.id);
      if (updatedUser) {
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
