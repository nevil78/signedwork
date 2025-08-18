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

  // Auto-refresh intervals based on data sensitivity
  const intervals = {
    // Critical employee data - refresh frequently
    profile: 45000, // 45 seconds
    dashboard: 30000, // 30 seconds
    companies: 30000, // 30 seconds
    workEntries: 20000, // 20 seconds
    
    // User session and authentication
    session: 60000, // 1 minute
    auth: 60000, // 1 minute
    
    // Analytics and insights
    analytics: 45000, // 45 seconds
    insights: 60000, // 1 minute
    
    // Job-related data
    jobSearch: 5 * 60 * 1000, // 5 minutes
    savedJobs: 60000, // 1 minute
    applications: 45000, // 45 seconds
    recommendations: 3 * 60 * 1000, // 3 minutes
    trendingSkills: 10 * 60 * 1000, // 10 minutes
  };

  // Default query options for auto-refresh
  const getRefreshOptions = (type: keyof typeof intervals) => ({
    refetchInterval: isOnline ? intervals[type] : false, // Only refresh when online
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false, // Don't refresh in background tabs
  });

  return {
    intervals,
    getRefreshOptions,
    isOnline,
  };
};

export default useAutoRefresh;