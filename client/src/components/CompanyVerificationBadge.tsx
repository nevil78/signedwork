import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { VerificationStatus, verificationStatusLabels, verificationStatusColors } from "@shared/validation";

interface CompanyVerificationBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function CompanyVerificationBadge({ 
  status, 
  size = "md", 
  showText = true 
}: CompanyVerificationBadgeProps) {
  const getIcon = () => {
    const iconSize = size === "sm" ? 12 : size === "md" ? 16 : 20;
    
    switch (status) {
      case "verified":
        return <ShieldCheck size={iconSize} className="text-green-600" />;
      case "pending":
        return <ShieldAlert size={iconSize} className="text-yellow-600" />;
      case "rejected":
        return <ShieldX size={iconSize} className="text-red-600" />;
      default:
        return <Shield size={iconSize} className="text-gray-500" />;
    }
  };

  const getVariant = () => {
    switch (status) {
      case "verified":
        return "default" as const;
      case "pending":
        return "secondary" as const;
      case "rejected":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getBadgeClasses = () => {
    const baseClasses = "flex items-center gap-1";
    const sizeClasses = {
      sm: "text-xs px-1.5 py-0.5",
      md: "text-sm px-2 py-1",
      lg: "text-base px-3 py-1.5"
    };
    
    return `${baseClasses} ${sizeClasses[size]}`;
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={getBadgeClasses()}
      data-testid={`verification-badge-${status}`}
    >
      {getIcon()}
      {showText && (
        <span className="ml-1">{verificationStatusLabels[status]}</span>
      )}
    </Badge>
  );
}