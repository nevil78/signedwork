import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Play, Clock, Users } from 'lucide-react';
import { shouldShowTourPrompt, hasCompletedTour } from '@/hooks/useTour';
import { getToursByUserType } from '@/data/tourConfigs';

interface QuickTourPromptProps {
  userType: 'employee' | 'company' | 'manager';
  onStartTour: (tourId: string) => void;
  onDismiss?: () => void;
}

export default function QuickTourPrompt({ userType, onStartTour, onDismiss }: QuickTourPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentTourIndex, setCurrentTourIndex] = useState(0);

  // Get tours for user type
  const tours = getToursByUserType(userType);
  const recommendedTours = tours.filter(tour => shouldShowTourPrompt(tour.id));

  // Check if user has completed basic tour
  const hasCompletedBasicTour = hasCompletedTour('platform-overview');

  useEffect(() => {
    // Don't show if user has dismissed or has no recommended tours
    if (recommendedTours.length === 0 || isDismissed) {
      return;
    }

    // Auto-cycle through recommended tours every 10 seconds
    const interval = setInterval(() => {
      setCurrentTourIndex(prev => (prev + 1) % recommendedTours.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [recommendedTours.length, isDismissed]);

  // Don't show if user completed basic tour or no tours to show
  if (hasCompletedBasicTour || recommendedTours.length === 0 || isDismissed) {
    return null;
  }

  const currentTour = recommendedTours[currentTourIndex];

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
    // Remember dismissal for this session
    sessionStorage.setItem('tour_prompt_dismissed', 'true');
  };

  const handleStartTour = () => {
    onStartTour(currentTour.id);
    setIsDismissed(true);
  };

  return (
    <Card className="border-blue-200 bg-blue-50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm text-blue-900">Quick Start Guide</CardTitle>
            <Badge variant="outline" className="text-xs bg-white">
              New User
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-800">
          Take a quick tour to get familiar with {currentTour.title.toLowerCase()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            {currentTour.title}
          </h4>
          <p className="text-xs text-blue-700">
            {currentTour.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs bg-white">
              <Clock className="h-3 w-3 mr-1" />
              {currentTour.estimatedDuration}
            </Badge>
            {recommendedTours.length > 1 && (
              <Badge variant="outline" className="text-xs bg-white">
                {currentTourIndex + 1} of {recommendedTours.length}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDismiss}
              className="text-xs h-7 bg-white"
            >
              Maybe Later
            </Button>
            <Button 
              size="sm"
              onClick={handleStartTour}
              className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-3 w-3 mr-1" />
              Start Tour
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}