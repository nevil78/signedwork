import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Edit2, 
  Check, 
  X, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle2,
  Lock,
  Unlock 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EmailStatus {
  isVerified: boolean;
  email?: string;
}

interface EmailRecord {
  id: string;
  email: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

export function DelayedEmailManager() {
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get email verification status
  const { data: emailStatus, isLoading: statusLoading } = useQuery<EmailStatus>({
    queryKey: ["/api/secure-email/verification-status"],
    retry: false,
  });

  // Get user emails (verified and unverified)
  const { data: userEmails, isLoading: emailsLoading } = useQuery<EmailRecord[]>({
    queryKey: ["/api/secure-email/user-emails"],
    retry: false,
  });

  // Update unverified email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/secure-email/update-unverified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update email");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Updated",
        description: "Your email has been updated successfully. You can continue editing it freely until verification is required.",
      });
      setIsEditing(false);
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/secure-email/verification-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/secure-email/user-emails"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    },
  });

  // Trigger email verification mutation
  const triggerVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/secure-email/require-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to require verification");
      }
      return response.json();
    },
    onSuccess: (data: { requiresVerification: boolean; verificationToken?: string }) => {
      if (data.requiresVerification) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email and click the verification link to complete the process.",
        });
      } else {
        toast({
          title: "Already Verified",
          description: "Your email is already verified.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/secure-email/verification-status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = () => {
    setNewEmail(emailStatus?.email || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewEmail("");
  };

  const handleSaveEmail = () => {
    if (!newEmail.trim()) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (newEmail === emailStatus?.email) {
      handleCancelEdit();
      return;
    }

    updateEmailMutation.mutate(newEmail);
  };

  const handleVerifyNow = () => {
    triggerVerificationMutation.mutate();
  };

  if (statusLoading || emailsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="delayed-email-manager">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Email Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Email:</span>
              {emailStatus?.isVerified ? (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  <Lock className="h-3 w-3 mr-1" />
                  Verified & Locked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                  <Unlock className="h-3 w-3 mr-1" />
                  Unverified - Editable
                </Badge>
              )}
            </div>
          </div>

          {/* Email Display/Edit */}
          {isEditing ? (
            <div className="space-y-3">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                data-testid="input-new-email"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSaveEmail}
                  disabled={updateEmailMutation.isPending}
                  size="sm"
                  data-testid="button-save-email"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {updateEmailMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  size="sm"
                  data-testid="button-cancel-edit"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-mono text-sm" data-testid="current-email">
                {emailStatus?.email || "No email set"}
              </span>
              {!emailStatus?.isVerified && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleStartEdit}
                  data-testid="button-edit-email"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Verification Status & Actions */}
        {emailStatus?.isVerified ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Your email is verified and locked as your primary email. To change it, you'll need to use the secure change process with password confirmation and 2FA.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Email not verified yet.</strong> You can edit it freely now, but verification will be required for critical actions like:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Applying to jobs</li>
                  <li>Submitting work entries</li>
                  <li>Receiving payments</li>
                  <li>Company verification requests</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleVerifyNow}
              disabled={triggerVerificationMutation.isPending}
              className="w-full"
              data-testid="button-verify-email"
            >
              <Shield className="h-4 w-4 mr-2" />
              {triggerVerificationMutation.isPending ? "Sending..." : "Verify Email Now"}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <Clock className="h-3 w-3 inline mr-1" />
              Once verified, this email becomes locked and changes require additional security steps
            </div>
          </div>
        )}

        {/* Email History (if available) */}
        {userEmails && userEmails.length > 1 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Email History</h4>
            <div className="space-y-2">
              {userEmails.map((email) => (
                <div 
                  key={email.id} 
                  className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                >
                  <span className="font-mono">{email.email}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={email.verifiedAt ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {email.verifiedAt ? "Verified" : "Unverified"}
                    </Badge>
                    <span className="text-gray-400">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}