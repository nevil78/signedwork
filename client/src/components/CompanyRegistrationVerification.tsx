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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Company Verification (Optional)
            </CardTitle>
            <CardDescription>
              Boost credibility by verifying your {company.registrationType} registration - completely optional but recommended
            </CardDescription>
          </div>
          <CompanyVerificationBadge status={company.verificationStatus} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Registration Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Registration Type</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{company.registrationType}</Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Registration Number</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                {company.registrationNumber}
              </code>
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Validation Status */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-start gap-2">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {validation.isValid ? "Format Validation Passed" : "Format Validation Failed"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {validation.isValid 
                  ? `Your ${company.registrationType} number follows the correct format.`
                  : validation.error
                }
              </p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-start gap-2">
            {company.verificationStatus === "pending" && <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />}
            {company.verificationStatus === "verified" && <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />}
            {company.verificationStatus === "rejected" && <XCircle className="h-5 w-5 text-red-600 mt-0.5" />}
            {company.verificationStatus === "unverified" && <Shield className="h-5 w-5 text-gray-500 mt-0.5" />}
            
            <div className="flex-1">
              <p className="text-sm">
                {getStatusMessage()}
              </p>
              
              {company.verificationNotes && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <strong>Admin Notes:</strong> {company.verificationNotes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Benefits of Verification */}
        {canRequestVerification && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Benefits of Verification (Optional)
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                  <li>• Builds employee trust and confidence</li>
                  <li>• Displays verified badge on company profile</li>
                  <li>• Enhances professional credibility</li>
                  <li>• Shows commitment to transparency</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Request Verification Form */}
        {canRequestVerification && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="verification-notes"
                placeholder="Any additional information that might help with verification..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => requestVerificationMutation.mutate({ notes: submissionNotes })}
                disabled={requestVerificationMutation.isPending}
                className="flex items-center gap-2"
                data-testid="button-request-verification"
              >
                <ShieldCheck className="h-4 w-4" />
                {requestVerificationMutation.isPending ? "Submitting..." : "Request Verification"}
              </Button>
              
              <div className="text-xs text-muted-foreground">
                Free manual review (2-3 business days)
              </div>
            </div>
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