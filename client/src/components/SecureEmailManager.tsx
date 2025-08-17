import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Lock,
  AlertCircle,
  History,
  Key
} from "lucide-react";

// Schema for email change form
const emailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email format"),
  currentPassword: z.string().min(1, "Current password is required"),
  twoFactorCode: z.string().optional(),
});

type EmailChangeFormData = z.infer<typeof emailChangeSchema>;

interface Email {
  id: string;
  email: string;
  status: 'primary' | 'detached' | 'pending_verification';
  verifiedAt?: string;
  detachedAt?: string;
  graceExpiresAt?: string;
  createdAt: string;
}

interface EmailChangeLog {
  id: string;
  oldEmail: string;
  newEmail: string;
  changeType: string;
  timestamp: string;
  status: string;
  ipAddress?: string;
  twoFactorUsed: boolean;
}

export function SecureEmailManager() {
  const [showHistory, setShowHistory] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EmailChangeFormData>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: "",
      currentPassword: "",
      twoFactorCode: "",
    },
  });

  // Fetch user emails
  const { data: userEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/secure-email/user-emails"],
    retry: false,
  });

  // Fetch email change history
  const { data: emailHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/secure-email/change-history"],
    enabled: showHistory,
    retry: false,
  });

  // Email change mutation
  const emailChangeMutation = useMutation({
    mutationFn: async (data: EmailChangeFormData) => {
      const response = await fetch("/api/secure-email/request-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to request email change");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification Sent",
        description: "Please check your new email for verification link.",
      });
      form.reset();
      setShowEmailChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/secure-email/user-emails"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request email change",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailChangeFormData) => {
    emailChangeMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'primary':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending_verification':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'detached':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'primary':
        return <Badge variant="default" className="bg-green-100 text-green-800">Primary</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'detached':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Detached</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const calculateDaysLeft = (graceExpiresAt: string) => {
    const expiry = new Date(graceExpiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const emails = Array.isArray(userEmails) ? userEmails : [];
  const primaryEmail = emails.find((email: Email) => email.status === 'primary');
  const otherEmails = emails.filter((email: Email) => email.status !== 'primary');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Secure Email Management</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide' : 'View'} History
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowEmailChange(!showEmailChange)}
              disabled={!primaryEmail}
            >
              <Key className="h-4 w-4 mr-2" />
              Change Email
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your primary email is used for login and notifications. Email changes require password + 2FA verification. 
              Detached emails have a 30-day grace period before they can be claimed by others.
            </AlertDescription>
          </Alert>

          {/* Primary Email */}
          {primaryEmail && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Primary Email
              </h3>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(primaryEmail.status)}
                  <div>
                    <p className="font-medium">{primaryEmail.email}</p>
                    <p className="text-sm text-gray-600">
                      Used for login and notifications
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(primaryEmail.status)}
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* Other Emails */}
          {otherEmails.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Other Emails</h3>
              <div className="space-y-2">
                {otherEmails.map((email: Email) => (
                  <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(email.status)}
                      <div>
                        <p className="font-medium">{email.email}</p>
                        <p className="text-sm text-gray-600">
                          {email.status === 'pending_verification' && 'Awaiting verification'}
                          {email.status === 'detached' && email.graceExpiresAt && (
                            <>Grace period: {calculateDaysLeft(email.graceExpiresAt)} days left</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(email.status)}
                      {email.status === 'detached' && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Change Form */}
          {showEmailChange && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-semibold flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Change Primary Email
              </h3>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Requirements:</strong> Password verification required. 
                  If 2FA is enabled, provide your authenticator code.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="newEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            placeholder="new@example.com"
                            data-testid="input-new-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="Enter your current password"
                            data-testid="input-current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="twoFactorCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>2FA Code (if enabled)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="000000"
                            maxLength={6}
                            data-testid="input-2fa-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={emailChangeMutation.isPending}
                      data-testid="button-request-change"
                    >
                      {emailChangeMutation.isPending ? "Processing..." : "Request Change"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowEmailChange(false)}
                      data-testid="button-cancel-change"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Email Change History */}
          {showHistory && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-semibold flex items-center">
                <History className="h-5 w-5 mr-2" />
                Email Change History
              </h3>
              
              {historyLoading ? (
                <p className="text-gray-600">Loading history...</p>
              ) : emailHistory && emailHistory.length > 0 ? (
                <div className="space-y-2">
                  {emailHistory.map((log: EmailChangeLog) => (
                    <div key={log.id} className="p-3 border rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {log.oldEmail} → {log.newEmail}
                          </p>
                          <p className="text-gray-600">
                            {log.changeType} • {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={log.status === 'verified' ? 'default' : 'secondary'}
                            className={
                              log.status === 'verified' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {log.status}
                          </Badge>
                          {log.twoFactorUsed && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              2FA
                            </Badge>
                          )}
                        </div>
                      </div>
                      {log.ipAddress && (
                        <p className="text-xs text-gray-500 mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No email changes recorded.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}