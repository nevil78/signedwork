import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft,
  Plus,
  X,
  Shield,
  Award,
  DollarSign,
  Clock,
  Users,
  FileText,
  AlertCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ClientNavHeader from "@/components/client-nav-header";

const projectSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(5000, "Description must be less than 5000 characters"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  projectType: z.enum(["fixed_price", "hourly"]),
  budgetMin: z.number().min(10, "Minimum budget must be at least $10"),
  budgetMax: z.number().min(10, "Maximum budget must be at least $10"),
  hourlyRateMin: z.number().optional(),
  hourlyRateMax: z.number().optional(),
  estimatedDuration: z.string().min(1, "Please select estimated duration"),
  experienceLevel: z.enum(["entry", "intermediate", "expert"]),
  skillsRequired: z.array(z.string()).min(1, "Please add at least one required skill"),
  projectScope: z.string().min(1, "Please select project scope"),
  attachments: z.array(z.string()).optional(),
  requiresVerifiedWork: z.boolean().default(true),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string(),
    amount: z.number(),
    dueDate: z.string()
  })).optional()
});

type ProjectFormData = z.infer<typeof projectSchema>;

const categories = [
  { value: "web_development", label: "Web Development", subcategories: ["Frontend", "Backend", "Full Stack", "WordPress", "E-commerce"] },
  { value: "mobile_development", label: "Mobile Development", subcategories: ["iOS", "Android", "React Native", "Flutter", "Hybrid Apps"] },
  { value: "design_creative", label: "Design & Creative", subcategories: ["UI/UX Design", "Graphic Design", "Logo Design", "Branding", "Illustration"] },
  { value: "writing_translation", label: "Writing & Translation", subcategories: ["Content Writing", "Copywriting", "Technical Writing", "Translation", "Editing"] },
  { value: "digital_marketing", label: "Digital Marketing", subcategories: ["SEO", "Social Media", "PPC", "Email Marketing", "Content Marketing"] },
  { value: "video_animation", label: "Video & Animation", subcategories: ["Video Editing", "Motion Graphics", "3D Animation", "Explainer Videos", "Live Action"] },
  { value: "music_audio", label: "Music & Audio", subcategories: ["Voice Over", "Music Production", "Audio Editing", "Sound Design", "Podcast Production"] },
  { value: "business", label: "Business", subcategories: ["Virtual Assistant", "Data Entry", "Market Research", "Business Plans", "Financial Modeling"] },
  { value: "data", label: "Data", subcategories: ["Data Analysis", "Data Visualization", "Machine Learning", "Data Mining", "Database Development"] }
];

