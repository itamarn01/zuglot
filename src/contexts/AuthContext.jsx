import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const loginUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginUrl, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
