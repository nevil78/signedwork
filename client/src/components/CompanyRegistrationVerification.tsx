import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, ShieldCheck, ShieldAlert, Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { CompanyVerificationBadge } from "./CompanyVerificationBadge";
import { validateRegistrationNumber, type VerificationStatus } from "@shared/validation";

interface CompanyVerificationData {
  id: string;
  name: string;
  registrationType: string;
  registrationNumber: string;
  verificationStatus: VerificationStatus;
  verificationDate?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  verificationDocuments: string[];
}

export function CompanyRegistrationVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submissionNotes, setSubmissionNotes] = useState("");

  // Fetch company verification status
  const { data: company, isLoading } = useQuery<CompanyVerificationData>({
    queryKey: ["/api/company/verification-status"],
  });

  // Request verification mutation
  const requestVerificationMutation = useMutation({
    mutationFn: async (data: { notes?: string }) => {
      return apiRequest("/api/company/request-verification", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Verification Requested",
        description: "Your verification request has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/verification-status"] });
      setSubmissionNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Loading verification status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Unable to load company verification status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const validation = validateRegistrationNumber(company.registrationType, company.registrationNumber);

  const getStatusMessage = () => {
    switch (company.verificationStatus) {
      case "unverified":
        return validation.isValid 
          ? "Your registration details look good! Consider requesting verification to boost your company's credibility (optional)."
          : `Registration format issue: ${validation.error}. You can still use the platform without verification.`;
      case "pending":
        return "Your verification request is being reviewed by our team. This typically takes 2-3 business days.";
      case "verified":
        return `Your company was successfully verified on ${new Date(company.verificationDate!).toLocaleDateString()}.`;
      case "rejected":
        return `Verification was rejected. Reason: ${company.rejectionReason || "Please contact support for details."}`;
      default:
        return "Unknown verification status.";
    }
  };

  const canRequestVerification = company.verificationStatus === "unverified" && validation.isValid;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Registration Verification</CardTitle>
              <CardDescription className="text-sm">
                {company.registrationType ? `${company.registrationType} verification` : "Add PAN/CIN for credibility"}
              </CardDescription>
            </div>
          </div>
          <CompanyVerificationBadge status={company.verificationStatus} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Registration Details - Only show if data exists */}
        {company.registrationType && company.registrationNumber && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0">{company.registrationType}</Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                  {company.registrationNumber}
                </code>
              </div>
              {validation.isValid ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Valid format</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Invalid format</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Message */}
        <div className="flex items-start gap-2">
          {company.verificationStatus === "pending" && <Clock className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />}
          {company.verificationStatus === "verified" && <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
          {company.verificationStatus === "rejected" && <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />}
          {company.verificationStatus === "unverified" && <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
            
            {company.verificationNotes && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                <strong>Admin Notes:</strong> {company.verificationNotes}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {canRequestVerification && (
          <div className="pt-2">
            <Button
              onClick={() => requestVerificationMutation.mutate({ notes: submissionNotes })}
              disabled={requestVerificationMutation.isPending}
              size="sm"
              className="w-full sm:w-auto"
              data-testid="button-request-verification"
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {requestVerificationMutation.isPending ? "Requesting..." : "Request Verification"}
            </Button>
          </div>
        )}

        {/* No Registration Info Message */}
        {(!company.registrationType || !company.registrationNumber) && (
          <div className="text-center py-4">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Add PAN or CIN registration to enhance your company's credibility with employees.
            </p>
            <p className="text-xs text-muted-foreground">
              You can update your registration details from Settings → Company Profile
            </p>
          </div>
        )}

        {/* Premium Upgrade Hint */}
        {company.verificationStatus === "verified" && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Company Successfully Verified!
                </p>
                <p className="text-sm text-green-700 dark:text-green-200">
                  Your verification badge helps build trust and credibility with potential employees.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}