import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  MessageSquare, Bug, Lightbulb, MessageCircle, ThumbsDown, Heart,
  Monitor, Zap, Settings, FileText, Shield, HelpCircle,
  Star, CheckCircle, Send, ArrowLeft
} from "lucide-react";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { useToast } from "@/hooks/use-toast";

const feedbackSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long"),
  userEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  feedbackType: z.enum(["bug_report", "feature_request", "general", "complaint", "compliment"]),
  category: z.enum(["ui_ux", "performance", "functionality", "content", "security", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  rating: z.number().min(1).max(5).optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

const feedbackTypes = [
  { value: "bug_report", label: "Bug Report", icon: Bug, color: "bg-red-100 text-red-700 border-red-200" },
  { value: "feature_request", label: "Feature Request", icon: Lightbulb, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "general", label: "General Feedback", icon: MessageCircle, color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "complaint", label: "Complaint", icon: ThumbsDown, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "compliment", label: "Compliment", icon: Heart, color: "bg-green-100 text-green-700 border-green-200" },
];

const categories = [
  { value: "ui_ux", label: "User Interface & Experience", icon: Monitor },
  { value: "performance", label: "Performance & Speed", icon: Zap },
  { value: "functionality", label: "Features & Functionality", icon: Settings },
  { value: "content", label: "Content & Information", icon: FileText },
  { value: "security", label: "Security & Privacy", icon: Shield },
  { value: "other", label: "Other", icon: HelpCircle },
];

const priorities = [
  { value: "low", label: "Low - Minor issue", color: "text-green-600" },
  { value: "medium", label: "Medium - Normal priority", color: "text-yellow-600" },
  { value: "high", label: "High - Important", color: "text-orange-600" },
  { value: "urgent", label: "Urgent - Critical issue", color: "text-red-600" },
];

export default function FeedbackPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [showRating, setShowRating] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      title: "",
      description: "",
      userEmail: "",
      feedbackType: undefined,
      category: undefined,
      priority: "medium",
      rating: undefined,
    },
  });

  const submitMutation = useMutation({
    mutationFn: (data: FeedbackForm) => {
      // Get current page URL for context
      const pageUrl = window.location.href;
      return apiRequest("POST", "/api/feedback", { ...data, pageUrl });
    },
    onSuccess: (response) => {
      setSubmitSuccess(true);
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. We'll review it and get back to you if needed.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackForm) => {
    submitMutation.mutate(data);
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    form.setValue("feedbackType", type as any);
    setShowRating(type === "general" || type === "compliment");
    setStep(2);
  };

  const renderStars = (rating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`text-2xl ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400 transition-colors`}
            data-testid={`star-${star}`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
    );
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h1>
              <p className="text-gray-600 mb-6">
                Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    setSubmitSuccess(false);
                    setStep(1);
                    setSelectedType("");
                  }}
                  variant="outline"
                  data-testid="button-submit-more"
                >
                  Submit More Feedback
                </Button>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // First try to go back in history, if no history then go to dashboard
                      if (window.history.length > 1) {
                        window.history.back();
                      } else {
                        setLocation('/');
                      }
                    }}
                    className="flex items-center font-medium"
                    data-testid="button-go-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    ← Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
              <span className="text-xl font-bold text-slate-800">Signedwork Feedback</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button Header - More Prominent */}
          <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border">
            <Button
              variant="outline"
              onClick={() => {
                // First try to go back in history, if no history then go to dashboard
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  setLocation('/');
                }
              }}
              className="flex items-center text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-gray-300 font-medium"
              data-testid="button-back-to-previous"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              ← Back to Dashboard
            </Button>
          </div>

          <div className="text-center mb-8">
            <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Feedback</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Help us improve by sharing your thoughts, reporting issues, or suggesting new features. 
              Your feedback drives our development priorities.
            </p>
          </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What type of feedback would you like to share?</CardTitle>
              <CardDescription>
                Choose the category that best describes your feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbackTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleTypeSelect(type.value)}
                      className={`p-6 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-md ${type.color}`}
                      data-testid={`feedback-type-${type.value}`}
                    >
                      <div className="flex flex-col items-center text-center space-y-3">
                        <IconComponent className="h-8 w-8" />
                        <h3 className="font-semibold">{type.label}</h3>
                        <p className="text-sm opacity-80">
                          {type.value === "bug_report" && "Report issues or problems you've encountered"}
                          {type.value === "feature_request" && "Suggest new features or improvements"}
                          {type.value === "general" && "Share general thoughts or suggestions"}
                          {type.value === "complaint" && "Report dissatisfaction or problems"}
                          {type.value === "compliment" && "Share positive feedback or praise"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Feedback Details</CardTitle>
                      <CardDescription>
                        Provide detailed information about your feedback
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {feedbackTypes.find(t => t.value === selectedType)?.label}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setStep(1)}
                        data-testid="button-change-type"
                      >
                        Change Type
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Brief summary of your feedback"
                            {...field}
                            data-testid="input-title"
                          />
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
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide detailed information about your feedback..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => {
                                const IconComponent = category.icon;
                                return (
                                  <SelectItem key={category.value} value={category.value}>
                                    <div className="flex items-center space-x-2">
                                      <IconComponent className="h-4 w-4" />
                                      <span>{category.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedType === "bug_report" && (
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-priority">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {priorities.map((priority) => (
                                  <SelectItem key={priority.value} value={priority.value}>
                                    <span className={priority.color}>{priority.label}</span>
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

                  {showRating && (
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Your Experience (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              {renderStars(field.value || 0, field.onChange)}
                              <span className="text-sm text-gray-500 ml-4">
                                {field.value ? `${field.value} out of 5 stars` : "No rating"}
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="userEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your.email@example.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          Provide your email if you'd like a response to your feedback
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-feedback"
                >
                  {submitMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
        </div>
      </div>
    </div>
  );
}