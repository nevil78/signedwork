import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Star } from 'lucide-react';
import { TourConfig } from '@/components/GuidedTour';
import { hasCompletedTour, shouldShowTourPrompt } from '@/hooks/useTour';

interface TourButtonProps {
  tour: TourConfig;
  onStartTour: (tourId: string) => void;
  variant?: 'default' | 'outline' | 'ghost' | 'minimal';
  size?: 'sm' | 'default' | 'lg';
  showBadge?: boolean;
}

export default function TourButton({ 
  tour, 
  onStartTour, 
  variant = 'default',
  size = 'default',
  showBadge = true
}: TourButtonProps) {
  const isCompleted = hasCompletedTour(tour.id);
  const shouldShow = shouldShowTourPrompt(tour.id);

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onStartTour(tour.id)}
        className="h-6 text-xs px-2"
      >
        <Play className="h-3 w-3 mr-1" />
        Take Tour
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium">{tour.title}</h4>
          <p className="text-xs text-gray-600">{tour.description}</p>
        </div>
        <Button
          variant={variant}
          size={size}
          onClick={() => onStartTour(tour.id)}
          className="ml-4"
        >
          <Play className="h-4 w-4 mr-1" />
          {isCompleted ? 'Retake Tour' : 'Start Tour'}
        </Button>
      </div>
      
      {showBadge && (
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs h-5">
            <Clock className="h-3 w-3 mr-1" />
            {tour.estimatedDuration}
          </Badge>
          <Badge variant="outline" className="text-xs h-5">
            <Star className="h-3 w-3 mr-1" />
            {tour.category}
          </Badge>
          {isCompleted && (
            <Badge variant="default" className="text-xs h-5 bg-green-100 text-green-800">
              ✓ Completed
            </Badge>
          )}
          {shouldShow && (
            <Badge variant="default" className="text-xs h-5 bg-blue-100 text-blue-800">
              📍 Recommended
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}