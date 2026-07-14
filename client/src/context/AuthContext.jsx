import { createContext, useContext, useState, useCallback } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

function decodeUser(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.userId };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => decodeUser(getToken()));

  const login = useCallback(async (email, password) => {
    const { token } = await api.login(email, password);
    setToken(token);
    setUser(decodeUser(token));
  }, []);

  const register = useCallback(async (email, password) => {
    const { token } = await api.register(email, password);
    setToken(token);
    setUser(decodeUser(token));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
