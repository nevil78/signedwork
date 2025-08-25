import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, Users, Target, BarChart3, Star, Plus, Filter, Eye, Phone, Mail, Calendar, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecruiterProfile {
  id: string;
  userId: string;
  userType: string;
  recruiterType: string;
  companyName?: string;
  agencyName?: string;
  specializations: string[];
  experienceLevel?: string;
  activePositions: number;
  successfulPlacements: number;
  averageTimeToHire: number;
  subscriptionTier: string;
  subscriptionStatus: string;
  monthlySearchLimit: number;
  monthlyContactLimit: number;
  usedSearches: number;
  usedContacts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TalentSearchFilters {
  keywords?: string;
  skills?: string[];
  experienceLevel?: string[];
  location?: string;
  availability?: string[];
  verifiedOnly?: boolean;
  minYearsExperience?: number;
  maxYearsExperience?: number;
  industry?: string[];
  workType?: string[];
  education?: string[];
}

interface CandidateResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  headline?: string;
  location?: string;
  experienceLevel?: string;
  skills: string[];
  verifiedWorkHistory: boolean;
  totalExperience: number;
  latestRole: string;
  latestCompany: string;
  availabilityStatus?: string;
  profilePhoto?: string;
}

interface CandidatePipeline {
  id: string;
  candidateId: string;
  positionTitle: string;
  companyName: string;
  stage: string;
  priority: string;
  notes?: string;
  nextFollowUp?: string;
  candidate: CandidateResult;
  createdAt: string;
  updatedAt: string;
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchFilters, setSearchFilters] = useState<TalentSearchFilters>({});
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Fetch recruiter profile
  const { data: recruiterProfile, isLoading: isLoadingProfile } = useQuery<RecruiterProfile>({
    queryKey: ["/api/recruiter/profile"],
    enabled: !!user
  });

  // Fetch talent search results
  const { data: searchResults, isLoading: isSearching, refetch: searchTalent } = useQuery<{
    results: CandidateResult[];
    remainingSearches: number;
  }>({
    queryKey: ["/api/recruiter/search", searchFilters],
    enabled: false, // Manual trigger
  });

  // Fetch candidate pipelines
  const { data: pipelines = [], isLoading: isLoadingPipelines } = useQuery<CandidatePipeline[]>({
    queryKey: ["/api/recruiter/pipelines"],
    enabled: !!recruiterProfile
  });

  // Fetch recruitment analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/recruiter/analytics"],
    enabled: !!recruiterProfile
  });

  // Create recruiter profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<RecruiterProfile>) => {
      return apiRequest("/api/recruiter/profile", {
        method: "POST",
        body: profileData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/profile"] });
      toast({ title: "Recruiter profile created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create profile", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Search talent mutation
  const searchMutation = useMutation({
    mutationFn: async (filters: TalentSearchFilters) => {
      return apiRequest("/api/recruiter/search", {
        method: "POST",
        body: { filters }
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/recruiter/search", searchFilters], data);
      toast({ title: `Found ${data.results.length} candidates` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Search failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Add to pipeline mutation
  const addToPipelineMutation = useMutation({
    mutationFn: async ({ candidateId, positionTitle }: { candidateId: string; positionTitle: string }) => {
      return apiRequest("/api/recruiter/pipelines", {
        method: "POST",
        body: {
          candidateId,
          positionTitle,
          companyName: recruiterProfile?.companyName || "Unknown Company",
          stage: "sourced",
          priority: "medium"
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recruiter/pipelines"] });
      toast({ title: "Candidate added to pipeline!" });
    }
  });

  const performSearch = () => {
    if (!recruiterProfile) {
      toast({ title: "Please create a recruiter profile first", variant: "destructive" });
      return;
    }
    
    if (recruiterProfile.usedSearches >= recruiterProfile.monthlySearchLimit) {
      toast({ 
        title: "Search limit reached", 
        description: `You've used all ${recruiterProfile.monthlySearchLimit} monthly searches`,
        variant: "destructive" 
      });
      return;
    }

    searchMutation.mutate(searchFilters);
  };

  // Render profile setup if no profile exists
  if (!isLoadingProfile && !recruiterProfile) {
    return <RecruiterProfileSetup onProfileCreated={(profile) => createProfileMutation.mutate(profile)} />;
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const usagePercentage = {
    searches: (recruiterProfile!.usedSearches / recruiterProfile!.monthlySearchLimit) * 100,
    contacts: (recruiterProfile!.usedContacts / recruiterProfile!.monthlyContactLimit) * 100
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Find and manage top talent with verified work history
              </p>
            </div>
            <Badge variant={recruiterProfile!.subscriptionTier === 'free' ? 'secondary' : 'default'}>
              {recruiterProfile!.subscriptionTier.toUpperCase()} Plan
            </Badge>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Searches</span>
                  <span className="text-sm text-gray-600">
                    {recruiterProfile!.usedSearches} / {recruiterProfile!.monthlySearchLimit}
                  </span>
                </div>
                <Progress value={usagePercentage.searches} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Contacts</span>
                  <span className="text-sm text-gray-600">
                    {recruiterProfile!.usedContacts} / {recruiterProfile!.monthlyContactLimit}
                  </span>
                </div>
                <Progress value={usagePercentage.contacts} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Talent Search
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pipeline ({pipelines.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterProfile!.activePositions}</div>
                  <p className="text-xs text-muted-foreground">Open roles to fill</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Successful Placements</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterProfile!.successfulPlacements}</div>
                  <p className="text-xs text-muted-foreground">Lifetime hires</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recruiterProfile!.averageTimeToHire} days</div>
                  <p className="text-xs text-muted-foreground">From sourcing to offer</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Pipeline Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Pipeline Activity</CardTitle>
                <CardDescription>Your latest candidate interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelines.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No candidates in pipeline yet</p>
                    <Button 
                      onClick={() => setActiveTab("search")} 
                      className="mt-4"
                    >
                      Start Searching Talent
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pipelines.slice(0, 5).map((pipeline) => (
                      <div key={pipeline.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {pipeline.candidate.firstName[0]}{pipeline.candidate.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {pipeline.candidate.firstName} {pipeline.candidate.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{pipeline.positionTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{pipeline.stage}</Badge>
                          <Badge variant="secondary">{pipeline.priority}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Talent Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Talent Search</CardTitle>
                <CardDescription>
                  Find candidates with verified work history and relevant experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="e.g. React, Product Manager"
                      value={searchFilters.keywords || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, keywords: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. San Francisco, Remote"
                      value={searchFilters.location || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Experience Level</Label>
                    <Select 
                      onValueChange={(value) => setSearchFilters(prev => ({ 
                        ...prev, 
                        experienceLevel: value ? [value] : undefined 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Advanced Filters Toggle */}
                <Button 
                  variant="outline" 
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Filters
                </Button>

                {showAdvancedSearch && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verifiedOnly"
                        checked={searchFilters.verifiedOnly || false}
                        onCheckedChange={(checked) => 
                          setSearchFilters(prev => ({ ...prev, verifiedOnly: !!checked }))
                        }
                      />
                      <Label htmlFor="verifiedOnly">Verified work history only</Label>
                    </div>
                    <div>
                      <Label>Availability</Label>
                      <Select 
                        onValueChange={(value) => setSearchFilters(prev => ({ 
                          ...prev, 
                          availability: value ? [value] : undefined 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open to work</SelectItem>
                          <SelectItem value="passive">Passive</SelectItem>
                          <SelectItem value="not_looking">Not looking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Search Button */}
                <Button 
                  onClick={performSearch} 
                  disabled={searchMutation.isPending || !recruiterProfile}
                  className="w-full md:w-auto"
                >
                  {searchMutation.isPending ? "Searching..." : "Search Talent"}
                </Button>

                {/* Search Results */}
                {searchResults && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        Found {searchResults.results.length} candidates
                      </h3>
                      <p className="text-sm text-gray-600">
                        {searchResults.remainingSearches} searches remaining this month
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.results.map((candidate) => (
                        <Card key={candidate.id} className="relative">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 font-semibold">
                                    {candidate.firstName[0]}{candidate.lastName[0]}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    {candidate.firstName} {candidate.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{candidate.headline}</p>
                                  <p className="text-sm text-gray-500">{candidate.location}</p>
                                </div>
                              </div>
                              {candidate.verifiedWorkHistory && (
                                <Badge variant="secondary" className="text-green-600">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Experience:</span>
                                <span>{candidate.totalExperience} companies</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Latest Role:</span>
                                <span>{candidate.latestRole}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Latest Company:</span>
                                <span>{candidate.latestCompany}</span>
                              </div>
                            </div>

                            {candidate.skills.length > 0 && (
                              <div className="mt-4">
                                <div className="flex flex-wrap gap-1">
                                  {candidate.skills.slice(0, 3).map((skill) => (
                                    <Badge key={skill} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {candidate.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{candidate.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex space-x-2 mt-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Profile
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {candidate.firstName} {candidate.lastName}
                                    </DialogTitle>
                                    <DialogDescription>
                                      {candidate.headline}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Contact Information</h4>
                                      <p className="text-sm">{candidate.email}</p>
                                      <p className="text-sm">{candidate.location}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Skills</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {candidate.skills.map((skill) => (
                                          <Badge key={skill} variant="outline">
                                            {skill}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex space-x-2 pt-4">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button>
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add to Pipeline
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Add to Pipeline</DialogTitle>
                                            <DialogDescription>
                                              Add {candidate.firstName} {candidate.lastName} to your recruitment pipeline
                                            </DialogDescription>
                                          </DialogHeader>
                                          <AddToPipelineForm 
                                            candidate={candidate}
                                            onSubmit={(positionTitle) => {
                                              addToPipelineMutation.mutate({ 
                                                candidateId: candidate.id, 
                                                positionTitle 
                                              });
                                            }}
                                          />
                                        </DialogContent>
                                      </Dialog>
                                      <Button variant="outline">
                                        <Mail className="h-4 w-4 mr-1" />
                                        Contact
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Pipeline</CardTitle>
                <CardDescription>
                  Track candidates through your recruitment process
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pipelines.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No candidates in pipeline yet</p>
                    <Button onClick={() => setActiveTab("search")} className="mt-4">
                      Search for Talent
                    </Button>
                  </div>
                ) : (
                  <PipelineView pipelines={pipelines} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalSearches || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalContacts || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalInterviews || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Hires</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.totalHires || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Breakdown</CardTitle>
                <CardDescription>Current candidates by stage</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.pipelineBreakdown && analytics.pipelineBreakdown.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.pipelineBreakdown.map((stage) => (
                      <div key={stage.stage} className="flex items-center justify-between">
                        <span className="capitalize font-medium">{stage.stage.replace('_', ' ')}</span>
                        <Badge variant="outline">{stage.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">
                    No pipeline data available yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Components for recruiter profile setup
function RecruiterProfileSetup({ onProfileCreated }: { onProfileCreated: (profile: Partial<RecruiterProfile>) => void }) {
  const form = useForm({
    defaultValues: {
      recruiterType: "internal",
      companyName: "",
      agencyName: "",
      experienceLevel: "",
      specializations: [] as string[]
    }
  });

  const onSubmit = (data: any) => {
    onProfileCreated(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Recruiter Profile</CardTitle>
          <CardDescription>
            Set up your profile to start using advanced recruitment features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recruiterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recruiter Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Internal Recruiter</SelectItem>
                          <SelectItem value="external">External Recruiter</SelectItem>
                          <SelectItem value="agency">Agency Recruiter</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="junior">Junior (0-2 years)</SelectItem>
                          <SelectItem value="mid">Mid-level (3-5 years)</SelectItem>
                          <SelectItem value="senior">Senior (6-10 years)</SelectItem>
                          <SelectItem value="lead">Lead (10+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Create Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for adding candidates to pipeline
function AddToPipelineForm({ candidate, onSubmit }: { 
  candidate: CandidateResult; 
  onSubmit: (positionTitle: string) => void; 
}) {
  const [positionTitle, setPositionTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (positionTitle.trim()) {
      onSubmit(positionTitle);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="positionTitle">Position Title</Label>
        <Input
          id="positionTitle"
          placeholder="e.g. Senior Software Engineer"
          value={positionTitle}
          onChange={(e) => setPositionTitle(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Add to Pipeline
      </Button>
    </form>
  );
}

// Component for pipeline view
function PipelineView({ pipelines }: { pipelines: CandidatePipeline[] }) {
  const stages = ['sourced', 'contacted', 'screening', 'interview', 'final_round', 'offer', 'hired', 'rejected'];
  
  const pipelineByStage = stages.reduce((acc, stage) => {
    acc[stage] = pipelines.filter(p => p.stage === stage);
    return acc;
  }, {} as Record<string, CandidatePipeline[]>);

  return (
    <div className="space-y-6">
      {stages.map((stage) => (
        <div key={stage} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold capitalize">
              {stage.replace('_', ' ')} ({pipelineByStage[stage].length})
            </h3>
          </div>
          
          {pipelineByStage[stage].length === 0 ? (
            <p className="text-gray-500 text-center py-4">No candidates in this stage</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pipelineByStage[stage].map((pipeline) => (
                <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {pipeline.candidate.firstName[0]}{pipeline.candidate.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {pipeline.candidate.firstName} {pipeline.candidate.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{pipeline.positionTitle}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <Badge variant="outline" size="sm">{pipeline.priority}</Badge>
                      </div>
                      {pipeline.nextFollowUp && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Follow up:</span>
                          <span className="text-sm">
                            {new Date(pipeline.nextFollowUp).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}