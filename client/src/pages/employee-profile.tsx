import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, LogOut, User, Edit, Plus, MapPin, Globe, Briefcase, 
  GraduationCap, Award, Code, MessageSquare, Camera, Trash2,
  Calendar, ExternalLink, Github
} from "lucide-react";
import { EditableEmailSection } from "@/components/EditableEmailSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { 
  type Employee, type Experience, type Education, type Certification, 
  type Project, type Endorsement, insertExperienceSchema, insertEducationSchema,
  insertCertificationSchema, insertProjectSchema, insertEndorsementSchema
} from "@shared/schema";

type ProfileSection = "overview" | "experience" | "education" | "certifications" | "projects" | "endorsements";

export default function EmployeeProfile() {
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
    projects: [],
    endorsements: []
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-slate-800">SecureAuth Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logout.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <nav className="space-y-2">
                  {[
                    { id: "overview", label: "Overview", icon: User },
                    { id: "experience", label: "Experience", icon: Briefcase },
                    { id: "education", label: "Education", icon: GraduationCap },
                    { id: "certifications", label: "Certifications", icon: Award },
                    { id: "projects", label: "Projects", icon: Code },
                    { id: "endorsements", label: "Endorsements", icon: MessageSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={activeSection === item.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection(item.id as ProfileSection)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "overview" && <OverviewSection user={user} />}
            {activeSection === "experience" && <ExperienceSection experiences={profile.experiences} employeeId={user.id} />}
            {activeSection === "education" && <EducationSection educations={profile.educations} employeeId={user.id} />}
            {activeSection === "certifications" && <CertificationSection certifications={profile.certifications} employeeId={user.id} />}
            {activeSection === "projects" && <ProjectSection projects={profile.projects} employeeId={user.id} />}
            {activeSection === "endorsements" && <EndorsementSection endorsements={profile.endorsements} employeeId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({ user }: { user: Employee }) {
  const [editingProfile, setEditingProfile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<Employee>) => {
      return await apiRequest("PATCH", "/api/employee/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile"] });
      setEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
  });

  const profileForm = useForm({
    defaultValues: {
      headline: user.headline || "",
      summary: user.summary || "",
      location: user.location || "",
      website: user.website || "",
      currentPosition: user.currentPosition || "",
      currentCompany: user.currentCompany || "",
      industry: user.industry || "",
      skills: user.skills?.join(", ") || "",
      languages: user.languages?.join(", ") || "",
    },
  });

  const onSubmit = (data: any) => {
    updateProfile.mutate({
      ...data,
      skills: data.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
      languages: data.languages.split(",").map((l: string) => l.trim()).filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={user.profilePhoto || ""} />
                <AvatarFallback className="text-2xl">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-lg text-slate-600 mt-1">
                    {user.headline || "Professional"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setEditingProfile(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {user.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {user.location}
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    <a href={user.website} className="text-primary hover:underline">
                      {user.website}
                    </a>
                  </div>
                )}
                {user.currentCompany && (
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {user.currentPosition} at {user.currentCompany}
                  </div>
                )}
              </div>

              {user.summary && (
                <div className="mt-4">
                  <p className="text-slate-700">{user.summary}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Management */}
      <EditableEmailSection user={user} />

      {/* Skills */}
      {user.skills && user.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {user.languages && user.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.languages.map((language, index) => (
                <Badge key={index} variant="outline">
                  {language}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Headline</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={profileForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Summary</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write a brief summary about yourself..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="currentPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Job Title" {...field} />
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
                        <Input placeholder="Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Healthcare" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="JavaScript, React, Node.js" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="English, Spanish, French" {...field} />
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

// Experience Section Component  
function ExperienceSection({ experiences, employeeId }: { experiences: Experience[], employeeId: string }) {
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [addingExperience, setAddingExperience] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const experienceForm = useForm({
    resolver: zodResolver(insertExperienceSchema),
    defaultValues: {
      employeeId,
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

  const addExperience = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/employee/experience", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", employeeId] });
      setAddingExperience(false);
      experienceForm.reset();
      toast({ title: "Experience Added", description: "Your experience has been added successfully." });
    },
  });

  const onSubmit = (data: any) => {
    addExperience.mutate({
      ...data,
      achievements: data.achievements.split("\n").filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Experience</h2>
        <Button onClick={() => setAddingExperience(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {experiences.map((experience) => (
        <Card key={experience.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{experience.title}</h3>
                <p className="text-slate-600 font-medium">{experience.company}</p>
                {experience.location && (
                  <p className="text-sm text-slate-500">{experience.location}</p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {experience.startDate} - {experience.isCurrent ? "Present" : experience.endDate}
                </p>
                {experience.description && (
                  <p className="text-slate-700 mt-3">{experience.description}</p>
                )}
                {experience.achievements && experience.achievements.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Key Achievements:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {experience.achievements.map((achievement, index) => (
                        <li key={index} className="text-sm text-slate-600">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {experiences.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No experience added yet</h3>
            <p className="text-slate-600 mb-4">Add your work experience to showcase your professional journey.</p>
            <Button onClick={() => setAddingExperience(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Experience
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Experience Dialog */}
      <Dialog open={addingExperience} onOpenChange={setAddingExperience}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Experience</DialogTitle>
          </DialogHeader>
          <Form {...experienceForm}>
            <form onSubmit={experienceForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={experienceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Software Engineer" {...field} />
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
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Company Name" {...field} />
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
                      <Input placeholder="City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={experienceForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
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
                            disabled={experienceForm.watch("isCurrent")}
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
                            disabled={experienceForm.watch("isCurrent")}
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
                control={experienceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your role and responsibilities..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={experienceForm.control}
                name="achievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Achievements (one per line)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="• Led a team of 5 developers&#10;• Increased system performance by 40%&#10;• Implemented new CI/CD pipeline"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAddingExperience(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addExperience.isPending}>
                  {addExperience.isPending ? "Adding..." : "Add Experience"}
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Education</h2>
        <Button onClick={() => setAddingEducation(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>

      {educations.map((education) => (
        <Card key={education.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{education.degree}</h3>
                <p className="text-slate-600 font-medium">{education.institution}</p>
                {education.fieldOfStudy && (
                  <p className="text-sm text-slate-500">{education.fieldOfStudy}</p>
                )}
                {education.category && (
                  <p className="text-sm text-slate-500 capitalize">{education.category}</p>
                )}
                <p className="text-sm text-slate-500 mt-1">
                  {education.startYear} - {education.endYear || "Present"}
                </p>
                {education.grade && (
                  <p className="text-sm text-slate-600 mt-1">Grade: {education.grade}</p>
                )}
                {education.activities && (
                  <p className="text-slate-700 mt-2">Activities: {education.activities}</p>
                )}
                {education.description && (
                  <p className="text-slate-700 mt-2">{education.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {educations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No education added yet</h3>
            <p className="text-slate-600 mb-4">Add your educational background to showcase your qualifications.</p>
            <Button onClick={() => setAddingEducation(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your Education
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Education Dialog */}
      <Dialog open={addingEducation} onOpenChange={setAddingEducation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit((data) => addEducation.mutate(data))} className="space-y-4">
              <FormField
                control={educationForm.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution</FormLabel>
                    <FormControl>
                      <Input placeholder="University/School Name" {...field} />
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
                      <Input placeholder="e.g., Bachelor of Science" {...field} />
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
                      <Input placeholder="e.g., Computer Science" {...field} />
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
                        <SelectTrigger>
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
                      <Input placeholder="e.g., 3.8/4.0, First Class" {...field} />
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
                      <Input placeholder="e.g., Student Council, Debate Club" {...field} />
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAddingEducation(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addEducation.isPending}>
                  {addEducation.isPending ? "Adding..." : "Add Education"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Certification Section Component
function CertificationSection({ certifications, employeeId }: { certifications: Certification[], employeeId: string }) {
  const [addingCertification, setAddingCertification] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Certifications</h2>
        <Button onClick={() => setAddingCertification(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {certifications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No certifications added yet</h3>
            <p className="text-slate-600 mb-4">Add your professional certifications to highlight your expertise.</p>
            <Button onClick={() => setAddingCertification(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Certification
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Project Section Component
function ProjectSection({ projects, employeeId }: { projects: Project[], employeeId: string }) {
  const [addingProject, setAddingProject] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
        <Button onClick={() => setAddingProject(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No projects added yet</h3>
            <p className="text-slate-600 mb-4">Showcase your work by adding projects you've worked on.</p>
            <Button onClick={() => setAddingProject(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Endorsement Section Component
function EndorsementSection({ endorsements, employeeId }: { endorsements: Endorsement[], employeeId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Endorsements</h2>
      </div>

      {endorsements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No endorsements yet</h3>
            <p className="text-slate-600 mb-4">Endorsements from colleagues and clients will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}