import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, Clock, AlertCircle, Edit, Save, X, Mail, Send } from 'lucide-react';
import type { Company } from '@shared/schema';

interface CompanyVerificationEditProps {
  company: Company | undefined;
}

export function CompanyVerificationEdit({ company }: CompanyVerificationEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [panNumber, setPanNumber] = useState(company?.panNumber || '');
  const [cin, setCin] = useState(company?.cin || '');
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const queryClient = useQueryClient();

  // Don't render until we have company data  
  if (!company) {
    return <div>Loading verification details...</div>;
  }

  // Sync local state with company prop when it changes
  useEffect(() => {
    console.log('CompanyVerificationEdit - company data updated:', {
      panNumber: company?.panNumber,
      cin: company?.cin,
      panVerificationStatus: company?.panVerificationStatus,
      cinVerificationStatus: company?.cinVerificationStatus
    });
    setPanNumber(company?.panNumber || '');
    setCin(company?.cin || '');
  }, [company?.panNumber, company?.cin, company?.panVerificationStatus, company?.cinVerificationStatus]);

  // Email verification mutations
  const sendVerificationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/company/send-verification", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Email Sent",
        description: `Verification code sent to ${data.email}. Please check your email and enter the code below.`,
      });
      setIsVerifyingEmail(true);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Email",
        description: error.message || "Unable to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/verify-otp", {
        email: company?.email,
        otpCode: otpCode.trim(),
        purpose: "email_verification",
        userType: "company"
      });
    },
    onSuccess: () => {
      toast({
        title: "Email Verified Successfully!",
        description: "Your company email has been verified. You can now use forgot password feature.",
      });
      setIsVerifyingEmail(false);
      setOtpCode("");
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateVerificationMutation = useMutation({
    mutationFn: async (data: { panNumber?: string; cin?: string }) => {
      const response = await fetch('/api/company/verification-details', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update verification details');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/company/verification-status'] });
      
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Verification details updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification details",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateVerificationMutation.mutate({
      panNumber: panNumber.trim() || undefined,
      cin: cin.trim() || undefined,
    });
  };

  const handleCancel = () => {
    setPanNumber(company?.panNumber || '');
    setCin(company?.cin || '');
    setIsEditing(false);
  };

  const formatPanInput = (value: string) => {
    return value.toUpperCase().slice(0, 10);
  };

  const formatCinInput = (value: string) => {
    return value.toUpperCase().slice(0, 21);
  };

  // Email verification handlers
  const handleSendVerification = () => {
    sendVerificationMutation.mutate();
  };

  const handleVerifyOTP = () => {
    if (!otpCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter the verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }
    verifyOTPMutation.mutate();
  };

  const handleCancelEmailVerification = () => {
    setIsVerifyingEmail(false);
    setOtpCode("");
  };

  const isPanValid = (pan: string) => {
    return !pan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  };

  const isCinValid = (cin: string) => {
    return !cin || /^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/.test(cin);
  };

  const getVerificationBadge = (status: string, type: 'PAN' | 'CIN') => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="default" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            {type} Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {type} Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {type} Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (company?.isBasicDetailsLocked) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Verification Details Locked</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Your verification details have been approved and are now locked. Contact support if you need to make changes.
          </p>
        </div>
        
        {company.panNumber && (
          <div className="flex items-center gap-2">
            <Label>PAN Number:</Label>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{company.panNumber}</code>
            {getVerificationBadge(company.panVerificationStatus || 'pending', 'PAN')}
          </div>
        )}
        
        {company.cin && (
          <div className="flex items-center gap-2">
            <Label>CIN Number:</Label>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{company.cin}</code>
            {getVerificationBadge(company.cinVerificationStatus || 'pending', 'CIN')}
          </div>
        )}
      </div>
    );
  }

  // Debug render - remove in production
  console.log('CompanyVerificationEdit - rendering with company:', {
    panNumber: company?.panNumber,
    cin: company?.cin,
    panVerificationStatus: company?.panVerificationStatus,
    cinVerificationStatus: company?.cinVerificationStatus,
    isEditing
  });

  return (
    <div className="space-y-6">
      {/* Email Verification Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Verification
          </Label>
          {company?.emailVerified ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Not Verified
            </Badge>
          )}
        </div>
        
        <code className="bg-gray-100 px-3 py-2 rounded text-sm block">{company?.email}</code>
        
        {company?.emailVerified ? (
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Your email is verified! You can now use the forgot password feature.
            </p>
          </div>
        ) : isVerifyingEmail ? (
          <div className="space-y-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Verification code sent! Check your email and enter the code below.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-wider"
                data-testid="input-otp-code"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyOTP}
                disabled={verifyOTPMutation.isPending || !otpCode.trim()}
                className="flex-1"
                data-testid="button-verify-otp"
              >
                {verifyOTPMutation.isPending ? "Verifying..." : "Verify Code"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEmailVerification}
                data-testid="button-cancel-verification"
              >
                Cancel
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={handleSendVerification}
              disabled={sendVerificationMutation.isPending}
              className="w-full text-sm"
              data-testid="button-resend-code"
            >
              Didn't receive the code? Send again
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Email verification is required to use the forgot password feature.
              </p>
            </div>
            
            <Button
              onClick={handleSendVerification}
              disabled={sendVerificationMutation.isPending}
              className="w-full flex items-center gap-2"
              data-testid="button-send-verification"
            >
              {sendVerificationMutation.isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Verification Email
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* PAN and CIN Section */}
      {!isEditing ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>PAN Number</Label>
              {company?.panNumber && getVerificationBadge(company.panVerificationStatus || 'pending', 'PAN')}
            </div>
            {company?.panNumber ? (
              <code className="bg-gray-100 px-3 py-2 rounded text-sm block">{company.panNumber}</code>
            ) : (
              <div className="text-gray-500 text-sm italic">No PAN number provided</div>
            )}
            
            <div className="flex items-center justify-between">
              <Label>CIN Number</Label>
              {company?.cin && getVerificationBadge(company.cinVerificationStatus || 'pending', 'CIN')}
            </div>
            {company?.cin ? (
              <code className="bg-gray-100 px-3 py-2 rounded text-sm block">{company.cin}</code>
            ) : (
              <div className="text-gray-500 text-sm italic">No CIN number provided</div>
            )}
          </div>
          
          <Button 
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="w-full"
            data-testid="button-edit-verification"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Verification Details
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="panNumber">PAN Number (Optional)</Label>
              <Input
                id="panNumber"
                value={panNumber}
                onChange={(e) => setPanNumber(formatPanInput(e.target.value))}
                placeholder="ABCDE1234F"
                className={`mt-1 ${!isPanValid(panNumber) ? 'border-red-500' : ''}`}
                data-testid="input-pan-number"
              />
              <p className="text-xs text-gray-500 mt-1">
                10-character PAN format: ABCDE1234F (5 letters + 4 digits + 1 letter)
              </p>
              {!isPanValid(panNumber) && (
                <p className="text-xs text-red-600">Invalid PAN format</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="cin">CIN Number (Optional)</Label>
              <Input
                id="cin"
                value={cin}
                onChange={(e) => setCin(formatCinInput(e.target.value))}
                placeholder="L12345AB2020PLC123456"
                className={`mt-1 ${!isCinValid(cin) ? 'border-red-500' : ''}`}
                data-testid="input-cin-number"
              />
              <p className="text-xs text-gray-500 mt-1">
                21-character CIN format: L12345AB2020PLC123456
              </p>
              {!isCinValid(cin) && (
                <p className="text-xs text-red-600">Invalid CIN format</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={updateVerificationMutation.isPending || !isPanValid(panNumber) || !isCinValid(cin)}
              className="flex-1"
              data-testid="button-save-verification"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateVerificationMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button 
              onClick={handleCancel}
              variant="outline"
              disabled={updateVerificationMutation.isPending}
              className="flex-1"
              data-testid="button-cancel-verification"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
          
          {(company?.cinVerificationStatus === 'rejected' || company?.panVerificationStatus === 'rejected') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Your verification was rejected. Please update the details and resubmit for verification.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}