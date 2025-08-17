import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Filter, MapPin, Clock, DollarSign, Building2, 
  Bookmark, BookmarkCheck, Bell, BellRing, Eye, Send,
  Briefcase, TrendingUp, Star, Users, ChevronRight,
  Heart, HeartHandshake, Zap, Target, Brain, Globe, 
  Paperclip, FileText, X, Menu, MoreVertical, Download,
  CheckCircle, XCircle, Calendar, User, AlertCircle
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
  
  // Search and filter state
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('discover');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [quickFilters, setQuickFilters] = useState<string[]>([]);
  
  // Application dialog state
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeWorkDiary, setIncludeWorkDiary] = useState(true);
  const [attachment, setAttachment] = useState<File | null>(null);

  // Job search query
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

  // Perfect matches (AI-powered recommendations)
  const { data: perfectMatches = [] } = useQuery({
    queryKey: ['/api/jobs/perfect-matches'],
    enabled: selectedTab === 'discover'
  });

  // Trending skills
  const trendingSkills = ['React', 'Python', 'AI/ML', 'Node.js', 'TypeScript', 'AWS', 'Data Science', 'UI/UX'];

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
      let attachmentUrl = '';
      let attachmentName = '';
      
      if (attachment) {
        const uploadResponse = await fetch('/api/objects/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!uploadResponse.ok) throw new Error('Failed to get upload URL');
        const { uploadURL } = await uploadResponse.json();
        
        const uploadFileResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: attachment,
          headers: { 'Content-Type': attachment.type }
        });
        
        if (!uploadFileResponse.ok) throw new Error('Failed to upload attachment');
        
        attachmentUrl = uploadURL.split('?')[0];
        attachmentName = attachment.name;
      }
      
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
      setIsApplyDialogOpen(false);
      setCoverLetter('');
      setAttachment(null);
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

  const handleQuickFilter = (category: string) => {
    const quickFilters: Record<string, Partial<JobSearchFilters>> = {
      'Remote': { remoteType: ['remote'] },
      'Full-time': { employmentType: ['full-time'] },
      'Entry Level': { experienceLevel: ['entry'] },
      'Senior': { experienceLevel: ['senior'] },
      'Tech': { keywords: 'technology software engineer developer' },
      'Finance': { keywords: 'finance accounting financial analyst' }
    };
    
    setFilters(prev => ({ ...prev, ...quickFilters[category] }));
  };

  // Toggle quick filter chips
  const toggleQuickFilter = (value: string) => {
    setQuickFilters(prev => 
      prev.includes(value) 
        ? prev.filter(f => f !== value)
        : [...prev, value]
    );
    
    // Apply filter based on value
    const filterMap: Record<string, Partial<JobSearchFilters>> = {
      'remote': { remoteType: ['remote'] },
      'full-time': { employmentType: ['full-time'] },
      'entry': { experienceLevel: ['entry'] },
      'senior': { experienceLevel: ['senior'] },
      'technology': { keywords: 'technology' },
      'design': { keywords: 'design' },
      'marketing': { keywords: 'marketing' }
    };
    
    if (quickFilters.includes(value)) {
      // Remove filter
      setFilters(prev => {
        const newFilters = { ...prev };
        if (value === 'remote') newFilters.remoteType = [];
        if (value === 'full-time') newFilters.employmentType = [];
        if (['entry', 'senior'].includes(value)) newFilters.experienceLevel = [];
        if (['technology', 'design', 'marketing'].includes(value)) newFilters.keywords = '';
        return newFilters;
      });
    } else {
      // Add filter
      setFilters(prev => ({ ...prev, ...filterMap[value] }));
    }
  };

  // Sync searchTerm with filters
  useEffect(() => {
    if (searchTerm) {
      setFilters(prev => ({ ...prev, keywords: searchTerm }));
    }
  }, [searchTerm]);

  const isJobSaved = (jobId: string) => {
    return savedJobs.some((saved: SavedJob) => saved.jobId === jobId);
  };

  const hasApplied = (jobId: string) => {
    return myApplications.some((app: JobApplication) => app.jobId === jobId);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'viewed': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'shortlisted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'interviewed': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'offered': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'hired': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const JobCard = ({ job }: { job: JobListing }) => {
    const saved = isJobSaved(job.id);
    const applied = hasApplied(job.id);
    
    return (
      <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Company Name</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 cursor-pointer hover:text-blue-600" 
                    onClick={() => setSelectedJobId(job.id)}
                    data-testid={`job-title-${job.id}`}>
                  {job.title}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary" className="capitalize">
                    {job.employmentType.replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {job.experienceLevel}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {job.remoteType}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">{job.salaryRange}</p>
                <p className="text-sm text-muted-foreground">{job.location}</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground line-clamp-2">{job.description}</p>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {job.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{job.skills.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>2 days ago</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{job.views || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{job.applicationsCount || 0} applicants</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saved ? unsaveJobMutation.mutate(job.id) : saveJobMutation.mutate(job.id)}
                  data-testid={`button-save-${job.id}`}
                >
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </Button>
                
                {applied ? (
                  <Button variant="outline" size="sm" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSelectedJobId(job.id);
                      setIsApplyDialogOpen(true);
                    }}
                    data-testid={`button-apply-${job.id}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FiltersSidebar = () => (
    <div className="space-y-6">
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
                {level}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Work Style */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Work Style</Label>
        <div className="space-y-2">
          {['office', 'remote', 'hybrid'].map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={style}
                checked={filters.remoteType?.includes(style)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilters(prev => ({
                      ...prev,
                      remoteType: [...(prev.remoteType || []), style]
                    }));
                  } else {
                    setFilters(prev => ({
                      ...prev,
                      remoteType: prev.remoteType?.filter(s => s !== style)
                    }));
                  }
                }}
                data-testid={`checkbox-remote-${style}`}
              />
              <Label htmlFor={style} className="capitalize">
                {style}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Salary Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Salary Range</Label>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Min salary"
            value={filters.salaryMin || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, salaryMin: parseInt(e.target.value) || undefined }))}
            data-testid="input-salary-min"
          />
          <Input
            type="number"
            placeholder="Max salary"
            value={filters.salaryMax || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, salaryMax: parseInt(e.target.value) || undefined }))}
            data-testid="input-salary-max"
          />
        </div>
      </div>

      {/* Clear Filters */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setFilters({})}
        data-testid="button-clear-filters"
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <EmployeeNavHeader />

      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-2xl p-6 lg:p-8 text-white">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-6 w-6 lg:h-8 lg:w-8" />
              <h1 className="text-2xl lg:text-3xl font-bold">AI-Powered Job Discovery</h1>
            </div>
            <p className="text-lg lg:text-xl opacity-90">
              Find your perfect role with intelligent matching
            </p>
            
            {/* Search Bar */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 lg:p-6 mt-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <Input
                  placeholder="Job title, skills, or company..."
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-lg h-12 flex-1"
                  data-testid="input-job-search"
                />
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
              <div className="flex flex-wrap gap-2 lg:gap-3">
                {['Remote', 'Full-time', 'Entry Level', 'Senior', 'Tech', 'Finance'].map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={() => handleQuickFilter(tag)}
                    data-testid={`button-filter-${tag.toLowerCase().replace(' ', '-')}`}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Smart Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Perfect Matches</h3>
                  <p className="text-sm text-muted-foreground">{perfectMatches.length} jobs found</p>
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
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trendingSkills.slice(0, 3).map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="outline" 
                        className="text-xs cursor-pointer"
                        onClick={() => setFilters(prev => ({ ...prev, keywords: skill }))}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
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

        {/* Advanced Search and Filter Section */}
        <div className="space-y-4 bg-card rounded-lg p-6 border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search jobs by title, skills, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg border-2 focus:border-blue-500"
                data-testid="input-job-search"
              />
            </div>
            {/* Desktop Filters Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden lg:flex items-center gap-2 px-6 py-3 h-auto"
              data-testid="button-desktop-filters"
            >
              <Filter className="h-5 w-5" />
              Filters
              {Object.values(filters).some(val => val && (Array.isArray(val) ? val.length > 0 : true)) && (
                <span className="ml-1 bg-blue-500 text-white rounded-full text-xs px-2 py-1">
                  {Object.values(filters).filter(val => val && (Array.isArray(val) ? val.length > 0 : true)).length}
                </span>
              )}
            </Button>
          </div>
          
          {/* Category chips for quick filtering */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Remote", value: "remote" },
              { label: "Full-time", value: "full-time" },
              { label: "Entry Level", value: "entry" },
              { label: "Senior", value: "senior" },
              { label: "Tech", value: "technology" },
              { label: "Design", value: "design" },
              { label: "Marketing", value: "marketing" }
            ].map((chip) => (
              <Button
                key={chip.value}
                variant={quickFilters.includes(chip.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleQuickFilter(chip.value)}
                className="rounded-full"
                data-testid={`chip-${chip.value}`}
              >
                {chip.label}
              </Button>
            ))}
          </div>

          {/* Mobile Filters Button - Under category chips */}
          <div className="lg:hidden">
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" data-testid="button-mobile-filters">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                  {Object.values(filters).some(val => val && (Array.isArray(val) ? val.length > 0 : true)) && (
                    <span className="ml-1 bg-blue-500 text-white rounded-full text-xs px-2 py-1">
                      {Object.values(filters).filter(val => val && (Array.isArray(val) ? val.length > 0 : true)).length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] flex flex-col">
                <SheetHeader className="flex-shrink-0 pb-4">
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Advanced Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-1 pb-4">
                  <FiltersSidebar />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted p-1 rounded-lg">
            <TabsTrigger value="discover" className="flex items-center gap-2" data-testid="tab-discover">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2" data-testid="tab-saved">
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2" data-testid="tab-applications">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2" data-testid="tab-alerts">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <div className="flex gap-6">
              {/* Desktop Filters Sidebar - Toggle visibility */}
              {showFilters && (
                <div className="hidden lg:block w-80">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Advanced Filters
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFilters(false)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FiltersSidebar />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Jobs List */}
              <div className="flex-1 space-y-4">
                {jobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : jobs.length > 0 ? (
                  jobs.map((job: JobListing) => (
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                      <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedJobs.length > 0 ? (
              savedJobs.map((savedJob: SavedJob) => {
                const job = jobs.find(j => j.id === savedJob.jobId);
                return job ? <JobCard key={job.id} job={job} /> : null;
              })
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No saved jobs</h3>
                  <p className="text-muted-foreground">Save jobs you're interested in to view them here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            {myApplications.length > 0 ? (
              myApplications.map((application: JobApplication) => (
                <Card key={application.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Job Application</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusBadgeColor(application.status)}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {application.companyNotes && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <span className="font-medium">Company Notes:</span> {application.companyNotes}
                          </p>
                        )}
                        {application.attachmentUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={application.attachmentUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download Resume
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {application.coverLetter && (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Cover Letter</h4>
                        <p className="text-sm text-muted-foreground">{application.coverLetter}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
                  <p className="text-muted-foreground">Start applying to jobs to track your applications here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Job Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {jobAlerts.length > 0 ? (
              jobAlerts.map((alert: JobAlert) => (
                <Card key={alert.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{alert.alertName}</h3>
                        <div className="space-y-2">
                          {alert.keywords && alert.keywords.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Keywords: </span>
                              <span className="text-sm text-muted-foreground">{alert.keywords.join(', ')}</span>
                            </div>
                          )}
                          {alert.locations && alert.locations.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Locations: </span>
                              <span className="text-sm text-muted-foreground">{alert.locations.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.isActive ? "default" : "secondary"}>
                          {alert.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No job alerts</h3>
                  <p className="text-muted-foreground mb-4">Create alerts to get notified about matching jobs</p>
                  <Button>
                    <BellRing className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Apply Dialog */}
      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply for Job</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Cover Letter */}
            <div>
              <Label className="text-sm font-medium">Cover Letter</Label>
              <Textarea
                placeholder="Write a personalized cover letter..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="mt-1 min-h-[120px]"
                data-testid="textarea-cover-letter"
              />
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-profile"
                  checked={includeProfile}
                  onCheckedChange={setIncludeProfile}
                  data-testid="checkbox-include-profile"
                />
                <Label htmlFor="include-profile">
                  Include my profile page as CV
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-work-diary"
                  checked={includeWorkDiary}
                  onCheckedChange={setIncludeWorkDiary}
                  data-testid="checkbox-include-work-diary"
                />
                <Label htmlFor="include-work-diary">
                  Include my work diary as experience
                </Label>
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <Label className="text-sm font-medium">Additional Documents</Label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                  id="attachment-upload"
                  data-testid="input-attachment"
                />
                <Label
                  htmlFor="attachment-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {attachment ? attachment.name : 'Attach Resume/Portfolio'}
                </Label>
                {attachment && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachment(null)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => setIsApplyDialogOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedJobId && applyJobMutation.mutate({
                  jobId: selectedJobId,
                  coverLetter,
                  includeProfile,
                  includeWorkDiary,
                  attachment: attachment || undefined
                })}
                disabled={applyJobMutation.isPending}
                className="flex-1"
                data-testid="button-submit-application"
              >
                {applyJobMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}