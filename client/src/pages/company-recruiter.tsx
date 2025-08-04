import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Badge
} from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Label
} from '@/components/ui/label';
import {
  Building2, Users, Eye, Star, MessageSquare, Calendar,
  User, LogOut, Briefcase, ChevronRight, FileText, Clock,
  CheckCircle, XCircle, AlertCircle, Heart, ThumbsUp, Download
} from 'lucide-react';
import type { JobApplication, JobListing, Employee } from '@shared/schema';

interface ApplicationWithDetails extends JobApplication {
  job: JobListing;
  employee: Employee;
}

export default function CompanyRecruiterPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);

  // Get all job applications for this company
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ['/api/company/applications'],
  });

  // Get company jobs for filtering
  const { data: companyJobs = [] } = useQuery<JobListing[]>({
    queryKey: ['/api/company/jobs'],
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ applicationId, status, notes }: { 
      applicationId: string; 
      status: string; 
      notes?: string; 
    }) => 
      apiRequest('PUT', `/api/company/applications/${applicationId}`, { 
        status, 
        companyNotes: notes 
      }),
    onSuccess: () => {
      toast({ title: "Application status updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/company/applications'] });
      setSelectedApplication(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update application status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800',
      'viewed': 'bg-purple-100 text-purple-800',
      'shortlisted': 'bg-yellow-100 text-yellow-800',
      'interviewed': 'bg-orange-100 text-orange-800',
      'offered': 'bg-green-100 text-green-800',
      'hired': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Clock className="h-4 w-4" />;
      case 'viewed': return <Eye className="h-4 w-4" />;
      case 'shortlisted': return <Star className="h-4 w-4" />;
      case 'interviewed': return <MessageSquare className="h-4 w-4" />;
      case 'offered': return <ThumbsUp className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications.filter((app: ApplicationWithDetails) => {
    if (selectedTab === 'all') return true;
    return app.status === selectedTab;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Building2 className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">Company Dashboard</span>
              </div>
              {/* Page Navigation */}
              <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                <Link to="/company-dashboard">
                  <Button variant="ghost" size="sm">
                    <Building2 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/company-jobs">
                  <Button variant="ghost" size="sm">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Jobs
                  </Button>
                </Link>
                <Link to="/company-recruiter">
                  <Button variant="ghost" size="sm" className="bg-white shadow-sm text-blue-700">
                    <Users className="w-4 h-4 mr-2" />
                    Recruiter
                  </Button>
                </Link>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              {logout.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Recruiter Dashboard</h1>
              <p className="text-slate-600 mt-2">
                Manage job applications and discover top talent
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
                <div className="text-sm text-slate-600">Total Applications</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {applications.filter((app: ApplicationWithDetails) => app.status === 'shortlisted').length}
                </div>
                <div className="text-sm text-slate-600">Shortlisted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {applications.filter((app: ApplicationWithDetails) => app.status === 'interviewed').length}
                </div>
                <div className="text-sm text-slate-600">Interviewed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Filter Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-8 w-full max-w-4xl">
            <TabsTrigger value="all">All Applications</TabsTrigger>
            <TabsTrigger value="applied">New</TabsTrigger>
            <TabsTrigger value="viewed">Viewed</TabsTrigger>
            <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
            <TabsTrigger value="interviewed">Interviewed</TabsTrigger>
            <TabsTrigger value="offered">Offered</TabsTrigger>
            <TabsTrigger value="hired">Hired</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {applicationsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                  <p className="text-muted-foreground">
                    {selectedTab === 'all' 
                      ? "You haven't received any job applications yet" 
                      : `No applications with status "${selectedTab}"`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredApplications.map((application: ApplicationWithDetails) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application}
                    onStatusUpdate={(status, notes) => 
                      updateStatusMutation.mutate({ 
                        applicationId: application.id, 
                        status, 
                        notes 
                      })
                    }
                    onViewDetails={() => setSelectedApplication(application)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Application Details Modal */}
        {selectedApplication && (
          <ApplicationDetailsModal 
            application={selectedApplication}
            onClose={() => setSelectedApplication(null)}
            onStatusUpdate={(status, notes) => 
              updateStatusMutation.mutate({ 
                applicationId: selectedApplication.id, 
                status, 
                notes 
              })
            }
          />
        )}
      </div>
    </div>
  );
}

// Application Card Component
function ApplicationCard({ 
  application, 
  onStatusUpdate, 
  onViewDetails 
}: {
  application: ApplicationWithDetails;
  onStatusUpdate: (status: string, notes?: string) => void;
  onViewDetails: () => void;
}) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{application.job.title}</h3>
              <Badge className={getStatusBadgeColor(application.status)}>
                {application.status}
              </Badge>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{application.employee.firstName} {application.employee.lastName}</span>
                <span>•</span>
                <span>{application.employee.email}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown'}
                </div>
                {application.includeProfile && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Profile Shared
                  </Badge>
                )}
                {application.includeWorkDiary && (
                  <Badge variant="outline" className="text-xs">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Work Diary Shared
                  </Badge>
                )}
              </div>
            </div>

            {application.coverLetter && (
              <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                <p className="font-medium mb-1">Cover Letter:</p>
                <p className="line-clamp-3">{application.coverLetter}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button
              size="sm"
              onClick={onViewDetails}
              data-testid={`button-view-${application.id}`}
            >
              View Details
            </Button>
            
            <QuickStatusUpdate 
              currentStatus={application.status}
              onStatusUpdate={onStatusUpdate}
              applicationId={application.id}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Status Update Component
function QuickStatusUpdate({ 
  currentStatus, 
  onStatusUpdate, 
  applicationId 
}: {
  currentStatus: string;
  onStatusUpdate: (status: string, notes?: string) => void;
  applicationId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');

  const statusOptions = [
    { value: 'applied', label: 'Applied' },
    { value: 'viewed', label: 'Viewed' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'offered', label: 'Offered' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleUpdate = () => {
    onStatusUpdate(selectedStatus, notes);
    setIsOpen(false);
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-update-status-${applicationId}`}>
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Update Status
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Application Details Modal Component
function ApplicationDetailsModal({ 
  application, 
  onClose, 
  onStatusUpdate 
}: {
  application: ApplicationWithDetails;
  onClose: () => void;
  onStatusUpdate: (status: string, notes?: string) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Application for {application.job.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Candidate Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Candidate Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {application.employee.firstName} {application.employee.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {application.employee.email}
              </div>
              <div>
                <span className="font-medium">Applied:</span> {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge className={`ml-2 ${getStatusBadgeColor(application.status)}`}>
                  {application.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* CV Sharing Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">CV Information Shared</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {application.includeProfile ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  Profile Page {application.includeProfile ? 'Shared' : 'Not Shared'}
                </span>
                {application.includeProfile && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/employee-profile/${application.employee.id}`}>
                      View Profile
                    </Link>
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {application.includeWorkDiary ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  Work Diary {application.includeWorkDiary ? 'Shared' : 'Not Shared'}
                </span>
                {application.includeWorkDiary && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/employee-work-diary/${application.employee.id}`}>
                      View Work Diary
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div>
              <h3 className="font-semibold mb-3">Cover Letter</h3>
              <div className="bg-white p-4 border rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          {application.attachmentUrl && application.attachmentName && (
            <div>
              <h3 className="font-semibold mb-3">Additional Documents</h3>
              <div className="bg-white p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{application.attachmentName}</p>
                      <p className="text-xs text-gray-500">Click to download</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = application.attachmentUrl || '';
                      link.download = application.attachmentName || 'document';
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    data-testid="button-download-attachment"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Company Notes */}
          {application.companyNotes && (
            <div>
              <h3 className="font-semibold mb-3">Company Notes</h3>
              <div className="bg-yellow-50 p-4 border rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{application.companyNotes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            <div className="flex gap-2">
              <QuickStatusUpdate 
                currentStatus={application.status}
                onStatusUpdate={onStatusUpdate}
                applicationId={application.id}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getStatusBadgeColor(status: string) {
  const colors = {
    'applied': 'bg-blue-100 text-blue-800',
    'viewed': 'bg-purple-100 text-purple-800',
    'shortlisted': 'bg-yellow-100 text-yellow-800',
    'interviewed': 'bg-orange-100 text-orange-800',
    'offered': 'bg-green-100 text-green-800',
    'hired': 'bg-emerald-100 text-emerald-800',
    'rejected': 'bg-red-100 text-red-800',
    'withdrawn': 'bg-gray-100 text-gray-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}