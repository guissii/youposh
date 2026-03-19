import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const generateVisitorId = () => {
  let vid = localStorage.getItem('visitor_id');
  if (!vid) {
    vid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('visitor_id', vid);
  }
  return vid;
};

export const useVisitorTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const visitorId = generateVisitorId();
        // Ignore admin routes
        if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/login')) {
            return;
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        
        await fetch(`${API_URL}/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitorId,
            path: location.pathname + location.search
          }),
        });
      } catch (error) {
        console.error('Failed to track visitor:', error);
      }
    };

    trackVisit();
  }, [location]);
};
