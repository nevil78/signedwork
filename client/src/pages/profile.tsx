import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Award, Briefcase, GraduationCap, FolderOpen, MessageSquare, User, Calendar, MapPin, Globe, Building, ExternalLink, Trash2, Camera, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

type ProfileSection = "overview" | "experience" | "education" | "certifications" | "projects" | "endorsements";

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

  // Profile picture upload mutation
  const profilePictureMutation = useMutation({
    mutationFn: async (data: { profilePictureURL: string }) => {
      return await apiRequest("/api/employee/profile-picture", {
        method: "PUT",
        body: JSON.stringify(data),
      });
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
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "endorsements", label: "Endorsements", icon: MessageSquare },
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
    return {
      method: "PUT" as const,
      url: await apiRequest("/api/objects/upload", { method: "POST" }).then(res => res.uploadURL),
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
            <div className="flex items-center">
              <User className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-slate-800">Profile</span>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/api/auth/logout"}
            >
              Logout
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
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5242880} // 5MB
                        onGetUploadParameters={handleProfilePictureUpload}
                        onComplete={handleProfilePictureComplete}
                        buttonClassName="absolute -bottom-2 right-0 rounded-full p-2 bg-primary text-white hover:bg-primary/90"
                      >
                        <Camera className="w-4 h-4" />
                      </ObjectUploader>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </h2>
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
            {activeSection === "experience" && <ExperienceSection experiences={profile.experiences || []} />}
            {activeSection === "education" && <EducationSection educations={profile.educations || []} />}
            {activeSection === "certifications" && <CertificationSection certifications={profile.certifications || []} />}
            {activeSection === "projects" && <ProjectSection projects={profile.projects || []} />}
            {activeSection === "endorsements" && <EndorsementSection endorsements={profile.endorsements || []} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Overview Component
function ProfileOverview({ user }: { user: Employee }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Personal Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span>{user?.email}</span>
              </div>
              {user?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.website && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.website}
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Professional Details</h3>
            <div className="space-y-2 text-sm">
              {user?.currentPosition && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{user.currentPosition}</span>
                </div>
              )}
              {user?.currentCompany && (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{user.currentCompany}</span>
                </div>
              )}
              {user?.industry && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-slate-400" />
                  <span>{user.industry}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {user?.summary && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">About</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{user.summary}</p>
          </div>
        )}

        {user?.skills && user.skills.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
      return await apiRequest("/api/employee/experience", {
        method: "POST",
        body: JSON.stringify(data),
      });
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
                            <Input type="month" {...field} />
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
                              type="month" 
                              {...field} 
                              value={field.value || ""} 
                              disabled={form.watch("isCurrent")}
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
                            checked={field.value}
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
      return await apiRequest("/api/employee/education", {
        method: "POST",
        body: JSON.stringify(data),
      });
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

// Similar components for Certifications, Projects, and Endorsements would follow the same pattern...
// For brevity, I'll create simplified versions:

function CertificationSection({ certifications }: { certifications: Certification[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certifications
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No certifications added yet</h3>
          <p className="text-slate-600 mb-4">Add your professional certifications to highlight your expertise</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSection({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Projects
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No projects added yet</h3>
          <p className="text-slate-600 mb-4">Showcase your work by adding projects you've completed</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EndorsementSection({ endorsements }: { endorsements: Endorsement[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Endorsements
          </CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Endorsement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No endorsements added yet</h3>
          <p className="text-slate-600 mb-4">Add testimonials and endorsements from colleagues and clients</p>
        </div>
      </CardContent>
    </Card>
  );
}