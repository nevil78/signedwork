import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Play, 
  Users, 
  Building, 
  UserCheck,
  ChevronRight,
  Clock,
  Star
} from 'lucide-react';

interface HelpDeskProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'employee' | 'company' | 'manager';
  onStartTour: (tourId: string) => void;
}

export default function HelpDesk({ isOpen, onClose, userType, onStartTour }: HelpDeskProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('getting-started');

  // Documentation content based on user type
  const getDocumentationSections = () => {
    const commonSections = {
      'getting-started': {
        title: 'Getting Started',
        icon: <Play className="h-4 w-4" />,
        description: 'Essential first steps'
      },
      'core-features': {
        title: 'Core Features', 
        icon: <BookOpen className="h-4 w-4" />,
        description: 'Main platform capabilities'
      },
      'troubleshooting': {
        title: 'Troubleshooting',
        icon: <HelpCircle className="h-4 w-4" />,
        description: 'Common issues and solutions'
      }
    };

    const typeSpecificSections = {
      employee: {
        'profile-setup': {
          title: 'Profile Setup',
          icon: <UserCheck className="h-4 w-4" />,
          description: 'Complete your professional profile'
        },
        'work-diary': {
          title: 'Work Diary',
          icon: <Clock className="h-4 w-4" />,
          description: 'Track and verify your work'
        }
      },
      company: {
        'company-setup': {
          title: 'Company Setup',
          icon: <Building className="h-4 w-4" />,
          description: 'Configure your organization'
        },
        'employee-management': {
          title: 'Employee Management', 
          icon: <Users className="h-4 w-4" />,
          description: 'Manage your workforce'
        }
      },
      manager: {
        'verification-process': {
          title: 'Verification Process',
          icon: <UserCheck className="h-4 w-4" />,
          description: 'How to verify employee work'
        },
        'team-management': {
          title: 'Team Management',
          icon: <Users className="h-4 w-4" />,
          description: 'Manage your team effectively'
        }
      }
    };

    return { ...commonSections, ...typeSpecificSections[userType] };
  };

  const getQuickStartTours = () => {
    const baseTours = [
      {
        id: 'platform-overview',
        title: 'Platform Overview',
        description: 'Get familiar with the main navigation and layout',
        duration: '3 min',
        difficulty: 'Beginner'
      }
    ];

    const typeSpecificTours = {
      employee: [
        {
          id: 'employee-profile-setup',
          title: 'Complete Your Profile',
          description: 'Set up your professional profile and CV details',
          duration: '5 min',
          difficulty: 'Beginner'
        },
        {
          id: 'employee-work-tracking',
          title: 'Track Your Work',
          description: 'Learn how to log and get work verified',
          duration: '7 min', 
          difficulty: 'Beginner'
        },
        {
          id: 'employee-job-discovery',
          title: 'Discover Opportunities',
          description: 'Use the job discovery and application features',
          duration: '4 min',
          difficulty: 'Intermediate'
        }
      ],
      company: [
        {
          id: 'company-initial-setup',
          title: 'Company Registration',
          description: 'Complete your company profile and settings',
          duration: '8 min',
          difficulty: 'Beginner'
        },
        {
          id: 'company-hierarchy-setup',
          title: 'Organizational Structure',
          description: 'Set up branches, teams, and management hierarchy',
          duration: '10 min',
          difficulty: 'Intermediate'
        },
        {
          id: 'company-employee-onboarding',
          title: 'Employee Onboarding',
          description: 'Invite and manage employees on the platform',
          duration: '6 min',
          difficulty: 'Beginner'
        }
      ],
      manager: [
        {
          id: 'manager-verification-workflow',
          title: 'Work Verification',
          description: 'Learn how to review and verify employee work entries',
          duration: '5 min',
          difficulty: 'Beginner'
        },
        {
          id: 'manager-team-oversight',
          title: 'Team Management',
          description: 'Monitor team performance and work quality',
          duration: '7 min',
          difficulty: 'Intermediate'
        }
      ]
    };

    return [...baseTours, ...typeSpecificTours[userType]];
  };

  const getFAQs = () => {
    const baseFAQs = [
      {
        question: "What is Signedwork?",
        answer: "Signedwork is a professional networking platform that focuses on verified work credibility. Unlike traditional platforms, all work achievements must be verified by actual managers or companies, creating authentic professional histories."
      },
      {
        question: "How does work verification work?",
        answer: "When you log work in your diary, it gets sent to your manager or designated verifier at your company. They review the work details and approve or request changes. Only verified work appears in your professional profile."
      },
      {
        question: "Is my work information private?",
        answer: "Yes, you have full control over what information is shared. Internal work details remain private to your company, while verified achievements can be safely shared without exposing sensitive information."
      }
    ];

    const typeSpecificFAQs = {
      employee: [
        {
          question: "How do I get my work verified?",
          answer: "After logging work in your diary, click 'Request Verification' and select your manager. They'll receive a notification to review and verify your work entry."
        },
        {
          question: "Can I edit verified work entries?",
          answer: "Verified work entries become immutable for credibility. However, you can add comments or request your manager to update details if needed."
        },
        {
          question: "How do I build my professional profile?",
          answer: "Complete all sections: personal info, experience, education, skills, and certifications. The more complete your profile, the better your job discovery matches."
        }
      ],
      company: [
        {
          question: "How do I invite employees to join?",
          answer: "Go to Company Employees section and use 'Invite Employee' button. You can send invitations via email with your company's invitation code."
        },
        {
          question: "How do I set up my company hierarchy?",
          answer: "Navigate to Company Hierarchy and create branches and teams. Assign managers to each level who can verify work for their team members."
        },
        {
          question: "Can I control what information employees share?",
          answer: "Yes, you can set company-wide sharing policies and approve what types of work information can be shared externally."
        }
      ],
      manager: [
        {
          question: "How do I verify employee work?",
          answer: "Go to Work Verification section to see pending requests. Review the work details, add feedback if needed, and approve or request changes."
        },
        {
          question: "What should I look for when verifying work?",
          answer: "Verify accuracy of work description, time spent, skills used, and overall quality. Your verification adds credibility to their professional profile."
        },
        {
          question: "Can I bulk verify multiple entries?",
          answer: "Yes, use the bulk actions feature to verify multiple similar work entries at once, but ensure each entry meets quality standards."
        }
      ]
    };

    return [...baseFAQs, ...typeSpecificFAQs[userType]];
  };

  const documentationSections = getDocumentationSections();
  const quickStartTours = getQuickStartTours();
  const faqs = getFAQs();

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & Documentation
            <Badge variant="outline" className="ml-2">
              {userType.charAt(0).toUpperCase() + userType.slice(1)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 pr-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Quick Access</h3>
              
              {Object.entries(documentationSections).map(([key, section]) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveCategory(key)}
                >
                  {section.icon}
                  <span className="ml-2">{section.title}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 pl-6 overflow-y-auto">
            <Tabs defaultValue="tours" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tours">Guided Tours</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>

              <TabsContent value="tours" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Interactive Tutorials</h3>
                  <div className="grid gap-4">
                    {quickStartTours.map((tour) => (
                      <Card key={tour.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{tour.title}</CardTitle>
                            <Button 
                              size="sm"
                              onClick={() => onStartTour(tour.id)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Start Tour
                            </Button>
                          </div>
                          <CardDescription>{tour.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {tour.duration}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {tour.difficulty}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {documentationSections[activeCategory as keyof typeof documentationSections]?.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {documentationSections[activeCategory as keyof typeof documentationSections]?.description}
                  </p>
                  
                  {/* Documentation content would be loaded based on activeCategory */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          {documentationSections[activeCategory as keyof typeof documentationSections]?.title} Documentation
                        </h4>
                        <p className="text-gray-600 mb-4">
                          Detailed guides and instructions will be available here.
                        </p>
                        <Button variant="outline" onClick={() => onStartTour('platform-overview')}>
                          <Play className="h-4 w-4 mr-2" />
                          Take Interactive Tour Instead
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search frequently asked questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="space-y-2">
                    {filteredFAQs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFAQs.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No FAQs found matching your search.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}