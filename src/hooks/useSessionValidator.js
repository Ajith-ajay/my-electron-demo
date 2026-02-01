import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useSessionValidator = (redirectPath = '/') => {
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = async () => {
      const userSession = sessionStorage.getItem('userSession');
      
      // If no session in storage, no need to validate
      if (!userSession) {
        return;
      }

      try {
        // Check if backend is still running
        const response = await fetch('/api/main-backend/check-session', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        // If backend returns 401 or 500, or if fetch fails, backend might be down
        if (!response.ok) {
          // Backend session expired or server restarted
          sessionStorage.clear();
          navigate(redirectPath, { replace: true });
        }
      } catch (error) {
        // Network error or backend is down
        console.warn('Backend check failed:', error.message);
        sessionStorage.clear();
        navigate(redirectPath, { replace: true });
      }
    };

    // Check session immediately on mount
    validateSession();

    // Check session every 30 seconds
    const intervalId = setInterval(validateSession, 30000);

    return () => clearInterval(intervalId);
  }, [navigate, redirectPath]);
};
