import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Award, Briefcase, GraduationCap, FolderOpen, MessageSquare, User, Calendar, MapPin, Globe, Building, ExternalLink, Trash2, Camera, Upload, Edit2, Phone, Heart, Github, Linkedin, Twitter, Folder, Languages, Trophy, Home, Flag, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  type Experience,
  type Education,
  type Certification,
  type Project,
  type Endorsement,
  type Employee,
  type InsertExperience,
  type InsertEducation,
  type InsertCertification,
  type InsertProject,
  type InsertEndorsement,
  insertExperienceSchema,
  insertEducationSchema,
  insertCertificationSchema,
  insertProjectSchema,
  insertEndorsementSchema
} from "@shared/schema";

type ProfileSection = "overview" | "experience" | "education" | "certifications";

export default function Profile() {
  const [activeSection, setActiveSection] = useState<ProfileSection>("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user data
  const { data: userResponse, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/employee/profile", (userResponse as any)?.user?.id],
    enabled: !!(userResponse as any)?.user?.id && (userResponse as any)?.userType === "employee",
  });

  const isLoading = userLoading || profileLoading;
  const user = (userResponse as any)?.user as Employee;
  const profile = profileData || { experiences: [], educations: [], certifications: [], projects: [], endorsements: [] };

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

  // Profile picture upload mutation
  const profilePictureMutation = useMutation({
    mutationFn: async (data: { profilePictureURL: string }) => {
      const response = await fetch("/api/employee/profile-picture", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update profile picture");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    },
  });

  const sidebarItems = [
    { id: "overview", label: "Profile Overview", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userResponse || (userResponse as any).userType !== "employee") {
    window.location.href = "/";
    return null;
  }

  const handleProfilePictureUpload = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to get upload URL");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleProfilePictureComplete = (result: any) => {
    if (result.successful && result.successful[0]) {
      profilePictureMutation.mutate({
        profilePictureURL: result.successful[0].uploadURL,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <User className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-slate-800">Employee Dashboard</span>
              </div>
              {/* Page Navigation */}
              <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white shadow-sm text-blue-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Link to="/work-diary">
                  <Button variant="ghost" size="sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Work Diary
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={user?.profilePhoto || undefined} />
                      <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {activeSection === "overview" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute -bottom-2 -right-2">
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={5242880} // 5MB
                                onGetUploadParameters={handleProfilePictureUpload}
                                onComplete={handleProfilePictureComplete}
                                buttonClassName="rounded-full p-2 bg-primary text-white hover:bg-primary/90 shadow-lg"
                              >
                                {user?.profilePhoto ? (
                                  <Edit2 className="w-4 h-4" />
                                ) : (
                                  <Camera className="w-4 h-4" />
                                )}
                              </ObjectUploader>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user?.profilePhoto ? "Change profile picture" : "Add profile picture"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-2 mb-1">
                    <span className="text-xs text-slate-500">ID:</span>
                    <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded font-mono">
                      {user?.employeeId}
                    </code>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {user?.headline || "Professional"}
                  </p>
                </div>
                
                <nav className="space-y-2">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id as ProfileSection)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeSection === item.id
                            ? "bg-primary text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "overview" && <ProfileOverview user={user} />}
            {activeSection === "experience" && <ExperienceSection experiences={(profile as any)?.experiences || []} />}
            {activeSection === "education" && <EducationSection educations={(profile as any)?.educations || []} />}
            {activeSection === "certifications" && <CertificationSection certifications={(profile as any)?.certifications || []} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Overview Component
function ProfileOverview({ user }: { user: Employee }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      headline: user?.headline || "",
      summary: user?.summary || "",
      location: user?.location || "",
      website: user?.website || "",
      currentPosition: user?.currentPosition || "",
      currentCompany: user?.currentCompany || "",
      industry: user?.industry || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      country: user?.country || "",
      dateOfBirth: user?.dateOfBirth || "",
      nationality: user?.nationality || "",
      maritalStatus: user?.maritalStatus || "",
      portfolioUrl: user?.portfolioUrl || "",
      githubUrl: user?.githubUrl || "",
      linkedinUrl: user?.linkedinUrl || "",
      twitterUrl: user?.twitterUrl || "",
      skills: user?.skills?.join(", ") || "",
      languages: user?.languages?.join(", ") || "",
      hobbies: user?.hobbies?.join(", ") || "",
      achievements: user?.achievements?.join("; ") || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        skills: data.skills ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        languages: data.languages ? data.languages.split(",").map((l: string) => l.trim()).filter(Boolean) : [],
        hobbies: data.hobbies ? data.hobbies.split(",").map((h: string) => h.trim()).filter(Boolean) : [],
        achievements: data.achievements ? data.achievements.split(";").map((a: string) => a.trim()).filter(Boolean) : [],
      };
      
      const response = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Profile Information</DialogTitle>
                  <DialogDescription>
                    Update your comprehensive profile information
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. American" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maritalStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marital Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="single">Single</SelectItem>
                                  <SelectItem value="married">Married</SelectItem>
                                  <SelectItem value="divorced">Divorced</SelectItem>
                                  <SelectItem value="widowed">Widowed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Address Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 123 Main Street, Apt 4B" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. New York" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State/Province</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. NY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="zipCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ZIP/Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 10001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. United States" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Location (Brief)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. New York, NY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Professional Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="headline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Headline</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Senior Software Engineer at Tech Corp" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="summary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Summary</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Write a brief summary of your professional background, skills, and career goals..."
                                  rows={4}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="currentPosition"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Position</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Senior Software Engineer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="currentCompany"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Tech Corporation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="industry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Technology, Healthcare, Finance" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Skills and Interests */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Skills & Interests</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name="skills"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skills (comma-separated)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="e.g. JavaScript, React, Node.js, Python, Project Management"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="languages"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Languages (comma-separated)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. English (Native), Spanish (Fluent), French (Basic)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hobbies"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hobbies & Interests (comma-separated)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Photography, Hiking, Reading, Chess, Cooking" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="achievements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Key Achievements (semicolon-separated)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="e.g. Led team of 5 developers; Increased system performance by 40%; Published 3 technical articles"
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Online Presence */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Online Presence</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Personal Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://yourwebsite.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="portfolioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://portfolio.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="githubUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub Profile</FormLabel>
                              <FormControl>
                                <Input placeholder="https://github.com/username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn Profile</FormLabel>
                              <FormControl>
                                <Input placeholder="https://linkedin.com/in/username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="twitterUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter Profile</FormLabel>
                              <FormControl>
                                <Input placeholder="https://twitter.com/username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateProfileMutation.isPending}>
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Name:</span>
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Email:</span>
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Phone:</span>
                <span>{user?.countryCode} {user?.phone}</span>
              </div>
              {user?.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Date of Birth:</span>
                  <span>{new Date(user.dateOfBirth).toLocaleDateString()}</span>
                </div>
              )}
              {user?.nationality && (
                <div className="flex items-center gap-2 text-sm">
                  <Flag className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Nationality:</span>
                  <span>{user.nationality}</span>
                </div>
              )}
              {user?.maritalStatus && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Marital Status:</span>
                  <span>{user.maritalStatus}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {(user?.address || user?.city || user?.state) && (
                <div className="flex items-start gap-2 text-sm">
                  <Home className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-medium">Address:</span>
                    <div className="text-slate-600">
                      {user?.address && <div>{user.address}</div>}
                      {(user?.city || user?.state || user?.zipCode) && (
                        <div>
                          {user?.city}{user?.city && user?.state ? ", " : ""}{user?.state} {user?.zipCode}
                        </div>
                      )}
                      {user?.country && <div>{user.country}</div>}
                    </div>
                  </div>
                </div>
              )}
              {user?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Current Location:</span>
                  <span>{user.location}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.headline && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Professional Headline</h4>
              <p className="text-slate-600 text-sm">{user.headline}</p>
            </div>
          )}
          {user?.summary && (
            <div>
              <h4 className="font-medium text-slate-900 mb-2">Summary</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{user.summary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.currentPosition && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Current Position:</span>
                <span>{user.currentPosition}</span>
              </div>
            )}
            {user?.currentCompany && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Current Company:</span>
                <span>{user.currentCompany}</span>
              </div>
            )}
            {user?.industry && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Industry:</span>
                <span>{user.industry}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {user?.skills && user.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user?.languages && user.languages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.languages.map((language, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {language}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hobbies & Interests */}
      {user?.hobbies && user.hobbies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Hobbies & Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.hobbies.map((hobby, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  {hobby}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Online Presence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Online Presence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user?.website && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Website:</span>
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {user.website}
                </a>
              </div>
            )}
            {user?.portfolioUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Folder className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Portfolio:</span>
                <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  View Portfolio
                </a>
              </div>
            )}
            {user?.githubUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Github className="w-4 h-4 text-slate-400" />
                <span className="font-medium">GitHub:</span>
                <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  GitHub Profile
                </a>
              </div>
            )}
            {user?.linkedinUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Linkedin className="w-4 h-4 text-slate-400" />
                <span className="font-medium">LinkedIn:</span>
                <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  LinkedIn Profile
                </a>
              </div>
            )}
            {user?.twitterUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Twitter className="w-4 h-4 text-slate-400" />
                <span className="font-medium">Twitter:</span>
                <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Twitter Profile
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {user?.achievements && user.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Key Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              {user.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Experience Section Component
function ExperienceSection({ experiences }: { experiences: Experience[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertExperience>({
    resolver: zodResolver(insertExperienceSchema.omit({ employeeId: true })),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
      achievements: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertExperience, 'employeeId'>) => {
      const response = await fetch("/api/employee/experience", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add experience");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Experience added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add experience",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertExperience, 'employeeId'>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Experience
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Work Experience</DialogTitle>
                <DialogDescription>
                  Add your professional work experience to build your profile
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Software Engineer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Google" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. San Francisco, CA" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date*</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""} 
                              disabled={form.watch("isCurrent") || false}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isCurrent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I currently work here</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your role and responsibilities..."
                            rows={4}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Experience"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {experiences.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No experience added yet</h3>
            <p className="text-slate-600 mb-4">Share your work experience to showcase your professional journey</p>
          </div>
        ) : (
          <div className="space-y-6">
            {experiences.map((exp) => (
              <div key={exp.id} className="border-l-4 border-primary pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                    <p className="text-primary font-medium">{exp.company}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                      {exp.location && ` • ${exp.location}`}
                    </p>
                    {exp.description && (
                      <p className="text-sm text-slate-600 mt-2">{exp.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Education Section Component  
function EducationSection({ educations }: { educations: Education[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertEducation>({
    resolver: zodResolver(insertEducationSchema.omit({ employeeId: true })),
    defaultValues: {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: new Date().getFullYear(),
      endYear: undefined,
      grade: "",
      activities: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertEducation, 'employeeId'>) => {
      const response = await fetch("/api/employee/education", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add education");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Education added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add education",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertEducation, 'employeeId'>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Education
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Education</DialogTitle>
                <DialogDescription>
                  Add your educational background and achievements
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School/University*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Stanford University" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="degree"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Bachelor of Science" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fieldOfStudy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field of Study</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Computer Science" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Year*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2020" 
                              min="1900"
                              max={new Date().getFullYear()}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="2024" 
                              min="1900"
                              max={new Date().getFullYear() + 10}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade/GPA</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 3.8/4.0 or First Class" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activities & Societies</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Student Council, Debate Team" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about your education..."
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Education"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {educations.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No education added yet</h3>
            <p className="text-slate-600 mb-4">Add your educational background to showcase your academic achievements</p>
          </div>
        ) : (
          <div className="space-y-6">
            {educations.map((edu) => (
              <div key={edu.id} className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-slate-900">{edu.institution}</h3>
                <p className="text-primary font-medium">{edu.degree}{edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {edu.startYear} - {edu.endYear || "Present"}
                  {edu.grade && ` • Grade: ${edu.grade}`}
                </p>
                {edu.activities && (
                  <p className="text-sm text-slate-600 mt-1">Activities: {edu.activities}</p>
                )}
                {edu.description && (
                  <p className="text-sm text-slate-600 mt-2">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Certification Section Component
function CertificationSection({ certifications }: { certifications: Certification[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertCertification>({
    resolver: zodResolver(insertCertificationSchema.omit({ employeeId: true })),
    defaultValues: {
      name: "",
      issuingOrganization: "",
      issueDate: "",
      expirationDate: "",
      credentialId: "",
      credentialUrl: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertCertification, 'employeeId'>) => {
      const response = await fetch("/api/employee/certification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add certification");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certification added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add certification",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertCertification, 'employeeId'>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certifications
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Certification</DialogTitle>
                <DialogDescription>
                  Add your professional certifications and credentials
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certification Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. AWS Certified Solutions Architect" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuingOrganization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Organization*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Amazon Web Services" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date*</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="credentialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ABC123456" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="credentialUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional details about this certification..."
                            rows={3}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Certification"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No certifications added yet</h3>
            <p className="text-slate-600 mb-4">Add your professional certifications to highlight your expertise</p>
          </div>
        ) : (
          <div className="space-y-6">
            {certifications.map((cert) => (
              <div key={cert.id} className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-slate-900">{cert.name}</h3>
                <p className="text-primary font-medium">{cert.issuingOrganization}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Issued: {cert.issueDate}
                  {cert.expirationDate && ` • Expires: ${cert.expirationDate}`}
                </p>
                {cert.credentialId && (
                  <p className="text-sm text-slate-600">Credential ID: {cert.credentialId}</p>
                )}
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1">
                    View Credential <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {cert.description && (
                  <p className="text-sm text-slate-600 mt-2">{cert.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Project Section Component
function ProjectSection({ projects }: { projects: Project[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema.omit({ employeeId: true })),
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      projectUrl: "",
      repositoryUrl: "",
      technologies: [],
      teamSize: undefined,
      role: "",
      achievements: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertProject, 'employeeId'>) => {
      const response = await fetch("/api/employee/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add project");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Project added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add project",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertProject, 'employeeId'>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Projects
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. E-commerce Platform" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what the project is about, its goals, and your contributions..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date*</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""}
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Role</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Full Stack Developer" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Size</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g. 5" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repositoryUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repository URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/..." {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No projects added yet</h3>
            <p className="text-slate-600 mb-4">Showcase your work by adding projects you've completed</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="border-l-4 border-primary pl-4">
                <h3 className="font-semibold text-slate-900">{project.name}</h3>
                {project.role && <p className="text-primary font-medium">{project.role}</p>}
                <p className="text-sm text-slate-600 mt-1">
                  {project.startDate} - {project.endDate || "Present"}
                  {project.teamSize && ` • Team of ${project.teamSize}`}
                </p>
                <p className="text-sm text-slate-600 mt-2">{project.description}</p>
                <div className="flex gap-4 mt-2">
                  {project.projectUrl && (
                    <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" 
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      View Project <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.repositoryUrl && (
                    <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" 
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      View Code <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Endorsement Section Component
function EndorsementSection({ endorsements }: { endorsements: Endorsement[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertEndorsement>({
    resolver: zodResolver(insertEndorsementSchema.omit({ employeeId: true })),
    defaultValues: {
      endorserName: "",
      endorserPosition: "",
      endorserCompany: "",
      relationship: "",
      endorsementText: "",
      endorsementDate: new Date().toISOString().split('T')[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<InsertEndorsement, 'employeeId'>) => {
      const response = await fetch("/api/employee/endorsement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add endorsement");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Endorsement added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add endorsement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertEndorsement, 'employeeId'>) => {
    createMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Endorsements
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Endorsement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Endorsement</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="endorserName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endorser Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Manager, Colleague, Client" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="endorserPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Position</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Senior Developer" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endorserCompany"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Tech Corp" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="endorsementText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endorsement*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write about your experience working with this person..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endorsementDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Adding..." : "Add Endorsement"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {endorsements.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No endorsements added yet</h3>
            <p className="text-slate-600 mb-4">Add testimonials and endorsements from colleagues and clients</p>
          </div>
        ) : (
          <div className="space-y-6">
            {endorsements.map((endorsement) => (
              <div key={endorsement.id} className="border-l-4 border-primary pl-4">
                <div className="mb-2">
                  <h3 className="font-semibold text-slate-900">{endorsement.endorserName}</h3>
                  <p className="text-sm text-slate-600">
                    {endorsement.endorserPosition && `${endorsement.endorserPosition}`}
                    {endorsement.endorserCompany && endorsement.endorserPosition && ` at `}
                    {endorsement.endorserCompany && `${endorsement.endorserCompany}`}
                    {(endorsement.endorserPosition || endorsement.endorserCompany) && ` • `}
                    {endorsement.relationship}
                  </p>
                </div>
                <p className="text-slate-700 italic">"{endorsement.endorsementText}"</p>
                <p className="text-sm text-slate-500 mt-2">
                  {new Date(endorsement.endorsementDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}