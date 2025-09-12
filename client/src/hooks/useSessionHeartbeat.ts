import { useEffect } from 'react';

export function useSessionHeartbeat() {
  useEffect(() => {
    // Heartbeat completely disabled to fix API flooding
    // No automatic API calls will be made
  }, []);
}
