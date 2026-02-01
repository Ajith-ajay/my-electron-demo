import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadComp from '../components/LoadComp';

export const ProtectedRoute = ({ children, roles = [] }) => {
  const navigate = useNavigate();
  const { auth, validateSession, logout } = useAuth();
  const [isInitialValidating, setIsInitialValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const hasValidatedOnce = useRef(false);

  useEffect(() => {
    const checkSession = async (isInitialCheck = false) => {
      // Only show loading screen on initial check
      if (isInitialCheck) {
        setIsInitialValidating(true);
      }

      // Check if user is logged in
      if (!auth) {
        navigate('/', { replace: true });
        setIsInitialValidating(false);
        return;
      }

      // Check if backend is still running (silently in background after first check)
      const isSessionValid = await validateSession();
      
      if (!isSessionValid) {
        logout();
        navigate('/', { replace: true });
        setIsInitialValidating(false);
        return;
      }

      // Check role if specified
      if (roles.length > 0 && !roles.includes(auth.role)) {
        navigate('/', { replace: true });
        setIsInitialValidating(false);
        return;
      }

      setIsValid(true);
      if (isInitialCheck) {
        setIsInitialValidating(false);
        hasValidatedOnce.current = true;
      }
    };

    // Initial validation on mount
    if (!hasValidatedOnce.current) {
      checkSession(true);
    }

    // Re-validate session every 60 seconds (silently in background)
    const interval = setInterval(() => checkSession(false), 60000);

    return () => clearInterval(interval);
  }, [auth, navigate, validateSession, logout, roles]);

  // Only show loading screen during initial validation
  if (isInitialValidating && !hasValidatedOnce.current) {
    return <LoadComp txt="Validating session..." />;
  }

  if (!isValid && hasValidatedOnce.current === false) {
    return null;
  }

  return children;
};
