import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth from sessionStorage
    const userSession = sessionStorage.getItem('userSession');
    if (userSession) {
      try {
        setAuth(JSON.parse(userSession));
      } catch (error) {
        console.error('Failed to parse user session:', error);
        sessionStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = (sessionData) => {
    sessionStorage.setItem('userSession', JSON.stringify(sessionData));
    setAuth(sessionData);
  };

  const logout = () => {
    sessionStorage.clear();
    setAuth(null);
  };

  const validateSession = async () => {
    try {
      const response = await fetch('/api/main-backend/check-session', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Session validation failed:', error.message);
      logout();
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ auth, isLoading, login, logout, validateSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
