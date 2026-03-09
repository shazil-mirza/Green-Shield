import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password?: string) => Promise<void>;
  fetchCurrentUser: () => Promise<void>; // Make it available for manual refresh
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const performFetchCurrentUser = async (tokenFromStorage?: string | null) => {
    setIsLoading(true);
    const tokenToUse = tokenFromStorage || localStorage.getItem('greenShieldToken');

    if (tokenToUse) {
      try {
        // apiService automatically includes the token if found in localStorage
        const data = await apiService.get<User>('/auth/me');
        if (data) {
          setUser({ ...data, token: tokenToUse });
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('greenShieldToken');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        localStorage.removeItem('greenShieldToken');
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
      localStorage.setItem('greenShieldToken', response.token);
      // Fetch full user data after login to get all fields including subscription status
      await performFetchCurrentUser(response.token);
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('greenShieldToken');
      setUser(null);
      setIsAuthenticated(false);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.post<{ user: User; token: string }>('/auth/signup', { email, password });
      localStorage.setItem('greenShieldToken', response.token);
      // Fetch full user data after signup
      await performFetchCurrentUser(response.token);
    } catch (error) {
      console.error('Signup failed:', error);
      localStorage.removeItem('greenShieldToken');
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Optionally call a backend logout endpoint if it exists (e.g., to invalidate refresh tokens)
    // await apiService.post('/auth/logout'); 
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('greenShieldToken');
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