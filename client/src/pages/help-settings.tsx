import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  Play, 
  BookOpen, 
  MessageSquare, 
  ExternalLink,
  Clock,
  CheckCircle,
  Star,
  Users,
  Building,
  UserCheck,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTour } from '@/hooks/useTour';
import { useLocation } from 'wouter';
import GuidedTour from '@/components/GuidedTour';
import TourButton from '@/components/TourButton';
import { getToursByUserType } from '@/data/tourConfigs';
import { hasCompletedTour, shouldShowTourPrompt } from '@/hooks/useTour';

export default function HelpSettingsPage() {
  const { user, userType } = useAuth();
  const [location, setLocation] = useLocation();
  const { activeTour, isTourActive, startTour, completeTour, skipTour, closeTour } = useTour();

  // Get user-specific tours
  const availableTours = getToursByUserType(userType || 'employee');
  const completedTours = availableTours.filter(tour => hasCompletedTour(tour.id));
  const recommendedTours = availableTours.filter(tour => shouldShowTourPrompt(tour.id));

  const handleStartTour = (tourId: string) => {
    startTour(tourId, userType || 'employee');
  };

  const getUserTypeIcon = () => {
    switch (userType) {
      case 'company': return <Building className="h-4 w-4" />;
      case 'manager': return <UserCheck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'company': return 'Company Account';
      case 'manager': return 'Manager Account';
      default: return 'Employee Account';
    }
  };

  const handleBackNavigation = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackNavigation}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              data-testid="button-back-navigation"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Help & Learning Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">Get help and learn how to use Signedwork effectively</p>
            <Badge variant="outline" className="ml-2">
              {getUserTypeIcon()}
              <span className="ml-1">{getUserTypeLabel()}</span>
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="tours" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tours">Interactive Tours</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Interactive Tours Tab */}
          <TabsContent value="tours" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{completedTours.length}</p>
                      <p className="text-sm text-gray-600">Tours Completed</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{recommendedTours.length}</p>
                      <p className="text-sm text-gray-600">Recommended</p>
                    </div>
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-600">{availableTours.length}</p>
                      <p className="text-sm text-gray-600">Total Available</p>
                    </div>
                    <Play className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommended Tours */}
            {recommendedTours.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-blue-600" />
                    Recommended for You
                  </CardTitle>
                  <CardDescription>
                    Start with these tours to get the most out of Signedwork
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recommendedTours.map((tour) => (
                    <TourButton
                      key={tour.id}
                      tour={tour}
                      onStartTour={handleStartTour}
                      variant="outline"
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All Available Tours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  All Available Tours
                </CardTitle>
                <CardDescription>
                  Complete interactive guides for all platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableTours.map((tour) => (
                  <TourButton
                    key={tour.id}
                    tour={tour}
                    onStartTour={handleStartTour}
                    variant="ghost"
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentation & Guides
                </CardTitle>
                <CardDescription>
                  Comprehensive guides and reference materials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userType === 'company' ? (
                  // Company-specific documentation
                  <div className="grid gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-medium mb-3 text-blue-900">Company Setup & Registration</h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li>• <strong>Initial Setup:</strong> Complete company profile, add business information and logo</li>
                        <li>• <strong>Invitation Codes:</strong> Generate unique codes for employee recruitment</li>
                        <li>• <strong>Verification Settings:</strong> Configure work diary approval workflows</li>
                        <li>• <strong>Company Branding:</strong> Customize your organization's public profile</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-medium mb-3 text-green-900">Organizational Structure Management</h4>
                      <ul className="text-sm text-green-800 space-y-2">
                        <li>• <strong>Hierarchy Creation:</strong> Set up Company → Branches → Teams structure</li>
                        <li>• <strong>Role Assignments:</strong> Assign Company Admin, Branch Manager, Team Lead roles</li>
                        <li>• <strong>Employee Management:</strong> Track employment status, positions, and assignments</li>
                        <li>• <strong>Matrix Management:</strong> Visual organization charts with capacity tracking</li>
                        <li>• <strong>Conflict Detection:</strong> Automated identification of organizational issues</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <h4 className="font-medium mb-3 text-purple-900">Work Diary & Verification System</h4>
                      <ul className="text-sm text-purple-800 space-y-2">
                        <li>• <strong>Hierarchical Approval:</strong> Multi-level work verification workflows</li>
                        <li>• <strong>Bulk Processing:</strong> Approve multiple work entries efficiently</li>
                        <li>• <strong>Verification Analytics:</strong> Track approval rates and processing times</li>
                        <li>• <strong>Quality Control:</strong> Ensure work diary accuracy and completeness</li>
                        <li>• <strong>Immutable Records:</strong> Approved entries become permanent credentials</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <h4 className="font-medium mb-3 text-orange-900">Recruitment & Job Management</h4>
                      <ul className="text-sm text-orange-800 space-y-2">
                        <li>• <strong>Job Posting:</strong> Create and publish job opportunities</li>
                        <li>• <strong>Application Management:</strong> Review and process candidate applications</li>
                        <li>• <strong>Recruitment Pipelines:</strong> Track candidates through hiring stages</li>
                        <li>• <strong>Talent Discovery:</strong> Search verified professionals by skills and experience</li>
                        <li>• <strong>Interview Scheduling:</strong> Coordinate recruitment activities</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                      <h4 className="font-medium mb-3 text-red-900">Analytics & Performance Monitoring</h4>
                      <ul className="text-sm text-red-800 space-y-2">
                        <li>• <strong>Company Dashboard:</strong> Real-time overview of all business metrics</li>
                        <li>• <strong>Employee Analytics:</strong> Track team performance and productivity</li>
                        <li>• <strong>Recruitment Metrics:</strong> Monitor hiring success rates and time-to-fill</li>
                        <li>• <strong>Verification Statistics:</strong> Analyze work diary approval patterns</li>
                        <li>• <strong>Organizational Health:</strong> Capacity tracking and optimization recommendations</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-500">
                      <h4 className="font-medium mb-3 text-gray-900">Security & Compliance</h4>
                      <ul className="text-sm text-gray-800 space-y-2">
                        <li>• <strong>Role-Based Access:</strong> Granular permissions for different user levels</li>
                        <li>• <strong>Audit Trails:</strong> Complete logging of all verification activities</li>
                        <li>• <strong>Data Protection:</strong> Secure handling of employee and business information</li>
                        <li>• <strong>Legal Compliance:</strong> Meet professional verification standards</li>
                        <li>• <strong>Privacy Controls:</strong> Manage data visibility and sharing permissions</li>
                      </ul>
                    </div>
                  </div>
                ) : userType === 'employee' ? (
                  // Employee-specific documentation
                  <div className="grid gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Quick Reference</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Getting started with your account</li>
                        <li>• Building your professional profile</li>
                        <li>• Tracking work in your diary</li>
                        <li>• Using job discovery features</li>
                        <li>• Understanding work verification</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Advanced Features</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Skills tracking and validation</li>
                        <li>• Professional networking</li>
                        <li>• Career progression tracking</li>
                        <li>• Verified credential building</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  // Manager-specific documentation
                  <div className="grid gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Management Tools</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Team work verification</li>
                        <li>• Employee performance tracking</li>
                        <li>• Work diary approval workflows</li>
                        <li>• Team organization management</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Get Support
                </CardTitle>
                <CardDescription>
                  Multiple ways to get help when you need it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Self-Service Options</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => handleStartTour('platform-overview')}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Take Interactive Tour
                      </Button>
                      <p className="text-xs text-gray-500">
                        Browse this page's Documentation tab for detailed guides and FAQ
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Contact Support</h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Support Message
                      </Button>
                      <p className="text-xs text-gray-500">
                        Response time: Usually within 24 hours
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Share Your Feedback
                </CardTitle>
                <CardDescription>
                  Help us improve Signedwork with your suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Report a Bug
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Suggest a Feature
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    General Feedback
                  </Button>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">We Value Your Input</h4>
                  <p className="text-sm text-blue-800">
                    Your feedback helps us build a better platform for professional verification 
                    and networking. Every suggestion is reviewed by our product team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Guided Tour Component */}
      {isTourActive && activeTour && (
        <GuidedTour
          tour={activeTour}
          isActive={isTourActive}
          onComplete={completeTour}
          onClose={closeTour}
          onSkip={skipTour}
        />
      )}
    </div>
  );
}