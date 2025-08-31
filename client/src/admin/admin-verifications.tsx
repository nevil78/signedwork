import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  ShieldCheck, 
  XCircle, 
  CheckCircle, 
  Building,
  Calendar,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import type { Company } from '@shared/schema';

interface VerificationAction {
  companyId: string;
  status: 'verified' | 'rejected';
  notes?: string;
  rejectionReason?: string;
}

export default function AdminVerifications() {
  const [, navigate] = useLocation();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  // Get pending verifications
  const { data: pendingVerifications = [], isLoading } = useQuery<Company[]>({
    queryKey: ['/api/admin/pending-verifications'],
  });

  // Update verification status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async (action: VerificationAction) => {
      await apiRequest('PATCH', `/api/admin/companies/${action.companyId}/verification`, {
        status: action.status,
        notes: action.notes,
        rejectionReason: action.rejectionReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-verifications'] });
      toast({
        title: "Success",
        description: "Verification status updated successfully",
      });
      setSelectedCompany(null);
      setNotes('');
      setRejectionReason('');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  const handleVerifyCompany = (approve: boolean) => {
    if (!selectedCompany) return;

    updateVerificationMutation.mutate({
      companyId: selectedCompany.id,
      status: approve ? 'verified' : 'rejected',
      notes: notes.trim() || undefined,
      rejectionReason: approve ? undefined : rejectionReason.trim() || undefined,
    });
  };

  const getVerificationDetails = (company: Company) => {
    const hasRegistration = company.registrationType && company.registrationNumber;
    
    if (!hasRegistration) {
      return {
        canVerify: false,
        reason: 'No registration information provided'
      };
    }

    // Basic format validation
    const isValidFormat = company.registrationType === 'PAN' 
      ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(company.registrationNumber || '')
      : /^[LUF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(company.registrationNumber || '');
    
    return {
      canVerify: true, // Allow admin verification even if format is wrong
      reason: isValidFormat ? 'Valid format - ready for verification' : 'Format may need review - admin verification available'
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Verifications</h1>
            <p className="text-muted-foreground">
              Review and approve company registration verifications
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/dashboard")}
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {pendingVerifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShieldCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Verifications</h3>
            <p className="text-muted-foreground">
              All companies are up to date with their verification status.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingVerifications.map((company) => {
            const verificationDetails = getVerificationDetails(company);
            
            return (
              <Card key={company.id} className="hover:shadow-lg transition-shadow" data-testid={`verification-card-${company.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl" data-testid={`text-company-name-${company.id}`}>{company.name}</CardTitle>
                        <CardDescription data-testid={`text-company-email-${company.id}`}>{company.email}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200" data-testid={`status-pending-${company.id}`}>
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Company Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Information</Label>
                      <div className="mt-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Industry:</span>
                          <Badge variant="secondary" data-testid={`text-industry-${company.id}`}>{company.industry}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm" data-testid={`text-est-year-${company.id}`}>Est. {company.establishmentYear}</span>
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-registered-date-${company.id}`}>
                          Registered: {company.createdAt ? format(new Date(company.createdAt), 'MMM dd, yyyy') : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Registration Details</Label>
                      <div className="mt-1 space-y-2">
                        {company.registrationType && company.registrationNumber ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" data-testid={`text-reg-type-${company.id}`}>{company.registrationType}</Badge>
                              <code className="text-sm bg-muted px-2 py-1 rounded" data-testid={`text-reg-number-${company.id}`}>
                                {company.registrationNumber}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-muted-foreground" data-testid={`text-verification-status-${company.id}`}>
                                {verificationDetails.reason}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-muted-foreground">No registration provided</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Request Notes */}
                  {company.verificationNotes && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Request Notes</Label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg" data-testid={`text-verification-notes-${company.id}`}>
                        <p className="text-sm">{company.verificationNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedCompany(company)}
                          disabled={updateVerificationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-approve-${company.id}`}
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Approve Verification</DialogTitle>
                          <DialogDescription>
                            Confirm verification for {selectedCompany?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="notes">Admin Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Add any notes about the verification..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                              data-testid="textarea-admin-notes"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => handleVerifyCompany(true)}
                              disabled={updateVerificationMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid="button-confirm-approve"
                            >
                              {updateVerificationMutation.isPending ? 'Processing...' : 'Confirm Approval'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedCompany(null)}
                              data-testid="button-cancel-approve"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          onClick={() => setSelectedCompany(company)}
                          disabled={updateVerificationMutation.isPending}
                          data-testid={`button-reject-${company.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Verification</DialogTitle>
                          <DialogDescription>
                            Provide a reason for rejecting {selectedCompany?.name}'s verification
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                            <Textarea
                              id="rejection-reason"
                              placeholder="Please explain why the verification was rejected..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                              required
                              data-testid="textarea-rejection-reason"
                            />
                          </div>
                          <div>
                            <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                            <Textarea
                              id="admin-notes"
                              placeholder="Internal notes..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={2}
                              data-testid="textarea-admin-notes-reject"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="destructive"
                              onClick={() => handleVerifyCompany(false)}
                              disabled={!rejectionReason.trim() || updateVerificationMutation.isPending}
                              data-testid="button-confirm-reject"
                            >
                              {updateVerificationMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedCompany(null);
                                setRejectionReason('');
                              }}
                              data-testid="button-cancel-reject"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}