import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface FeedbackButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function FeedbackButton({ 
  variant = "outline", 
  size = "sm", 
  className = "" 
}: FeedbackButtonProps) {
  const [, navigate] = useLocation();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate("/feedback")}
      className={className}
      data-testid="button-feedback"
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      Feedback
    </Button>
  );
}