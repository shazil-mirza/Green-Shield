
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password?: string) => Promise<void>; // Added name
  fetchCurrentUser: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const performFetchCurrentUser = async (tokenFromStorage?: string | null) => {
    setIsLoading(true);
    let tokenToUse: string | null = null;

    try {
      tokenToUse = tokenFromStorage || localStorage.getItem('greenShieldToken');
    } catch (e) {
      console.warn("Warning: Could not access localStorage to get token. User session may not persist.", e);
      tokenToUse = null; 
    }

    if (tokenToUse) {
      try {
        const data = await apiService.get<User>('/auth/me'); 
        if (data) {
          setUser({ ...data, token: tokenToUse }); 
          setIsAuthenticated(true);
        } else {
          try { localStorage.removeItem('greenShieldToken'); } catch (e) { console.warn("Warning: Could not remove token from localStorage.", e); }
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) { 
        console.error('Failed to fetch current user:', error);
        try { localStorage.removeItem('greenShieldToken'); } catch (e) { console.warn("Warning: Could not remove token from localStorage after API fail.", e); }
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    performFetchCurrentUser();
  }, []);


  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.post<{ user: User; token: string }>('/auth/login', { email, password }); 
      try {
        localStorage.setItem('greenShieldToken', response.token);
      } catch (e) {
        console.warn("Warning: Could not save token to localStorage during login. User session may not persist.", e);
      }
      await performFetchCurrentUser(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      try { localStorage.removeItem('greenShieldToken'); } catch (e) { console.warn("Warning: Could not remove token from localStorage after login fail.", e); }
      setUser(null);
      setIsAuthenticated(false);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password?: string) => { 
    setIsLoading(true);
    try {
      const response = await apiService.post<{ user: User; token: string }>('/auth/signup', { name, email, password }); 
      try {
        localStorage.setItem('greenShieldToken', response.token);
      } catch (e) {
        console.warn("Warning: Could not save token to localStorage during signup. User session may not persist.", e);
      }
      await performFetchCurrentUser(response.token);
    } catch (error) {
      console.error('Signup failed:', error);
      try { localStorage.removeItem('greenShieldToken'); } catch (e) { console.warn("Warning: Could not remove token from localStorage after signup fail.", e); }
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('greenShieldToken');
    } catch (e) {
      console.warn("Warning: Could not remove token from localStorage during logout.", e);
    }
  };
  
  const fetchCurrentUser = async () => {
    await performFetchCurrentUser();
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, signup, isLoading, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
