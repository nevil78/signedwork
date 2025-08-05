import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Filter, MapPin, Clock, DollarSign, Building2, 
  Bookmark, BookmarkCheck, Bell, BellRing, Eye, Send,
  Briefcase, TrendingUp, Star, Users, ChevronRight,
  Heart, HeartHandshake, Zap, Target, Brain, Globe, User, BookOpen, LogOut,
  Paperclip, FileText, X
} from 'lucide-react';
import type { JobListing, JobApplication, SavedJob, JobAlert } from '@shared/schema';
import EmployeeNavHeader from '@/components/employee-nav-header';

interface JobSearchFilters {
  keywords?: string;
  location?: string;
  employmentType?: string[];
  experienceLevel?: string[];
  remoteType?: string[];
  salaryMin?: number;
  salaryMax?: number;
}

export default function JobDiscoveryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Search state
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [searchKeywords, setSearchKeywords] = useState('');
  const [selectedTab, setSelectedTab] = useState('discover');
  
  // Job search query with proper query string formatting
  const { data: jobs = [], isLoading: jobsLoading, refetch: searchJobs } = useQuery({
    queryKey: ['/api/jobs/search', filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (filters.keywords) searchParams.append('keywords', filters.keywords);
      if (filters.location) searchParams.append('location', filters.location);
      if (filters.employmentType?.length) searchParams.append('employmentType', filters.employmentType.join(','));
      if (filters.experienceLevel?.length) searchParams.append('experienceLevel', filters.experienceLevel.join(','));
      if (filters.remoteType?.length) searchParams.append('remoteType', filters.remoteType.join(','));
      if (filters.salaryMin) searchParams.append('salaryMin', filters.salaryMin.toString());
      if (filters.salaryMax) searchParams.append('salaryMax', filters.salaryMax.toString());
      
      const response = await fetch(`/api/jobs/search?${searchParams}`);
      if (!response.ok) throw new Error('Failed to search jobs');
      return response.json();
    }
  });

  // Load all jobs on initial page load
  React.useEffect(() => {
    searchJobs();
  }, []);

  // Saved jobs query
  const { data: savedJobs = [] } = useQuery({
    queryKey: ['/api/jobs/saved'],
    enabled: selectedTab === 'saved'
  });

  // Job applications query
  const { data: myApplications = [] } = useQuery({
    queryKey: ['/api/jobs/my-applications'],
    enabled: selectedTab === 'applications'
  });

  // Job alerts query
  const { data: jobAlerts = [] } = useQuery({
    queryKey: ['/api/job-alerts'],
    enabled: selectedTab === 'alerts'
  });

  // Mutations
  const saveJobMutation = useMutation({
    mutationFn: (jobId: string) => apiRequest('POST', `/api/jobs/${jobId}/save`, { notes: '' }),
    onSuccess: () => {
      toast({ title: "Job saved successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/saved'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to save job", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const unsaveJobMutation = useMutation({
    mutationFn: (jobId: string) => apiRequest('DELETE', `/api/jobs/${jobId}/save`),
    onSuccess: () => {
      toast({ title: "Job removed from saved list" });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/saved'] });
    }
  });

  const applyJobMutation = useMutation({
    mutationFn: async ({ jobId, coverLetter, includeProfile, includeWorkDiary, attachment }: { 
      jobId: string; 
      coverLetter: string; 
      includeProfile: boolean; 
      includeWorkDiary: boolean; 
      attachment?: File;
    }) => {
      // If there's an attachment, upload it first
      let attachmentUrl = '';
      let attachmentName = '';
      
      if (attachment) {
        // Get upload URL
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to get upload URL');
        }
        
        const { uploadURL } = await uploadResponse.json();
        
        // Upload file
        const uploadFileResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: attachment,
          headers: {
            'Content-Type': attachment.type
          }
        });
        
        if (!uploadFileResponse.ok) {
          throw new Error('Failed to upload attachment');
        }
        
        attachmentUrl = uploadURL.split('?')[0]; // Remove query parameters
        attachmentName = attachment.name;
      }
      
      // Submit application with attachment URL
      return apiRequest('POST', `/api/jobs/${jobId}/apply`, { 
        coverLetter, 
        includeProfile, 
        includeWorkDiary,
        attachmentUrl,
        attachmentName
      });
    },
    onSuccess: () => {
      toast({ title: "Application submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/my-applications'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to submit application", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: (alertData: any) => apiRequest('POST', '/api/job-alerts', alertData),
    onSuccess: () => {
      toast({ title: "Job alert created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/job-alerts'] });
    }
  });

  // Auto-search on filter changes
  useEffect(() => {
    if (selectedTab === 'discover') {
      searchJobs();
    }
  }, [filters, selectedTab, searchJobs]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, keywords: searchKeywords }));
  };

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

  const isJobSaved = (jobId: string) => {
    return savedJobs.some((saved: SavedJob) => saved.jobId === jobId);
  };

  const hasApplied = (jobId: string) => {
    return myApplications.some((app: JobApplication) => app.jobId === jobId);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800',
      'screening': 'bg-yellow-100 text-yellow-800',
      'interviewing': 'bg-purple-100 text-purple-800',
      'offered': 'bg-green-100 text-green-800',
      'hired': 'bg-emerald-100 text-emerald-800',
      'rejected': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <EmployeeNavHeader />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Hero Section with AI-Powered Search */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl p-8 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8" />
            <h1 className="text-3xl font-bold">AI-Powered Job Discovery</h1>
          </div>
          <p className="text-xl opacity-90">
            Find your perfect role with intelligent matching that goes beyond keywords
          </p>
          
          {/* Advanced Search Bar */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mt-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Job title, skills, or company..."
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-lg h-12"
                  data-testid="input-job-search"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-white/90 px-8"
                data-testid="button-search-jobs"
              >
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
            
            {/* Quick Filters */}
            <div className="flex flex-wrap gap-3">
              {['Remote', 'Full-time', 'Entry Level', 'Senior', 'Tech', 'Finance'].map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => setFilters(prev => ({ ...prev, keywords: tag }))}
                  data-testid={`button-filter-${tag.toLowerCase().replace(' ', '-')}`}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold">Perfect Matches</h3>
                <p className="text-sm text-muted-foreground">85% compatibility</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold">Trending Skills</h3>
                <p className="text-sm text-muted-foreground">React, Python, AI</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold">Quick Apply</h3>
                <p className="text-sm text-muted-foreground">1-click applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted p-1 rounded-lg">
          <TabsTrigger value="discover" className="flex items-center gap-2" data-testid="tab-discover">
            <Search className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2" data-testid="tab-saved">
            <Bookmark className="h-4 w-4" />
            Saved Jobs
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2" data-testid="tab-applications">
            <Send className="h-4 w-4" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2" data-testid="tab-alerts">
            <Bell className="h-4 w-4" />
            Job Alerts
          </TabsTrigger>
        </TabsList>

        {/* Discover Tab */}
        <TabsContent value="discover" className="space-y-6">
          <div className="flex gap-6">
            {/* Filters Sidebar */}
            <Card className="w-80 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location Filter */}
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <Input
                    placeholder="City, state, or country"
                    value={filters.location || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="mt-1"
                    data-testid="input-location-filter"
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Employment Type</Label>
                  <div className="space-y-2">
                    {['full-time', 'part-time', 'contract', 'internship', 'freelance'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={filters.employmentType?.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters(prev => ({
                                ...prev,
                                employmentType: [...(prev.employmentType || []), type]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                employmentType: prev.employmentType?.filter(t => t !== type)
                              }));
                            }
                          }}
                          data-testid={`checkbox-employment-${type}`}
                        />
                        <Label htmlFor={type} className="capitalize">
                          {type.replace('-', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Experience Level</Label>
                  <div className="space-y-2">
                    {['entry', 'mid', 'senior', 'lead', 'executive'].map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={level}
                          checked={filters.experienceLevel?.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters(prev => ({
                                ...prev,
                                experienceLevel: [...(prev.experienceLevel || []), level]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                experienceLevel: prev.experienceLevel?.filter(l => l !== level)
                              }));
                            }
                          }}
                          data-testid={`checkbox-experience-${level}`}
                        />
                        <Label htmlFor={level} className="capitalize">
                          {level} Level
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remote Type */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Work Style</Label>
                  <div className="space-y-2">
                    {['office', 'remote', 'hybrid'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`remote-${type}`}
                          checked={filters.remoteType?.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters(prev => ({
                                ...prev,
                                remoteType: [...(prev.remoteType || []), type]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                remoteType: prev.remoteType?.filter(t => t !== type)
                              }));
                            }
                          }}
                          data-testid={`checkbox-remote-${type}`}
                        />
                        <Label htmlFor={`remote-${type}`} className="capitalize">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salary Range */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Salary Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.salaryMin || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        salaryMin: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      data-testid="input-salary-min"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.salaryMax || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        salaryMax: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      data-testid="input-salary-max"
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => setFilters({})} 
                  variant="outline" 
                  className="w-full"
                  data-testid="button-clear-filters"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>

            {/* Job Results */}
            <div className="flex-1 space-y-4">
              {jobsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or remove some filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                jobs.map((job: JobListing) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={isJobSaved(job.id)}
                    hasApplied={hasApplied(job.id)}
                    onSave={() => saveJobMutation.mutate(job.id)}
                    onUnsave={() => unsaveJobMutation.mutate(job.id)}
                    onApply={(data) => 
                      applyJobMutation.mutate({ jobId: job.id, ...data })
                    }
                  />
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Saved Jobs Tab */}
        <TabsContent value="saved" className="space-y-4">
          {savedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
                <p className="text-muted-foreground">
                  Save interesting jobs to review them later
                </p>
              </CardContent>
            </Card>
          ) : (
            savedJobs.map((saved: SavedJob) => (
              <Card key={saved.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        Saved on {new Date(saved.savedAt).toLocaleDateString()}
                      </p>
                      {saved.notes && (
                        <p className="text-sm bg-muted p-2 rounded">
                          <strong>Notes:</strong> {saved.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unsaveJobMutation.mutate(saved.jobId)}
                      data-testid={`button-unsave-${saved.jobId}`}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {myApplications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                <p className="text-muted-foreground">
                  Start applying for jobs to track your progress here
                </p>
              </CardContent>
            </Card>
          ) : (
            myApplications.map((app: JobApplication) => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                  
                  {app.coverLetter && (
                    <div className="bg-muted p-3 rounded mt-3">
                      <p className="text-sm font-medium mb-1">Cover Letter:</p>
                      <p className="text-sm">{app.coverLetter}</p>
                    </div>
                  )}
                  
                  {app.notes && (
                    <div className="bg-blue-50 p-3 rounded mt-3">
                      <p className="text-sm font-medium mb-1">Company Notes:</p>
                      <p className="text-sm">{app.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Job Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Job Alerts</h3>
            <CreateJobAlertDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/job-alerts'] })} />
          </div>
          
          {jobAlerts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No job alerts set</h3>
                <p className="text-muted-foreground mb-4">
                  Get notified when new jobs match your criteria
                </p>
                <CreateJobAlertDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ['/api/job-alerts'] })} />
              </CardContent>
            </Card>
          ) : (
            jobAlerts.map((alert: JobAlert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{alert.title}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <strong>Keywords:</strong> {alert.keywords?.join(', ') || 'Any'}
                        </div>
                        <div>
                          <strong>Location:</strong> {alert.location || 'Any'}
                        </div>
                        <div>
                          <strong>Frequency:</strong> {alert.frequency}
                        </div>
                        <div>
                          <strong>Status:</strong> {alert.isActive ? 'Active' : 'Paused'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid={`button-edit-alert-${alert.id}`}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" data-testid={`button-delete-alert-${alert.id}`}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

// Job Card Component
function JobCard({ 
  job, 
  isSaved, 
  hasApplied, 
  onSave, 
  onUnsave, 
  onApply 
}: {
  job: JobListing;
  isSaved: boolean;
  hasApplied: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onApply: (data: { coverLetter: string; includeProfile: boolean; includeWorkDiary: boolean; attachment?: File }) => void;
}) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeWorkDiary, setIncludeWorkDiary] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setAttachment(file);
    }
  };

  const handleApply = () => {
    onApply({ coverLetter, includeProfile, includeWorkDiary, attachment: attachment || undefined });
    setShowApplyModal(false);
    setCoverLetter('');
    setIncludeProfile(true);
    setIncludeWorkDiary(true);
    setAttachment(null);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{job.title}</h3>
              <Badge variant="secondary">{job.employmentType}</Badge>
              <Badge variant="outline">{job.experienceLevel}</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Company
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {job.remoteType}
              </div>
              {job.salaryRange && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salaryRange}
                </div>
              )}
            </div>
            
            <p className="text-muted-foreground mb-4 line-clamp-3">
              {job.description}
            </p>
            
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.skills.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={isSaved ? onUnsave : onSave}
              data-testid={`button-${isSaved ? 'unsave' : 'save'}-${job.id}`}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-blue-600" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            
            {hasApplied ? (
              <Button disabled size="sm" data-testid={`button-applied-${job.id}`}>
                Applied
              </Button>
            ) : (
              <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-apply-${job.id}`}>
                    <Send className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Apply for {job.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Share your profile and work experience to stand out from other applicants
                    </p>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* CV Sharing Options */}
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border">
                      <h4 className="font-semibold text-sm">Share as CV</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="include-profile"
                            checked={includeProfile}
                            onChange={(e) => setIncludeProfile(e.target.checked)}
                            className="h-4 w-4 rounded"
                            data-testid="checkbox-include-profile"
                          />
                          <Label htmlFor="include-profile" className="text-sm cursor-pointer">
                            <strong>Include Profile Page</strong> - Share your personal information, skills, experience, education, and certifications
                          </Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="include-work-diary"
                            checked={includeWorkDiary}
                            onChange={(e) => setIncludeWorkDiary(e.target.checked)}
                            className="h-4 w-4 rounded"
                            data-testid="checkbox-include-work-diary"
                          />
                          <Label htmlFor="include-work-diary" className="text-sm cursor-pointer">
                            <strong>Include Work Diary</strong> - Share your recent work activities, tasks, and project accomplishments
                          </Label>
                        </div>
                      </div>
                      {(!includeProfile && !includeWorkDiary) && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ We recommend sharing at least your profile or work diary to improve your application
                        </p>
                      )}
                    </div>

                    {/* Cover Letter */}
                    <div>
                      <Label htmlFor="cover-letter">Cover Letter</Label>
                      <Textarea
                        id="cover-letter"
                        placeholder="Write a compelling cover letter highlighting why you're the perfect fit for this role..."
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={8}
                        className="mt-1"
                        data-testid="textarea-cover-letter"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Make it personal and show your passion for the role
                      </p>
                    </div>

                    {/* Attachment Upload */}
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Additional Documents (Optional)</Label>
                        {attachment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAttachment(null)}
                            data-testid="button-remove-attachment"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      {!attachment ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            id="attachment-upload"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,.jpg,.png,.jpeg"
                            onChange={handleFileUpload}
                            data-testid="input-file-attachment"
                          />
                          <label
                            htmlFor="attachment-upload"
                            className="cursor-pointer flex flex-col items-center space-y-2"
                          >
                            <Paperclip className="h-8 w-8 text-gray-400" />
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">Click to upload</span>
                              <span className="text-gray-500"> or drag and drop</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, TXT, or images up to 10MB
                            </p>
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">{attachment.name}</p>
                              <p className="text-xs text-gray-500">
                                {(attachment.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Ready to upload
                          </Badge>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Include portfolio samples, certificates, or other relevant documents
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApply} data-testid="button-submit-application">
                        Submit Application
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {job.views} views
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {job.applicationsCount} applicants
            </div>
          </div>
          <div>
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Job Alert Dialog Component
function CreateJobAlertDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    keywords: '',
    location: '',
    employmentType: [],
    experienceLevel: [],
    remoteType: [],
    frequency: 'daily'
  });

  const { toast } = useToast();
  
  const createAlertMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/job-alerts', {
      method: 'POST',
      body: {
        ...data,
        keywords: data.keywords ? data.keywords.split(',').map((k: string) => k.trim()) : [],
        employmentType: data.employmentType,
        experienceLevel: data.experienceLevel,
        remoteType: data.remoteType,
        isActive: true
      }
    }),
    onSuccess: () => {
      toast({ title: "Job alert created successfully!" });
      setIsOpen(false);
      setAlertData({
        title: '',
        keywords: '',
        location: '',
        employmentType: [],
        experienceLevel: [],
        remoteType: [],
        frequency: 'daily'
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create job alert", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleSubmit = () => {
    if (!alertData.title) {
      toast({ 
        title: "Please provide a title for your job alert",
        variant: "destructive" 
      });
      return;
    }
    createAlertMutation.mutate(alertData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-job-alert">
          <BellRing className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Job Alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="alert-title">Alert Title</Label>
            <Input
              id="alert-title"
              placeholder="e.g., Frontend Developer Jobs"
              value={alertData.title}
              onChange={(e) => setAlertData(prev => ({ ...prev, title: e.target.value }))}
              data-testid="input-alert-title"
            />
          </div>
          
          <div>
            <Label htmlFor="alert-keywords">Keywords (comma-separated)</Label>
            <Input
              id="alert-keywords"
              placeholder="e.g., React, JavaScript, Frontend"
              value={alertData.keywords}
              onChange={(e) => setAlertData(prev => ({ ...prev, keywords: e.target.value }))}
              data-testid="input-alert-keywords"
            />
          </div>
          
          <div>
            <Label htmlFor="alert-location">Location</Label>
            <Input
              id="alert-location"
              placeholder="City, state, or remote"
              value={alertData.location}
              onChange={(e) => setAlertData(prev => ({ ...prev, location: e.target.value }))}
              data-testid="input-alert-location"
            />
          </div>
          
          <div>
            <Label htmlFor="alert-frequency">Notification Frequency</Label>
            <Select
              value={alertData.frequency}
              onValueChange={(value) => setAlertData(prev => ({ ...prev, frequency: value }))}
            >
              <SelectTrigger data-testid="select-alert-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createAlertMutation.isPending}
              data-testid="button-save-job-alert"
            >
              {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}