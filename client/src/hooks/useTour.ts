import { useState, useCallback } from 'react';
import { TourConfig } from '@/components/GuidedTour';
import { getTourById } from '@/data/tourConfigs';

interface UseTourReturn {
  activeTour: TourConfig | null;
  isTourActive: boolean;
  startTour: (tourId: string, userType: 'employee' | 'company' | 'manager') => void;
  completeTour: () => void;
  skipTour: () => void;
  closeTour: () => void;
}

export function useTour(): UseTourReturn {
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null);

  const startTour = useCallback((tourId: string, userType: 'employee' | 'company' | 'manager') => {
    const tour = getTourById(tourId, userType);
    if (tour) {
      setActiveTour(tour);
      
      // Store tour progress in localStorage for persistence
      localStorage.setItem('signedwork_active_tour', JSON.stringify({
        tourId,
        userType,
        startedAt: Date.now()
      }));
    }
  }, []);

  const completeTour = useCallback(() => {
    if (activeTour) {
      // Mark tour as completed in localStorage
      const completedTours = JSON.parse(localStorage.getItem('signedwork_completed_tours') || '[]');
      if (!completedTours.includes(activeTour.id)) {
        completedTours.push(activeTour.id);
        localStorage.setItem('signedwork_completed_tours', JSON.stringify(completedTours));
      }
      
      // Clear active tour
      setActiveTour(null);
      localStorage.removeItem('signedwork_active_tour');
    }
  }, [activeTour]);

  const skipTour = useCallback(() => {
    if (activeTour) {
      // Mark tour as skipped
      const skippedTours = JSON.parse(localStorage.getItem('signedwork_skipped_tours') || '[]');
      if (!skippedTours.includes(activeTour.id)) {
        skippedTours.push(activeTour.id);
        localStorage.setItem('signedwork_skipped_tours', JSON.stringify(skippedTours));
      }
      
      // Clear active tour
      setActiveTour(null);
      localStorage.removeItem('signedwork_active_tour');
    }
  }, [activeTour]);

  const closeTour = useCallback(() => {
    // Just close without marking as completed or skipped
    setActiveTour(null);
    localStorage.removeItem('signedwork_active_tour');
  }, []);

  return {
    activeTour,
    isTourActive: activeTour !== null,
    startTour,
    completeTour,
    skipTour,
    closeTour
  };
}

// Helper functions for tour state
export function hasCompletedTour(tourId: string): boolean {
  const completedTours = JSON.parse(localStorage.getItem('signedwork_completed_tours') || '[]');
  return completedTours.includes(tourId);
}

export function hasSkippedTour(tourId: string): boolean {
  const skippedTours = JSON.parse(localStorage.getItem('signedwork_skipped_tours') || '[]');
  return skippedTours.includes(tourId);
}

export function shouldShowTourPrompt(tourId: string): boolean {
  return !hasCompletedTour(tourId) && !hasSkippedTour(tourId);
}