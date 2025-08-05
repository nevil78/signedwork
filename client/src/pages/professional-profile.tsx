import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, LogOut, User, Edit, Plus, MapPin, Globe, Briefcase, 
  GraduationCap, Award, Code, MessageSquare, Camera, Trash2,
  Calendar, ExternalLink, Github, TrendingUp, Clock, DollarSign,
  Building, Mail, Phone, Star, Trophy, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  type Employee, type Experience, type Education, type Certification, 
  insertExperienceSchema, insertEducationSchema, insertCertificationSchema
} from "@shared/schema";
import { z } from "zod";

// Enhanced profile update schema
const profileUpdateSchema = z.object({
  headline: z.string().max(120, "Headline must be under 120 characters"),
  summary: z.string().max(2000, "Summary must be under 2000 characters"),
  currentPosition: z.string().optional(),
  currentCompany: z.string().optional(),
  industry: z.string().optional(),
  experienceLevel: z.enum(["entry", "mid", "senior", "lead", "director", "executive"]).optional(),
  salaryExpectation: z.string().optional(),
  availabilityStatus: z.enum(["open", "not_looking", "passive"]).optional(),
  noticePeriod: z.enum(["immediate", "1_month", "2_months", "3_months"]).optional(),
  preferredWorkType: z.enum(["remote", "office", "hybrid"]).optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
});

type ProfileSection = "overview" | "experience" | "education" | "certifications" | "analytics";

