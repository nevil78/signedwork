import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Edit3, Check, X, Lock, ShieldCheck } from "lucide-react";

interface EditableEmailProps {
  currentEmail: string;
  userId: string;
  userType: "employee" | "company";
}

export function EditableEmail({ currentEmail, userId, userType }: EditableEmailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(currentEmail);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check email verification status
  const { data: verificationStatus } = useQuery({
    queryKey: ["/api/email-verification/status", currentEmail],
    queryFn: () => apiRequest(`/api/email-verification/status?email=${encodeURIComponent(currentEmail)}`),
    refetchInterval: 5000,
  });

  const isVerified = verificationStatus?.isVerified || false;

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const endpoint = userType === "employee" ? "/api/employee/update-email" : "/api/company/update-email";
      return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: "Your email has been updated successfully. You can verify it when ready.",
      });
      setIsEditing(false);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/${userType}/me`] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-verification/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!newEmail || newEmail === currentEmail) {
      setIsEditing(false);
      setNewEmail(currentEmail);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    updateEmailMutation.mutate(newEmail);
  };

  const handleCancel = () => {
    setNewEmail(currentEmail);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">Email Address</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isVerified ? (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Unverified
            </Badge>
          )}
          
          {isVerified && (
            <Lock className="h-4 w-4 text-gray-400" title="Email is locked after verification" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              className="flex-1"
              disabled={updateEmailMutation.isPending}
              data-testid="input-email-edit"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateEmailMutation.isPending}
              data-testid="button-save-email"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={updateEmailMutation.isPending}
              data-testid="button-cancel-email"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-900" data-testid="text-current-email">
              {currentEmail}
            </span>
            
            {!isVerified && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-email"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )}

        {isVerified ? (
          <p className="text-xs text-gray-500">
            <Lock className="h-3 w-3 inline mr-1" />
            Email is locked after verification for security
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            You can edit your email freely until it's verified. Once verified, the email will be locked for security.
          </p>
        )}
      </div>
    </div>
  );
}