const commonSkills = [
  "JavaScript", "React", "Node.js", "Python", "PHP", "WordPress", "UI/UX Design", "Graphic Design",
  "Content Writing", "SEO", "Social Media Marketing", "Video Editing", "Data Analysis", "Excel",
  "Photoshop", "Illustrator", "Figma", "HTML", "CSS", "TypeScript", "Vue.js", "Angular", "Laravel"
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const [currentSkill, setCurrentSkill] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectType: "fixed_price",
      experienceLevel: "intermediate",
      skillsRequired: [],
      requiresVerifiedWork: true,
      budgetMin: 100,
      budgetMax: 1000
    }
  });

  const projectType = form.watch("projectType");
  const skillsRequired = form.watch("skillsRequired");

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      return apiRequest("POST", "/api/client/projects", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      toast({ title: "Project posted successfully!" });
      setLocation(`/client/projects/${data.id}`);
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to post project", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const addSkill = (skill: string) => {
    if (skill && !skillsRequired.includes(skill)) {
      form.setValue("skillsRequired", [...skillsRequired, skill]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    form.setValue("skillsRequired", skillsRequired.filter(s => s !== skill));
  };

  const selectedCategoryData = categories.find(cat => cat.value === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavHeader />
      
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/client/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
              Post a New Job
            </h1>
            <p className="text-gray-600 mt-1">
              Find the perfect freelancer for your project with verified work history
            </p>
          </div>
        </div>

        {/* Signedwork Advantage Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Signedwork Advantage: Verified Work Portfolios
                </h3>
                <p className="text-sm text-gray-700">
                  All applicants will showcase authenticated, fraud-proof work history with multi-level verification ⭐
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Details
                </CardTitle>
                <CardDescription>
                  Provide clear details about your project to attract the right talent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Build a React.js E-commerce Website"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormDescription>
                        Write a clear, descriptive title that explains what you need done
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your project in detail. Include requirements, deliverables, and any specific preferences..."
                          className="min-h-[150px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide comprehensive details to help freelancers understand your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategory(value);
                          }}
                          defaultValue={field.value}
                          data-testid="select-category"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCategoryData && (
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCategoryData.subcategories.map((sub) => (
                                <SelectItem key={sub} value={sub}>
                                  {sub}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Type and Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget & Timeline
                </CardTitle>
                <CardDescription>
                  Set your budget and project timeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Project Type *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fixed_price" id="fixed_price" />
                            <Label htmlFor="fixed_price">Fixed Price Project</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hourly" id="hourly" />
                            <Label htmlFor="hourly">Hourly Project</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {projectType === "fixed_price" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Budget ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="100"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-budget-min"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Budget ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="1000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-budget-max"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="hourlyRateMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Hourly Rate ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="15"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hourlyRateMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Hourly Rate ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="50"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Duration *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="less_than_week">Less than 1 week</SelectItem>
                            <SelectItem value="1_2_weeks">1-2 weeks</SelectItem>
                            <SelectItem value="2_4_weeks">2-4 weeks</SelectItem>
                            <SelectItem value="1_3_months">1-3 months</SelectItem>
                            <SelectItem value="3_6_months">3-6 months</SelectItem>
                            <SelectItem value="more_than_6_months">More than 6 months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entry">Entry Level</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills Required */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Skills & Requirements
                </CardTitle>
                <CardDescription>
                  Specify the skills and qualifications you're looking for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="skillsRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Skills *</FormLabel>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a skill..."
                            value={currentSkill}
                            onChange={(e) => setCurrentSkill(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkill(currentSkill);
                              }
                            }}
                            data-testid="input-skill"
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => addSkill(currentSkill)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Common Skills */}
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Popular skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {commonSkills.slice(0, 12).map((skill) => (
                              <Badge 
                                key={skill}
                                variant="outline" 
                                className="cursor-pointer hover:bg-blue-50"
                                onClick={() => addSkill(skill)}
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Selected Skills */}
                        {skillsRequired.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Selected skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {skillsRequired.map((skill) => (
                                <Badge key={skill} className="bg-blue-600 text-white">
                                  {skill}
                                  <X 
                                    className="w-3 h-3 ml-1 cursor-pointer"
                                    onClick={() => removeSkill(skill)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="projectScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Scope *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project scope" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small project (&lt; 30 hours)</SelectItem>
                          <SelectItem value="medium">Medium project (30-100 hours)</SelectItem>
                          <SelectItem value="large">Large project (&gt; 100 hours)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresVerifiedWork"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-green-200 bg-green-50 p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-verified-work"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2 text-green-800">
                          <Award className="w-4 h-4" />
                          Require Verified Work Portfolio (Recommended)
                        </FormLabel>
                        <FormDescription className="text-green-700">
                          Only accept proposals from freelancers with authenticated, fraud-proof work history. 
                          This is Signedwork's exclusive advantage over other platforms.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between">
              <Link href="/client/projects">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  type="button"
                  disabled={createProjectMutation.isPending}
                >
                  Save as Draft
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={createProjectMutation.isPending}
                  data-testid="button-post-project"
                >
                  {createProjectMutation.isPending ? "Posting..." : "Post Project"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}