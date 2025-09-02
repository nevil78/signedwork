import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const projectSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000, "Description must be less than 2000 characters"),
  category: z.string().min(1, "Please select a category"),
  budgetMin: z.number().min(50, "Minimum budget must be at least $50"),
  budgetMax: z.number().min(50, "Maximum budget must be at least $50"),
  experience_level: z.string().min(1, "Please select an experience level"),
  projectType: z.string().min(1, "Please select a project type"),
  skills: z.array(z.string()).min(1, "Please add at least one skill"),
  timeline: z.string().min(1, "Please select a timeline"),
  attachments: z.array(z.string()).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const categories = [
  { value: "web-development", label: "Web Development" },
  { value: "mobile-development", label: "Mobile Development" },
  { value: "design", label: "Design & Creative" },
  { value: "writing", label: "Writing & Content" },
  { value: "marketing", label: "Marketing & Sales" },
  { value: "data-science", label: "Data Science & Analytics" },
  { value: "other", label: "Other" },
];

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

const projectTypes = [
  { value: "fixed", label: "Fixed Price" },
  { value: "hourly", label: "Hourly Rate" },
];

const timelines = [
  { value: "less-than-1-month", label: "Less than 1 month" },
  { value: "1-3-months", label: "1-3 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "more-than-6-months", label: "More than 6 months" },
];

const commonSkills = [
  "JavaScript", "React", "Node.js", "Python", "TypeScript", "HTML/CSS",
  "Vue.js", "Angular", "PHP", "Laravel", "WordPress", "Shopify",
  "UI/UX Design", "Graphic Design", "Figma", "Adobe Creative Suite",
  "Content Writing", "SEO", "Social Media Marketing", "Google Ads",
  "Data Analysis", "Machine Learning", "SQL", "MongoDB"
];

export default function PostProject() {
  const [, setLocation] = useLocation();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      budgetMin: 500,
      budgetMax: 2000,
      experience_level: "",
      projectType: "",
      skills: [],
      timeline: "",
      attachments: [],
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await fetch("/api/freelance/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: "active",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      toast({
        title: "Project posted successfully!",
        description: "Your project is now live and freelancers can start submitting proposals.",
      });
      setLocation(`/client/projects/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      form.setValue("skills", newSkills);
      setCustomSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    form.setValue("skills", newSkills);
  };

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate({
      ...data,
      skills: selectedSkills,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Post a New Project
          </h1>
          <p className="text-gray-600 mt-1">
            Create a detailed project description to attract the right freelancers
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Provide the essential details about your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Build a responsive e-commerce website"
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormDescription>
                        Write a clear, descriptive title that explains what you need
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
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your project in detail. Include requirements, deliverables, and any specific preferences..."
                          className="min-h-[150px]"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed description to help freelancers understand your needs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
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

                  <FormField
                    control={form.control}
                    name="timeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Timeline</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timeline">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timelines.map((timeline) => (
                              <SelectItem key={timeline.value} value={timeline.value}>
                                {timeline.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Budget and Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Budget and Requirements</CardTitle>
                <CardDescription>Set your budget range and specify requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="budgetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Budget ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="50"
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
                        <FormLabel>Maximum Budget ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="50"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="experience_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level Required</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-experience">
                              <SelectValue placeholder="Select experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {experienceLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-type">
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
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
                <CardTitle>Skills Required</CardTitle>
                <CardDescription>Add the skills needed for this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Common Skills</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {commonSkills.map((skill) => (
                      <Button
                        key={skill}
                        type="button"
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        size="sm"
                        onClick={() => addSkill(skill)}
                        disabled={selectedSkills.includes(skill)}
                        data-testid={`skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Add Custom Skill</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter a skill..."
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(customSkill);
                        }
                      }}
                      data-testid="input-custom-skill"
                    />
                    <Button 
                      type="button" 
                      onClick={() => addSkill(customSkill)}
                      disabled={!customSkill.trim()}
                      data-testid="button-add-skill"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {selectedSkills.length > 0 && (
                  <div className="space-y-3">
                    <Label>Selected Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-sm" data-testid={`selected-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-red-600"
                            data-testid={`remove-skill-${skill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setLocation("/client/projects")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createProjectMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-post-project"
              >
                {createProjectMutation.isPending ? "Posting..." : "Post Project"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}