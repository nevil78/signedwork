import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Star,
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SimpleManagerDashboard() {
  const { toast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState<string>("");
  const [approvalComment, setApprovalComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Get current user to check if they're a manager
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch team members and pending work entries
  const { data: teamData = { members: [], pendingEntries: [], approvedEntries: [] }, isLoading } = useQuery({
    queryKey: ['/api/manager/team-overview'],
    enabled: currentUser?.companySubRole === 'MANAGER',
  });

  // Approve work entry
  const approveMutation = useMutation({
    mutationFn: async ({ entryId, rating = 5, comments }: { 
      entryId: string; 
      rating?: number; 
      comments?: string; 
    }) => {
      return apiRequest(`/api/work-entries/${entryId}/approve`, 'POST', {
        rating,
        comments
      });
    },
    onSuccess: () => {
      toast({
        title: "Work Approved! ✅",
        description: "Entry has been approved and locked.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/team-overview'] });
      setSelectedEntry("");
      setApprovalComment("");
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve work entry.",
        variant: "destructive",
      });
    },
  });

  // Reject work entry
  const rejectMutation = useMutation({
    mutationFn: async ({ entryId, reason }: { entryId: string; reason: string }) => {
      return apiRequest(`/api/work-entries/${entryId}/reject`, 'POST', {
        reason
      });
    },
    onSuccess: () => {
      toast({
        title: "Work Rejected",
        description: "Entry rejected with feedback sent to employee.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/team-overview'] });
      setSelectedEntry("");
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject work entry.",
        variant: "destructive",
      });
    },
  });

  if (!currentUser || currentUser.companySubRole !== 'MANAGER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Manager Access Required</h2>
          <p className="text-gray-600">Only users with Manager role can access this dashboard.</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { members, pendingEntries, approvedEntries } = teamData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage your team's work entries and performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {approvedEntries.filter((entry: any) => {
                      const approvedDate = new Date(entry.approvedAt);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return approvedDate >= weekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {approvedEntries.length > 0 ? 
                      (approvedEntries.reduce((sum: number, entry: any) => sum + (entry.companyRating || 5), 0) / approvedEntries.length).toFixed(1) : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals ({pendingEntries.length})</TabsTrigger>
            <TabsTrigger value="team">My Team ({members.length})</TabsTrigger>
            <TabsTrigger value="approved">Recently Approved</TabsTrigger>
          </TabsList>

          {/* Pending Approvals - Main Business Value */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Work Entries Awaiting Your Approval
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">All caught up!</p>
                    <p className="text-gray-600">No pending work entries to review at this time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEntries.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-semibold text-lg text-gray-900">{entry.title}</h3>
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                {entry.priority}
                              </Badge>
                              <Badge className="bg-blue-100 text-blue-800">
                                {entry.workType}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-700 mb-4">{entry.description}</p>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {entry.employeeFirstName} {entry.employeeLastName}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {entry.startDate}
                              </div>
                              {entry.hours && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {entry.hours} hours
                                </div>
                              )}
                            </div>

                            {/* Quick Approval Actions */}
                            <div className="flex space-x-3">
                              <Button
                                onClick={() => approveMutation.mutate({ 
                                  entryId: entry.id,
                                  rating: 5,
                                  comments: "Great work!" 
                                })}
                                disabled={approveMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                data-testid={`button-quick-approve-${entry.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Quick Approve
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => setSelectedEntry(entry.id)}
                                data-testid={`button-review-${entry.id}`}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Review & Comment
                              </Button>
                              
                              <Button
                                variant="outline"
                                onClick={() => rejectMutation.mutate({ 
                                  entryId: entry.id,
                                  reason: "Please provide more details and resubmit" 
                                })}
                                disabled={rejectMutation.isPending}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                data-testid={`button-reject-${entry.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Needs Changes
                              </Button>
                            </div>

                            {/* Detailed Review Form */}
                            {selectedEntry === entry.id && (
                              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="approval-comment">Add Comments (Optional)</Label>
                                    <Textarea
                                      id="approval-comment"
                                      placeholder="Great work on this project! The attention to detail was excellent..."
                                      value={approvalComment}
                                      onChange={(e) => setApprovalComment(e.target.value)}
                                      className="mt-1"
                                      data-testid="textarea-approval-comment"
                                    />
                                  </div>
                                  
                                  <div className="flex space-x-3">
                                    <Button
                                      onClick={() => approveMutation.mutate({ 
                                        entryId: entry.id,
                                        rating: 5,
                                        comments: approvalComment 
                                      })}
                                      disabled={approveMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Star className="h-4 w-4 mr-1" />
                                      Approve with 5 Stars
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedEntry("");
                                        setApprovalComment("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Members */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member: any) => (
                    <div key={member.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {member.firstName?.[0]}{member.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{member.firstName} {member.lastName}</h3>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <p>Pending entries: {member.pendingCount || 0}</p>
                        <p>Last submission: {member.lastSubmission || 'Never'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Entries */}
          <TabsContent value="approved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Approved Work</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvedEntries.slice(0, 10).map((entry: any) => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{entry.title}</h4>
                        <p className="text-sm text-gray-600">
                          {entry.employeeFirstName} {entry.employeeLastName} • {new Date(entry.approvedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{entry.companyRating || 5}</span>
                        </div>
                        <Badge variant="secondary">Approved</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}