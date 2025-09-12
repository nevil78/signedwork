import { useEffect, useState } from 'react';

/**
 * Custom hook to provide consistent auto-refresh settings across employee pages
 */
export const useAutoRefresh = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh intervals - DISABLED to fix API flooding
  const intervals = {
    profile: false,
    dashboard: false,
    companies: false,
    workEntries: false,
    session: false,
    auth: false,
    analytics: false,
    insights: false,
    jobSearch: false,
    savedJobs: false,
    applications: false,
    recommendations: false,
    trendingSkills: false,
  };

  // Default query options for auto-refresh - ALL DISABLED
  const getRefreshOptions = (type: keyof typeof intervals) => ({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
  });

  return {
    intervals,
    getRefreshOptions,
    isOnline,
  };
};

export default useAutoRefresh;