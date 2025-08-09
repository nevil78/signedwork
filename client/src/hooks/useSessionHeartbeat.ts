import { useEffect } from 'react';

export function useSessionHeartbeat() {
  useEffect(() => {
    // Send heartbeat every 10 minutes to keep session alive
    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.warn('Session heartbeat failed:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(heartbeatInterval);
  }, []);
}