import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  Star,
  FileText,
  TrendingUp 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function ManagerDashboard() {
  const { toast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState<string>("");

  // Fetch manager's teams and stats
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/manager/teams'],
  });

  // Fetch pending work entries for manager's teams
  const { data: pendingEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['/api/manager/work-entries/pending'],
  });

  // Fetch approved entries for reporting
  const { data: approvedEntries = [], isLoading: approvedLoading } = useQuery({
    queryKey: ['/api/manager/work-entries/approved'],
  });

  // Approve work entry mutation
  const approveMutation = useMutation({
    mutationFn: async ({ entryId, comments, rating }: { 
      entryId: string; 
      comments?: string; 
      rating?: number; 
    }) => {
      return apiRequest(`/api/manager/work-entries/${entryId}/approve`, 'POST', {
        comments,
        rating
      });
    },
    onSuccess: () => {
      toast({
        title: "Entry Approved",
        description: "Work entry has been approved and is now immutable.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/work-entries/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/work-entries/approved'] });
      setSelectedEntry("");
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve work entry.",
        variant: "destructive",
      });
    },
  });

  // Reject work entry mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ entryId, reason }: { entryId: string; reason: string }) => {
      return apiRequest(`/api/manager/work-entries/${entryId}/reject`, 'POST', {
        reason
      });
    },
    onSuccess: () => {
      toast({
        title: "Entry Rejected",
        description: "Work entry has been rejected with feedback.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manager/work-entries/pending'] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject work entry.",
        variant: "destructive",
      });
    },
  });

  if (teamsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your teams and approve work entries</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Teams Managed</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
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
                <CheckCircle className="h-8 w-8 text-green-600" />
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
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teams.reduce((sum: number, team: any) => sum + team.employeeCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="teams">My Teams</TabsTrigger>
            <TabsTrigger value="approved">Approved Entries</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2" />
                  Pending Work Entry Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entriesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : pendingEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No pending work entries to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEntries.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{entry.title}</h3>
                              <Badge variant="outline">{entry.priority}</Badge>
                              <Badge>{entry.workType}</Badge>
                            </div>
                            <p className="text-gray-600 mb-2">{entry.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By: {entry.employeeName} {entry.employeeLastName}</span>
                              <span>Team: {entry.teamName}</span>
                              <span>Hours: {entry.hours || 'N/A'}</span>
                              <span>Date: {entry.startDate}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate({ 
                                entryId: entry.id,
                                rating: 5
                              })}
                              disabled={approveMutation.isPending}
                              data-testid={`button-approve-${entry.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectMutation.mutate({ 
                                entryId: entry.id,
                                reason: "Needs more details"
                              })}
                              disabled={rejectMutation.isPending}
                              data-testid={`button-reject-${entry.id}`}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team: any) => (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{team.name}</span>
                      <Badge variant="secondary">{team.employeeCount} members</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{team.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {team.pendingEntriesCount} pending reviews
                      </span>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Approved Entries Tab */}
          <TabsContent value="approved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Approved Entries</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedEntries.slice(0, 10).map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{entry.title}</h3>
                            <p className="text-sm text-gray-600">
                              {entry.employeeName} {entry.employeeLastName} • {entry.teamName}
                            </p>
                            <p className="text-sm text-gray-500">
                              Approved on {new Date(entry.approvedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{entry.companyRating || 'N/A'}</span>
                            <Badge variant="secondary" className="ml-2">Immutable</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Performance analytics and reports coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}