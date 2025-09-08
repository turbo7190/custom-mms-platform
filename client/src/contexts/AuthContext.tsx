import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clientId?: string;
}

interface Client {
  id: string;
  businessName: string;
  businessType: string;
  subscription: {
    plan: string;
    status: string;
    messagesUsed: number;
    messagesLimit: number;
  };
  complianceStatus: string;
}

interface AuthContextType {
  user: User | null;
  client: Client | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await axios.get('/api/auth/profile');
          setUser(response.data.user);
          setClient(response.data.client);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token: newToken, user: userData, client: clientData } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setClient(clientData);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/auth/register', userData);

      const { token: newToken, user: userData: newUser, client: clientData } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setClient(clientData);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setClient(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value: AuthContextType = {
    user,
    client,
    token,
    login,
    register,
    logout,
    loading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
