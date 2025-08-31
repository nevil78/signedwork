import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageSquare, Bug, Lightbulb, MessageCircle, ThumbsDown, Heart,
  Monitor, Zap, Settings, FileText, Shield, HelpCircle,
  Star, Calendar, User, Mail, ExternalLink, ArrowLeft,
  CheckCircle, Clock, AlertTriangle, XCircle, MessageSquareReply
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface UserFeedback {
  id: string;
  userType: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  feedbackType: string;
  category: string;
  title: string;
  description: string;
  priority?: string;
  status: string;
  browserInfo?: string;
  pageUrl?: string;
  rating?: number;
  adminNotes?: string;
  adminResponse?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackStats {
  total: number;
  new: number;
  inReview: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byType: Record<string, number>;
}

const feedbackTypeIcons = {
  bug_report: Bug,
  feature_request: Lightbulb,
  general: MessageCircle,
  complaint: ThumbsDown,
  compliment: Heart,
};

const categoryIcons = {
  ui_ux: Monitor,
  performance: Zap,
  functionality: Settings,
  content: FileText,
  security: Shield,
  other: HelpCircle,
};

const statusColors = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  in_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const priorityColors = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

export default function AdminFeedback() {
  const [, navigate] = useLocation();
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();

  // Get feedback stats
  const { data: stats } = useQuery<FeedbackStats>({
    queryKey: ["/api/admin/feedback/stats"],
  });

  // Get all feedback
  const { data: allFeedback = [], isLoading } = useQuery<UserFeedback[]>({
    queryKey: ["/api/admin/feedback"],
  });

  // Filter feedback based on active tab
  const filteredFeedback = allFeedback.filter(feedback => {
    if (activeTab === "all") return true;
    return feedback.status === activeTab;
  });

  // Update feedback status/response mutation
  const updateFeedbackMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; adminResponse?: string }) => {
      const payload: any = { status: data.status };
      if (data.adminResponse && data.adminResponse.trim()) {
        payload.adminResponse = data.adminResponse;
      }
      await apiRequest("PATCH", `/api/admin/feedback/${data.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback/stats"] });
      toast({
        title: "Success",
        description: "Feedback updated successfully",
      });
      setSelectedFeedback(null);
      setAdminResponse("");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update feedback",
        variant: "destructive",
      });
    },
  });

  const handleRespondToFeedback = () => {
    if (!selectedFeedback || !newStatus) return;
    
    updateFeedbackMutation.mutate({
      id: selectedFeedback.id,
      status: newStatus,
      adminResponse: adminResponse,
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm aa");
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">User Feedback Management</h1>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Feedback Management</h1>
            <p className="text-gray-600">Manage and respond to user feedback</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New</p>
                  <p className="text-2xl font-bold">{stats.new}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Review</p>
                  <p className="text-2xl font-bold">{stats.inReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({allFeedback.length})</TabsTrigger>
          <TabsTrigger value="new">New ({stats?.new || 0})</TabsTrigger>
          <TabsTrigger value="in_review">In Review ({stats?.inReview || 0})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats?.inProgress || 0})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({stats?.resolved || 0})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({stats?.closed || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Found</h3>
                <p className="text-gray-600">
                  {activeTab === "all" 
                    ? "No feedback has been submitted yet."
                    : `No feedback with ${activeTab.replace('_', ' ')} status.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredFeedback.map((feedback) => {
                const TypeIcon = feedbackTypeIcons[feedback.feedbackType as keyof typeof feedbackTypeIcons] || MessageCircle;
                const CategoryIcon = categoryIcons[feedback.category as keyof typeof categoryIcons] || HelpCircle;
                
                return (
                  <Card key={feedback.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <TypeIcon className="h-5 w-5 text-gray-600" />
                            <Badge variant="outline" className={statusColors[feedback.status as keyof typeof statusColors]}>
                              {feedback.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="secondary">
                              {feedback.feedbackType.replace('_', ' ')}
                            </Badge>
                            {feedback.priority && (
                              <span className={`text-sm font-medium ${priorityColors[feedback.priority as keyof typeof priorityColors]}`}>
                                {feedback.priority.toUpperCase()} PRIORITY
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-semibold mb-2">{feedback.title}</h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">{feedback.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>
                                {feedback.userName || 'Anonymous'} 
                                {feedback.userType !== 'anonymous' && ` (${feedback.userType})`}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CategoryIcon className="h-4 w-4" />
                              <span>{feedback.category.replace('_', ' ')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(feedback.createdAt)}</span>
                            </div>
                            {feedback.rating && (
                              <div className="flex items-center space-x-1">
                                {renderStars(feedback.rating)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFeedback(feedback)}
                            data-testid={`button-view-feedback-${feedback.id}`}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Feedback Details Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedFeedback && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <MessageSquareReply className="h-5 w-5" />
                  <span>Feedback Details</span>
                </DialogTitle>
                <DialogDescription>
                  Review and respond to user feedback
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Feedback Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <p className="text-sm">{selectedFeedback.feedbackType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <p className="text-sm">{selectedFeedback.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge className={statusColors[selectedFeedback.status as keyof typeof statusColors]}>
                      {selectedFeedback.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Priority</Label>
                    <p className={`text-sm ${selectedFeedback.priority ? priorityColors[selectedFeedback.priority as keyof typeof priorityColors] : ''}`}>
                      {selectedFeedback.priority?.toUpperCase() || 'Not set'}
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div>
                  <Label className="text-sm font-medium text-gray-600">User Information</Label>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm">
                      <User className="h-4 w-4 inline mr-2" />
                      {selectedFeedback.userName || 'Anonymous'} ({selectedFeedback.userType})
                    </p>
                    {selectedFeedback.userEmail && (
                      <p className="text-sm">
                        <Mail className="h-4 w-4 inline mr-2" />
                        {selectedFeedback.userEmail}
                      </p>
                    )}
                    {selectedFeedback.pageUrl && selectedFeedback.pageUrl !== 'Unknown' && (
                      <p className="text-sm">
                        <ExternalLink className="h-4 w-4 inline mr-2" />
                        Page: {selectedFeedback.pageUrl}
                      </p>
                    )}
                  </div>
                </div>

                {/* Feedback Content */}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Title</Label>
                  <p className="text-lg font-semibold mt-1">{selectedFeedback.title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                {selectedFeedback.rating && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Rating</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      {renderStars(selectedFeedback.rating)}
                      <span className="text-sm text-gray-600">({selectedFeedback.rating}/5)</span>
                    </div>
                  </div>
                )}

                {/* Previous Response */}
                {selectedFeedback.adminResponse && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Previous Response</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{selectedFeedback.adminResponse}</p>
                      {selectedFeedback.respondedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Responded by {selectedFeedback.respondedBy} on {formatDate(selectedFeedback.respondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Response Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-response">Admin Response</Label>
                    <Textarea
                      id="admin-response"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Write your response to the user..."
                      className="mt-1"
                      rows={4}
                      data-testid="textarea-admin-response"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new-status">Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="mt-1" data-testid="select-feedback-status">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRespondToFeedback}
                      disabled={!newStatus || updateFeedbackMutation.isPending}
                      data-testid="button-update-feedback"
                    >
                      {updateFeedbackMutation.isPending ? "Updating..." : "Update Feedback"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}