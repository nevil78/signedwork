import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import EmployeeNavHeader from "@/components/employee-nav-header";
import { EditableEmailSection } from "@/components/EditableEmailSection";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Github,
  Linkedin,
  Twitter,
  TrendingUp,
  Camera,
  Edit,
  Plus,
  Trophy,
  Clock,
  DollarSign,
  Target,
  BarChart3,
  Eye,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import {
  type Employee,
  type Experience,
  type Education,
  type Certification,
  insertExperienceSchema,
  insertEducationSchema,
  insertCertificationSchema,
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

type ProfileSection = "overview" | "skills" | "experience" | "education" | "certifications" | "analytics";

// Skills Section Component
function SkillsSection({ skills, employeeId }: { skills: string[]; employeeId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillToDelete, setSkillToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update skills mutation
  const updateSkills = useMutation({
    mutationFn: async (updatedSkills: string[]) => {
      return await apiRequest("PATCH", "/api/employee/profile", { skills: updatedSkills });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ 
        title: "Skills Updated", 
        description: "Your skills have been updated successfully." 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update skills. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddSkill = () => {
    if (!newSkill.trim()) {
      toast({
        title: "Invalid Skill",
        description: "Please enter a valid skill name.",
        variant: "destructive",
      });
      return;
    }

    if (skills.includes(newSkill.trim())) {
      toast({
        title: "Duplicate Skill",
        description: "This skill already exists in your profile.",
        variant: "destructive",
      });
      return;
    }

    const updatedSkills = [...skills, newSkill.trim()];
    updateSkills.mutate(updatedSkills);
    setNewSkill("");
  };

  const handleDeleteSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    updateSkills.mutate(updatedSkills);
    setSkillToDelete(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSkill();
    }
  };

  // Predefined skill suggestions (common tech skills)
  const skillSuggestions = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "HTML", "CSS",
    "Git", "Docker", "AWS", "MongoDB", "PostgreSQL", "MySQL", "Express.js", "Next.js",
    "Vue.js", "Angular", "PHP", "Laravel", "Django", "Flask", "Spring Boot", "GraphQL",
    "REST APIs", "Microservices", "Agile", "Scrum", "Project Management", "Leadership",
    "Team Management", "Problem Solving", "Communication", "Analytics", "Data Analysis"
  ];

  const availableSuggestions = skillSuggestions.filter(
    suggestion => !skills.some(skill => skill.toLowerCase() === suggestion.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Skills & Expertise
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Showcase your technical and professional skills
          </p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          size="sm"
          variant={isEditing ? "destructive" : "outline"}
          data-testid="button-toggle-skills-edit"
        >
          {isEditing ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Done
            </>
          ) : (
            <>
              {skills.length === 0 ? (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Skill
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Skills
                </>
              )}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {skills.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Current Skills ({skills.length})</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium ${
                      isEditing ? 'border border-blue-200' : ''
                    }`}
                    data-testid={`skill-${index}`}
                  >
                    <Target className="h-3 w-3" />
                    {skill}
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600 ml-1"
                        onClick={() => setSkillToDelete(skill)}
                        data-testid={`button-remove-skill-${index}`}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors border border-dashed border-gray-300 hover:border-blue-300"
                    data-testid="button-add-more-skills"
                  >
                    <Plus className="h-3 w-3" />
                    Add More Skills
                  </button>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Skill</h4>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter a skill (e.g., React, Project Management)"
                    className="flex-1"
                    data-testid="input-new-skill"
                  />
                  <Button 
                    onClick={handleAddSkill}
                    disabled={updateSkills.isPending || !newSkill.trim()}
                    data-testid="button-add-skill"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {availableSuggestions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Popular Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {availableSuggestions.slice(0, 15).map((suggestion, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 bg-gray-50 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => {
                            const updatedSkills = [...skills, suggestion];
                            updateSkills.mutate(updatedSkills);
                          }}
                          data-testid={`button-add-suggested-skill-${index}`}
                        >
                          + {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No skills added yet</h3>
            <p className="text-gray-600 mb-4">Add your technical and professional skills to showcase your expertise</p>
            <div className="flex gap-2 justify-center">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your first skill"
                className="max-w-xs"
                data-testid="input-first-skill"
              />
              <Button 
                onClick={handleAddSkill}
                disabled={updateSkills.isPending || !newSkill.trim()}
                data-testid="button-add-first-skill"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>
            
            {skillSuggestions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Popular Skills to Get Started</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {skillSuggestions.slice(0, 12).map((suggestion, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => {
                        const updatedSkills = [...skills, suggestion];
                        updateSkills.mutate(updatedSkills);
                      }}
                      data-testid={`button-add-popular-skill-${index}`}
                    >
                      + {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete confirmation dialog */}
        <Dialog open={!!skillToDelete} onOpenChange={() => setSkillToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Skill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to remove <strong>"{skillToDelete}"</strong> from your skills?
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSkillToDelete(null)}
                  data-testid="button-cancel-skill-delete"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => skillToDelete && handleDeleteSkill(skillToDelete)}
                  disabled={updateSkills.isPending}
                  data-testid="button-confirm-skill-delete"
                >
                  {updateSkills.isPending ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// Education Section Component
function EducationSection({ educations, employeeId }: { educations: any[]; employeeId: string }) {
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
                    {education.description && (
                      <p className="text-sm text-gray-600 mt-2">{education.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No education added yet</h3>
            <p className="text-gray-600 mb-4">Add your educational background</p>
            <Button onClick={() => setAddingEducation(true)} data-testid="button-add-first-education">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Education
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={addingEducation} onOpenChange={setAddingEducation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Education</DialogTitle>
          </DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit((data) => addEducation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={educationForm.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Institution *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Harvard University" data-testid="input-institution" />
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
                      <FormLabel>Degree *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Bachelor of Science" data-testid="input-degree" />
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
                        <Input {...field} placeholder="e.g., Computer Science" data-testid="input-field-of-study" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationForm.control}
                  name="startYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Year *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
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
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          placeholder="Leave blank if current"
                          data-testid="input-end-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationForm.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade/GPA</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 3.8/4.0 or First Class Honours" data-testid="input-grade" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-education-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high-school">High School</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                          <SelectItem value="doctorate">Doctorate</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
                          <SelectItem value="bootcamp">Bootcamp</SelectItem>
                          <SelectItem value="online-course">Online Course</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={educationForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your studies, achievements, or relevant coursework..."
                          rows={3}
                          data-testid="textarea-education-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setAddingEducation(false)} data-testid="button-cancel-education">
                  Cancel
                </Button>
                <Button type="submit" disabled={addEducation.isPending} data-testid="button-submit-education">
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
function CertificationSection({ certifications, employeeId }: { certifications: any[]; employeeId: string }) {
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
            <Award className="h-5 w-5 text-purple-600" />
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
            {certifications.map((cert) => (
              <div key={cert.id} className="border-l-2 border-purple-200 pl-4 py-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                    <p className="text-gray-700 font-medium">{cert.issuingOrganization}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Issued: {cert.issueDate} 
                      {cert.expirationDate && ` • Expires: ${cert.expirationDate}`}
                    </p>
                    {cert.credentialId && (
                      <p className="text-sm text-gray-600 mt-1">ID: {cert.credentialId}</p>
                    )}
                    {cert.description && (
                      <p className="text-sm text-gray-600 mt-2">{cert.description}</p>
                    )}
                    {cert.credentialUrl && (
                      <a 
                        href={cert.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-flex items-center"
                      >
                        View Credential <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications added yet</h3>
            <p className="text-gray-600 mb-4">Showcase your professional certifications</p>
            <Button onClick={() => setAddingCertification(true)} data-testid="button-add-first-certification">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Certification
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={addingCertification} onOpenChange={setAddingCertification}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <Form {...certificationForm}>
            <form onSubmit={certificationForm.handleSubmit((data) => addCertification.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={certificationForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Certification Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., AWS Certified Solutions Architect" data-testid="input-certification-name" />
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
                      <FormLabel>Issuing Organization *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Amazon Web Services" data-testid="input-issuing-organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={certificationForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date *</FormLabel>
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
                      <FormLabel>Expiration Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-expiration-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={certificationForm.control}
                  name="credentialId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credential ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., AWS-ASA-12345" data-testid="input-credential-id" />
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
                      <FormLabel>Credential URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          {...field} 
                          placeholder="https://..." 
                          data-testid="input-credential-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={certificationForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Additional details about this certification..."
                          rows={3}
                          data-testid="textarea-certification-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

export default function ProfessionalProfile() {
  const [activeSection, setActiveSection] = useState<ProfileSection>("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [addingExperience, setAddingExperience] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
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

  const phoneForm = useForm({
    resolver: zodResolver(z.object({
      phone: z.string().optional(),
    })),
    defaultValues: {
      phone: "",
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

  // Update forms when user data changes
  useEffect(() => {
    const user = userResponse?.user;
    if (user && editingProfile) {
      profileForm.reset({
        headline: user.headline || "",
        summary: user.summary || "",
        currentPosition: user.currentPosition || "",
        currentCompany: user.currentCompany || "",
        industry: user.industry || "",
        experienceLevel: (user.experienceLevel as any) || "mid",
        salaryExpectation: user.salaryExpectation || "",
        availabilityStatus: (user.availabilityStatus as any) || "open",
        noticePeriod: (user.noticePeriod as any) || "1_month",
        preferredWorkType: (user.preferredWorkType as any) || "hybrid",
        location: user.location || "",
        website: user.website || "",
        skills: (user.skills as string[]) || [],
        specializations: (user.specializations as string[]) || [],
        languages: (user.languages as string[]) || [],
      });
    }
  }, [userResponse?.user, editingProfile, profileForm]);

  useEffect(() => {
    const user = userResponse?.user;
    if (user && editingPhone) {
      phoneForm.reset({
        phone: user.phone || "",
      });
    }
  }, [userResponse?.user, editingPhone, phoneForm]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PATCH", "/api/employee/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", userResponse?.user?.id] });
      setEditingProfile(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const updateProfilePicture = useMutation({
    mutationFn: async (profilePhotoURL: string) => {
      return await apiRequest("PATCH", "/api/employee/profile", { profilePhotoURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile picture updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile picture", variant: "destructive" });
    },
  });

  const updatePhone = useMutation({
    mutationFn: async (phone: string) => {
      return await apiRequest("PATCH", "/api/employee/profile", { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/profile", userResponse?.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingPhone(false);
      phoneForm.reset();
      toast({ title: "Phone number updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update phone number", variant: "destructive" });
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
                  <h2 className="text-xl font-bold text-gray-900 mt-4">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600 text-sm">{user.employeeId}</p>
                  {user.headline && (
                    <p className="text-gray-700 mt-2 text-sm font-medium">{user.headline}</p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700 flex-1">{user.email}</span>
                    {user.emailVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 flex-1">{user.phone}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingPhone(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {user.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{user.location}</span>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Profile Insights</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Profile Views</span>
                      <span className="font-medium">{analytics?.profileViews || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completion</span>
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Section */}
              <TabsContent value="overview" className="space-y-6">
                <EditableEmailSection user={user} />
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Professional Summary</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingProfile(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {user.summary ? (
                      <p className="text-gray-700 leading-relaxed">{user.summary}</p>
                    ) : (
                      <p className="text-gray-500 italic">Add a professional summary to tell your story</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user.currentPosition && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Current Position</span>
                          <p className="text-gray-900">{user.currentPosition}</p>
                        </div>
                      )}
                      
                      {user.currentCompany && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Current Company</span>
                          <p className="text-gray-900">{user.currentCompany}</p>
                        </div>
                      )}
                      
                      {user.experienceLevel && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Experience Level</span>
                          <Badge className={getExperienceLevelColor(user.experienceLevel)}>
                            {user.experienceLevel.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                      
                      {user.availabilityStatus && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Availability</span>
                          <Badge className={getAvailabilityColor(user.availabilityStatus)}>
                            {user.availabilityStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {user.skills && user.skills.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {(user.skills as string[]).map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Section */}
              <TabsContent value="skills" className="space-y-6">
                <SkillsSection skills={user.skills || []} employeeId={user.id} />
              </TabsContent>

              {/* Experience Section */}
              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Work Experience</CardTitle>
                    <Button 
                      onClick={() => setAddingExperience(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {profile.experiences.length > 0 ? (
                      <div className="space-y-6">
                        {profile.experiences.map((exp) => (
                          <div key={exp.id} className="border-l-2 border-blue-200 pl-4 py-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                                <p className="text-gray-700 font-medium">{exp.company}</p>
                                {exp.location && (
                                  <p className="text-sm text-gray-600">{exp.location}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-1">
                                  {exp.startDate} - {exp.endDate || "Present"}
                                </p>
                                {exp.description && (
                                  <p className="text-gray-600 mt-2">{exp.description}</p>
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
                                    achievements: (exp.achievements as string[]) || [],
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
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Overall Completion</span>
                        <span className="font-medium">{analytics?.profileScore || 0}%</span>
                      </div>
                      <Progress value={analytics?.profileScore || 0} className="w-full" />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Experience</span>
                          <span className={profile.experiences?.length > 0 ? "text-green-600" : "text-red-600"}>
                            {profile.experiences?.length > 0 ? "Complete" : "Missing"}
                          </span>
                        </div>
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
                        <Input {...field} placeholder="e.g., Tech Corp" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Professional Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4} 
                          placeholder="Tell your professional story..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingExperience ? "Edit Experience" : "Add Experience"}</DialogTitle>
          </DialogHeader>
          <Form {...experienceForm}>
            <form onSubmit={experienceForm.handleSubmit((data) => {
              if (editingExperience) {
                updateExperience.mutate({ id: editingExperience.id, data });
              } else {
                createExperience.mutate(data);
              }
            })} className="space-y-4">
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
                        <Input type="month" {...field} />
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
                        <Input type="month" {...field} disabled={experienceForm.watch("current")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={experienceForm.control}
                  name="current"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value} 
                          onChange={field.onChange}
                          className="rounded"
                        />
                      </FormControl>
                      <FormLabel>Currently working here</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={experienceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          rows={4} 
                          placeholder="Describe your role and responsibilities..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

      {/* Edit Phone Dialog */}
      <Dialog open={editingPhone} onOpenChange={setEditingPhone}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Phone Number</DialogTitle>
          </DialogHeader>
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit((data: any) => {
              updatePhone.mutate(data.phone);
            })} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., +1 (555) 123-4567"
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingPhone(false)}
                  data-testid="button-cancel-phone"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatePhone.isPending}
                  data-testid="button-save-phone"
                >
                  {updatePhone.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}