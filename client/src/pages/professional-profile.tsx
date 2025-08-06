import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Shield, LogOut, User, Edit, Plus, MapPin, Globe, Briefcase, 
  GraduationCap, Award, Code, MessageSquare, Camera, Trash2,
  Calendar, ExternalLink, Github, TrendingUp, Clock, DollarSign,
  Building, Mail, Phone, Star, Trophy, Target, Clipboard, Search
} from "lucide-react";
import EmployeeNavHeader from "@/components/employee-nav-header";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
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
  const [addingExperience, setAddingExperience] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  const { data: userResponse, isLoading } = useQuery<{
    user: Employee;
    userType: string;
  }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: profileData } = useQuery<{
    experiences: any[];
    educations: any[];
    certifications: any[];
  }>({
    queryKey: ["/api/employee/profile", userResponse?.user?.id],
    enabled: !!userResponse?.user?.id && userResponse?.userType === "employee",
  });

  // Analytics query for profile insights
  const { data: analytics } = useQuery<{
    profileViews: number;
    applications: number;
    profileScore: number;
  }>({
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

  const experienceForm = useForm({
    resolver: zodResolver(insertExperienceSchema.omit({ employeeId: true })),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: [],
    },
  });

  // Update form when user data changes or when editing starts
  useEffect(() => {
    if (userResponse?.user && editingProfile) {
      const user = userResponse.user as Employee;
      profileForm.reset({
        headline: user.headline || "",
        summary: user.summary || "",
        currentPosition: user.currentPosition || "",
        currentCompany: user.currentCompany || "",
        industry: user.industry || "",
        experienceLevel: user.experienceLevel || "mid",
        salaryExpectation: user.salaryExpectation || "",
        availabilityStatus: user.availabilityStatus || "open",
        noticePeriod: user.noticePeriod || "1_month",
        preferredWorkType: user.preferredWorkType || "hybrid",
        location: user.location || "",
        website: user.website || "",
        skills: user.skills || [],
        specializations: user.specializations || [],
        languages: user.languages || [],
      });
    }
  }, [userResponse?.user, editingProfile, profileForm]);



  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/employee/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", userResponse?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingProfile(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const updateProfilePicture = useMutation({
    mutationFn: async (profilePictureURL: string) => {
      return await apiRequest("PUT", "/api/employee/profile-picture", { profilePictureURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", userResponse?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile Picture Updated", description: "Your profile picture has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile picture", variant: "destructive" });
    },
  });

  const createExperience = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/employee/experience", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", userResponse?.user?.id] });
      setAddingExperience(false);
      experienceForm.reset();
      toast({ title: "Experience added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add experience", variant: "destructive" });
    },
  });

  const updateExperience = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/employee/experience/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", userResponse?.user?.id] });
      setEditingExperience(null);
      experienceForm.reset();
      toast({ title: "Experience updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update experience", variant: "destructive" });
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

  const user = userResponse?.user as Employee;
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

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <EmployeeNavHeader employeeId={user?.employeeId} employeeName={`${user?.firstName} ${user?.lastName}`} />



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Profile Photo */}
                <div className="text-center mb-6">
                  <div className="relative inline-block group">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={user.profilePhoto || ""} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xl">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 rounded-full">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5 * 1024 * 1024} // 5MB
                        onGetUploadParameters={async () => {
                          const response = await apiRequest("POST", "/api/objects/upload");
                          return {
                            method: "PUT" as const,
                            url: response.uploadURL,
                          };
                        }}
                        onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                          const uploadedFile = result.successful?.[0];
                          if (uploadedFile?.uploadURL) {
                            updateProfilePicture.mutate(uploadedFile.uploadURL as string);
                          }
                        }}
                        buttonClassName="bg-transparent hover:bg-transparent border-none p-2 h-auto"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </ObjectUploader>
                    </div>
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
                            <span>Notice: {user.noticePeriod ? `${user.noticePeriod} days` : "Not specified"}</span>
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
                    <Button size="sm" onClick={() => setAddingExperience(true)} data-testid="button-add-experience">
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
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setEditingExperience(exp);
                                  experienceForm.reset({
                                    title: exp.title,
                                    company: exp.company,
                                    location: exp.location || "",
                                    startDate: exp.startDate,
                                    endDate: exp.endDate || "",
                                    current: exp.isCurrent || false,
                                    description: exp.description || "",
                                    achievements: exp.achievements || [],
                                  });
                                }}
                                data-testid={`button-edit-experience-${exp.id}`}
                              >
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
                        <Button onClick={() => setAddingExperience(true)} data-testid="button-add-first-experience">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Experience
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Section */}
              <TabsContent value="education" className="space-y-6">
                <EducationSection educations={profile.educations || []} employeeId={user.id} />
              </TabsContent>

              {/* Certifications Section */}
              <TabsContent value="certifications" className="space-y-6">
                <CertificationSection certifications={profile.certifications || []} employeeId={user.id} />
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
                            <span className={user.skills && user.skills.length > 0 ? "text-green-600" : "text-red-600"}>
                              {user.skills && user.skills.length > 0 ? "Complete" : "Missing"}
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

      {/* Add/Edit Experience Dialog */}
      <Dialog open={addingExperience || !!editingExperience} onOpenChange={(open) => {
        if (!open) {
          setAddingExperience(false);
          setEditingExperience(null);
          experienceForm.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExperience ? "Edit Work Experience" : "Add Work Experience"}</DialogTitle>
          </DialogHeader>
          <Form {...experienceForm}>
            <form onSubmit={experienceForm.handleSubmit((data) => {
              if (editingExperience) {
                updateExperience.mutate({ id: editingExperience.id, data });
              } else {
                createExperience.mutate(data);
              }
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={experienceForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Senior Software Engineer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={experienceForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Google" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={experienceForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., San Francisco, CA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={experienceForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={field.value ? field.value.split('-')[1] : ""} 
                            onValueChange={(month) => {
                              const year = field.value ? field.value.split('-')[0] : "2025";
                              field.onChange(`${year}-${month}`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="01">January</SelectItem>
                              <SelectItem value="02">February</SelectItem>
                              <SelectItem value="03">March</SelectItem>
                              <SelectItem value="04">April</SelectItem>
                              <SelectItem value="05">May</SelectItem>
                              <SelectItem value="06">June</SelectItem>
                              <SelectItem value="07">July</SelectItem>
                              <SelectItem value="08">August</SelectItem>
                              <SelectItem value="09">September</SelectItem>
                              <SelectItem value="10">October</SelectItem>
                              <SelectItem value="11">November</SelectItem>
                              <SelectItem value="12">December</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select 
                            value={field.value ? field.value.split('-')[0] : ""} 
                            onValueChange={(year) => {
                              const month = field.value ? field.value.split('-')[1] : "01";
                              field.onChange(`${year}-${month}`);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {Array.from({ length: 41 }, (_, i) => 2030 - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={experienceForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={field.value ? field.value.split('-')[1] : ""} 
                            onValueChange={(month) => {
                              const year = field.value ? field.value.split('-')[0] : "2025";
                              field.onChange(`${year}-${month}`);
                            }}
                            disabled={experienceForm.watch("current")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="01">January</SelectItem>
                              <SelectItem value="02">February</SelectItem>
                              <SelectItem value="03">March</SelectItem>
                              <SelectItem value="04">April</SelectItem>
                              <SelectItem value="05">May</SelectItem>
                              <SelectItem value="06">June</SelectItem>
                              <SelectItem value="07">July</SelectItem>
                              <SelectItem value="08">August</SelectItem>
                              <SelectItem value="09">September</SelectItem>
                              <SelectItem value="10">October</SelectItem>
                              <SelectItem value="11">November</SelectItem>
                              <SelectItem value="12">December</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select 
                            value={field.value ? field.value.split('-')[0] : ""} 
                            onValueChange={(year) => {
                              const month = field.value ? field.value.split('-')[1] : "01";
                              field.onChange(`${year}-${month}`);
                            }}
                            disabled={experienceForm.watch("current")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {Array.from({ length: 41 }, (_, i) => 2030 - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={experienceForm.control}
                name="current"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) {
                            experienceForm.setValue("endDate", "");
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I currently work here</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={experienceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Describe your role, responsibilities, and key achievements..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setAddingExperience(false);
                  setEditingExperience(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createExperience.isPending || updateExperience.isPending}>
                  {createExperience.isPending || updateExperience.isPending
                    ? (editingExperience ? "Updating..." : "Adding...")
                    : (editingExperience ? "Update Experience" : "Add Experience")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Education Section Component
function EducationSection({ educations, employeeId }: { educations: Education[], employeeId: string }) {
  const [addingEducation, setAddingEducation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const educationForm = useForm({
    resolver: zodResolver(insertEducationSchema),
    defaultValues: {
      employeeId,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      category: "",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
      grade: "",
      activities: "",
      description: "",
    },
  });

  const addEducation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/employee/education", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", employeeId] });
      setAddingEducation(false);
      educationForm.reset();
      toast({ title: "Education Added", description: "Your education has been added successfully." });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Education
          </CardTitle>
        </div>
        <Button 
          onClick={() => setAddingEducation(true)}
          size="sm"
          data-testid="button-add-education"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Education
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {educations.length > 0 ? (
          <div className="space-y-4">
            {educations.map((education) => (
              <div key={education.id} className="border-l-2 border-blue-200 pl-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{education.degree}</h3>
                    <p className="text-gray-700 font-medium">{education.institution}</p>
                    {education.fieldOfStudy && (
                      <p className="text-sm text-gray-600">{education.fieldOfStudy}</p>
                    )}
                    {education.category && (
                      <Badge variant="secondary" className="text-xs mt-1 capitalize">
                        {education.category}
                      </Badge>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {education.startYear} - {education.endYear || "Present"}
                    </p>
                    {education.grade && (
                      <p className="text-sm text-gray-600 mt-1">Grade: {education.grade}</p>
                    )}
                    {education.activities && (
                      <p className="text-gray-700 mt-2">Activities: {education.activities}</p>
                    )}
                    {education.description && (
                      <p className="text-gray-600 mt-2 text-sm">{education.description}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`button-edit-education-${education.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No education added yet</h3>
            <p className="text-gray-600 mb-4">Add your educational background to showcase your qualifications</p>
            <Button onClick={() => setAddingEducation(true)} data-testid="button-add-first-education">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Education
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add Education Dialog */}
      <Dialog open={addingEducation} onOpenChange={setAddingEducation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit(
              (data) => {
                console.log("Form data:", data);
                addEducation.mutate(data);
              },
              (errors) => {
                console.log("Form errors:", errors);
              }
            )} className="space-y-4">
              <FormField
                control={educationForm.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="University/School Name" {...field} data-testid="input-institution" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Bachelor of Science" {...field} data-testid="input-degree" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="fieldOfStudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} data-testid="input-field-of-study" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select education category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="postgraduate">Postgraduate</SelectItem>
                          <SelectItem value="doctorate">Doctorate</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="vocational">Vocational</SelectItem>
                          <SelectItem value="online">Online Course</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={educationForm.control}
                  name="startYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Year</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1900" 
                          max={new Date().getFullYear()}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-start-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationForm.control}
                  name="endYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Year</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1900" 
                          max={new Date().getFullYear() + 10}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-end-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={educationForm.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade/GPA</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 3.8/4.0, First Class" {...field} data-testid="input-grade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="activities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activities and Societies</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Student Council, Debate Club" {...field} data-testid="input-activities" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={educationForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about your education..."
                        rows={3}
                        {...field} 
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAddingEducation(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={addEducation.isPending} data-testid="button-submit">
                  {addEducation.isPending ? "Adding..." : "Add Education"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Certification Section Component
function CertificationSection({ certifications, employeeId }: { certifications: Certification[], employeeId: string }) {
  const [addingCertification, setAddingCertification] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const certificationForm = useForm({
    resolver: zodResolver(insertCertificationSchema),
    defaultValues: {
      employeeId,
      name: "",
      issuingOrganization: "",
      issueDate: "",
      expirationDate: "",
      credentialId: "",
      credentialUrl: "",
      description: "",
    },
  });

  const addCertification = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/employee/certification", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", employeeId] });
      setAddingCertification(false);
      certificationForm.reset();
      toast({ title: "Certification Added", description: "Your certification has been added successfully." });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Certifications
          </CardTitle>
        </div>
        <Button 
          onClick={() => setAddingCertification(true)}
          size="sm"
          data-testid="button-add-certification"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Certification
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {certifications.length > 0 ? (
          <div className="space-y-4">
            {certifications.map((certification) => (
              <div key={certification.id} className="border-l-2 border-green-200 pl-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{certification.name}</h3>
                    <p className="text-gray-700 font-medium">{certification.issuingOrganization}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Issued: {certification.issueDate}
                      {certification.expirationDate && ` • Expires: ${certification.expirationDate}`}
                    </p>
                    {certification.credentialId && (
                      <p className="text-sm text-gray-600 mt-1">Credential ID: {certification.credentialId}</p>
                    )}
                    {certification.credentialUrl && (
                      <a 
                        href={certification.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-flex items-center"
                      >
                        View Credential <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                    {certification.description && (
                      <p className="text-gray-600 mt-2 text-sm">{certification.description}</p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`button-edit-certification-${certification.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications added yet</h3>
            <p className="text-gray-600 mb-4">Add your professional certifications to showcase your expertise</p>
            <Button onClick={() => setAddingCertification(true)} data-testid="button-add-first-certification">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Certification
            </Button>
          </div>
        )}
      </CardContent>

      {/* Add Certification Dialog */}
      <Dialog open={addingCertification} onOpenChange={setAddingCertification}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <Form {...certificationForm}>
            <form onSubmit={certificationForm.handleSubmit(
              (data) => {
                console.log("Certification form data:", data);
                addCertification.mutate(data);
              },
              (errors) => {
                console.log("Certification form errors:", errors);
              }
            )} className="space-y-4">
              <FormField
                control={certificationForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AWS Certified Solutions Architect" {...field} data-testid="input-certification-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certificationForm.control}
                name="issuingOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuing Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Amazon Web Services" {...field} data-testid="input-issuing-organization" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={certificationForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-issue-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={certificationForm.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiration-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={certificationForm.control}
                name="credentialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AWS-ASA-1234567" {...field} data-testid="input-credential-id" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certificationForm.control}
                name="credentialUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-credential-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={certificationForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional details about this certification..."
                        rows={3}
                        {...field} 
                        data-testid="textarea-certification-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAddingCertification(false)} data-testid="button-cancel-certification">
                  Cancel
                </Button>
                <Button type="submit" disabled={addCertification.isPending} data-testid="button-submit-certification">
                  {addCertification.isPending ? "Adding..." : "Add Certification"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}