export default function ProfessionalProfile() {
  const [activeSection, setActiveSection] = useState<ProfileSection>("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userResponse, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: profileData } = useQuery({
    queryKey: ["/api/employee/profile", userResponse?.user?.id],
    enabled: !!userResponse?.user?.id && userResponse?.userType === "employee",
  });

  // Analytics query for profile insights
  const { data: analytics } = useQuery({
    queryKey: ["/api/employee/analytics", userResponse?.user?.id],
    enabled: !!userResponse?.user?.id && userResponse?.userType === "employee",
  });

  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      headline: "",
      summary: "",
      currentPosition: "",
      currentCompany: "",
      industry: "",
      experienceLevel: "mid" as const,
      salaryExpectation: "",
      availabilityStatus: "open" as const,
      noticePeriod: "1_month" as const,
      preferredWorkType: "hybrid" as const,
      location: "",
      website: "",
      skills: [],
      specializations: [],
      languages: [],
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/employee/profile/${userResponse?.user?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setEditingProfile(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userResponse || userResponse.userType !== "employee") {
    window.location.href = "/";
    return null;
  }

  const user = userResponse.user as Employee;
  const profile = profileData || {
    experiences: [],
    educations: [],
    certifications: [],
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "passive": return "bg-yellow-100 text-yellow-800";
      case "not_looking": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getExperienceLevelColor = (level: string) => {
    switch (level) {
      case "entry": return "bg-blue-100 text-blue-800";
      case "mid": return "bg-purple-100 text-purple-800";
      case "senior": return "bg-orange-100 text-orange-800";
      case "lead": return "bg-red-100 text-red-800";
      case "director": return "bg-gray-100 text-gray-800";
      case "executive": return "bg-black text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-gray-900">Professional Profile</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.employeeId}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Profile Photo */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={user.profilePhoto || ""} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xl">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">{user.headline || "Professional"}</p>
                  
                  {/* Status Badges */}
                  <div className="mt-3 space-y-2">
                    {user.availabilityStatus && (
                      <Badge className={`${getAvailabilityColor(user.availabilityStatus)} text-xs`}>
                        {user.availabilityStatus.replace("_", " ").toUpperCase()}
                      </Badge>
                    )}
                    {user.experienceLevel && (
                      <Badge className={`${getExperienceLevelColor(user.experienceLevel)} text-xs ml-2`}>
                        {user.experienceLevel.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "experience", label: "Experience", icon: Briefcase },
                    { id: "education", label: "Education", icon: GraduationCap },
                    { id: "certifications", label: "Certifications", icon: Award },
                    { id: "analytics", label: "Analytics", icon: TrendingUp },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id as ProfileSection)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      data-testid={`nav-${item.id}`}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </button>
                  ))}
                </nav>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profile Views</span>
                      <span className="font-medium">{analytics?.profileViews || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Applications</span>
                      <span className="font-medium">{analytics?.applications || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Profile Score</span>
                      <span className="font-medium">{analytics?.profileScore || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as ProfileSection)}>
              {/* Overview Section */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Professional Summary</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingProfile(true)}
                      data-testid="button-edit-profile"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Professional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Current Role</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{user.currentPosition || "Position not specified"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Building className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{user.currentCompany || "Company not specified"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{user.location || "Location not specified"}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Target className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Work Type: {user.preferredWorkType || "Not specified"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Notice: {user.noticePeriod?.replace("_", " ") || "Not specified"}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Salary: {user.salaryExpectation || "Not disclosed"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {user.summary && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">About</h4>
                        <p className="text-gray-700 leading-relaxed">{user.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {user.skills && user.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Core Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specializations */}
                    {user.specializations && user.specializations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Specializations</h4>
                        <div className="flex flex-wrap gap-2">
                          {user.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact & Links */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{user.phone}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {user.website && (
                            <div className="flex items-center text-sm">
                              <Globe className="h-4 w-4 mr-2 text-gray-400" />
                              <a href={user.website} target="_blank" rel="noopener noreferrer" 
                                 className="text-primary hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                          {user.linkedinUrl && (
                            <div className="flex items-center text-sm">
                              <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
                              <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                                 className="text-primary hover:underline">
                                LinkedIn
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience Section */}
              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Work Experience</CardTitle>
                    <Button size="sm" data-testid="button-add-experience">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {profile.experiences && profile.experiences.length > 0 ? (
                      <div className="space-y-6">
                        {profile.experiences.map((exp: Experience) => (
                          <div key={exp.id} className="border-l-2 border-gray-200 pl-6 pb-6 last:pb-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                                <p className="text-primary font-medium">{exp.company}</p>
                                <p className="text-sm text-gray-600">
                                  {exp.startDate} - {exp.endDate || "Present"}
                                  {exp.location && ` • ${exp.location}`}
                                </p>
                                {exp.description && (
                                  <p className="mt-2 text-gray-700">{exp.description}</p>
                                )}
                                {exp.achievements && exp.achievements.length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="text-sm font-medium text-gray-900 mb-2">Key Achievements:</h5>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                      {exp.achievements.map((achievement, index) => (
                                        <li key={index} className="flex items-start">
                                          <Trophy className="h-3 w-3 mr-2 mt-1 text-yellow-500 flex-shrink-0" />
                                          {achievement}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No experience added yet</h3>
                        <p className="text-gray-600 mb-4">Showcase your professional journey</p>
                        <Button data-testid="button-add-first-experience">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Experience
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Section */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Profile Views</p>
                          <p className="text-2xl font-bold">{analytics?.profileViews || 0}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Job Applications</p>
                          <p className="text-2xl font-bold">{analytics?.applications || 0}</p>
                        </div>
                        <Briefcase className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Profile Score</p>
                          <p className="text-2xl font-bold">{analytics?.profileScore || 0}%</p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Overall Progress</span>
                          <span>{analytics?.profileScore || 0}%</span>
                        </div>
                        <Progress value={analytics?.profileScore || 0} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Basic Info</span>
                            <span className="text-green-600">Complete</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Professional Summary</span>
                            <span className={user.summary ? "text-green-600" : "text-red-600"}>
                              {user.summary ? "Complete" : "Missing"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Work Experience</span>
                            <span className={profile.experiences?.length > 0 ? "text-green-600" : "text-red-600"}>
                              {profile.experiences?.length > 0 ? "Complete" : "Missing"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Education</span>
                            <span className={profile.educations?.length > 0 ? "text-green-600" : "text-red-600"}>
                              {profile.educations?.length > 0 ? "Complete" : "Missing"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Skills</span>
                            <span className={user.skills?.length > 0 ? "text-green-600" : "text-red-600"}>
                              {user.skills?.length > 0 ? "Complete" : "Missing"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Profile Photo</span>
                            <span className={user.profilePhoto ? "text-green-600" : "text-red-600"}>
                              {user.profilePhoto ? "Complete" : "Missing"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Professional Profile</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit((data) => updateProfile.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Professional Headline</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Senior Software Engineer at Tech Corp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="currentPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Position</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Senior Developer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Company</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., TechCorp Inc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="lead">Lead</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Actively Looking</SelectItem>
                          <SelectItem value="passive">Open to Opportunities</SelectItem>
                          <SelectItem value="not_looking">Not Looking</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Summary</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={6}
                        placeholder="Write a compelling summary of your professional background, key skills, and career objectives..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}