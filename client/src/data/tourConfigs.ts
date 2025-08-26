import { TourConfig } from '@/components/GuidedTour';

export const employeeTours: TourConfig[] = [
  {
    id: 'platform-overview',
    title: 'Platform Overview',
    description: 'Get familiar with Signedwork navigation and key features',
    category: 'employee',
    estimatedDuration: '3 min',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Signedwork!',
        description: 'Your professional credibility platform',
        content: 'Signedwork helps you build verified work history that employers can trust. Let\'s explore the key features together.',
        position: 'bottom'
      },
      {
        id: 'navigation',
        title: 'Main Navigation',
        description: 'Explore your dashboard options',
        content: 'The top navigation gives you access to your dashboard, profile, work diary, and job discovery features.',
        target: '[data-testid="employee-nav-header"]',
        position: 'bottom'
      },
      {
        id: 'profile-section',
        title: 'Your Professional Profile',
        description: 'Build your verified professional identity',
        content: 'Your profile showcases verified work history, skills, and achievements. Keep it updated for better job matches.',
        target: '[data-testid="nav-profile"]',
        position: 'bottom'
      },
      {
        id: 'work-diary',
        title: 'Work Diary',
        description: 'Track and verify your daily work',
        content: 'Log your work activities here. Once verified by your manager, these become part of your credible professional history.',
        target: '[data-testid="nav-work-diary"]',
        position: 'bottom'
      },
      {
        id: 'job-discovery',
        title: 'Job Discovery',
        description: 'Find opportunities that match your verified skills',
        content: 'Discover jobs tailored to your verified skills and experience. Employers can see your credible work history.',
        target: '[data-testid="nav-job-discovery"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'employee-profile-setup',
    title: 'Complete Your Profile',
    description: 'Set up your professional profile for maximum impact',
    category: 'employee',
    estimatedDuration: '5 min',
    steps: [
      {
        id: 'profile-importance',
        title: 'Why Your Profile Matters',
        description: 'A complete profile increases your job match quality',
        content: 'Employers trust complete, verified profiles. Each section you fill increases your credibility and visibility.',
        position: 'bottom'
      },
      {
        id: 'basic-info',
        title: 'Personal Information',
        description: 'Start with your basic details',
        content: 'Add your name, contact info, and professional photo. This creates your professional identity on the platform.',
        target: '[data-testid="profile-basic-info"]',
        position: 'right'
      },
      {
        id: 'experience-section',
        title: 'Work Experience',
        description: 'Document your professional journey',
        content: 'Add your work history. When verified by companies, this becomes powerful proof of your experience.',
        target: '[data-testid="profile-experience"]',
        position: 'right'
      },
      {
        id: 'skills-section',
        title: 'Skills & Expertise',
        description: 'Highlight your professional capabilities',
        content: 'List your skills. As you complete verified work using these skills, your expertise level increases.',
        target: '[data-testid="profile-skills"]',
        position: 'right'
      },
      {
        id: 'education-section',
        title: 'Education & Certifications',
        description: 'Add your educational background',
        content: 'Include degrees, certifications, and training. This supports your verified work experience.',
        target: '[data-testid="profile-education"]',
        position: 'right'
      }
    ]
  },
  {
    id: 'employee-work-tracking',
    title: 'Track Your Work',
    description: 'Learn how to log and get work verified',
    category: 'employee',
    estimatedDuration: '7 min',
    steps: [
      {
        id: 'work-diary-intro',
        title: 'Your Work Diary',
        description: 'The foundation of your professional credibility',
        content: 'Every verified work entry builds your professional reputation. Let\'s learn how to create quality entries.',
        position: 'bottom'
      },
      {
        id: 'add-work-entry',
        title: 'Creating Work Entries',
        description: 'Log your daily accomplishments',
        content: 'Click "Add Entry" to log work. Be specific about what you accomplished and what skills you used.',
        target: '[data-testid="add-work-entry"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'work-details',
        title: 'Work Entry Details',
        description: 'Provide comprehensive information',
        content: 'Include project details, time spent, skills used, and outcomes. More detail helps verifiers understand your contribution.',
        position: 'right'
      },
      {
        id: 'request-verification',
        title: 'Request Verification',
        description: 'Get your work officially verified',
        content: 'Select your manager or project lead to verify this work. Verified entries become part of your credible history.',
        target: '[data-testid="request-verification"]',
        position: 'bottom',
        action: 'click'
      },
      {
        id: 'verification-status',
        title: 'Track Verification Status',
        description: 'Monitor your verification requests',
        content: 'See the status of your verification requests. Follow up with verifiers if needed for timely approval.',
        target: '[data-testid="verification-status"]',
        position: 'left'
      }
    ]
  }
];

export const companyTours: TourConfig[] = [
  {
    id: 'platform-overview',
    title: 'Platform Overview',
    description: 'Get familiar with Signedwork company features',
    category: 'company',
    estimatedDuration: '3 min',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Signedwork!',
        description: 'Manage your organization and build verified talent',
        content: 'Signedwork helps you manage employees and build a reputation as a company that values verified professional growth.',
        position: 'bottom'
      },
      {
        id: 'company-navigation',
        title: 'Company Dashboard',
        description: 'Your central command center',
        content: 'From here you can manage employees, view work verification requests, and oversee your organizational structure.',
        target: '[data-testid="company-nav-header"]',
        position: 'bottom'
      },
      {
        id: 'employees-section',
        title: 'Employee Management',
        description: 'Manage your workforce',
        content: 'Invite employees, track their verified work, and build detailed organizational charts.',
        target: '[data-testid="nav-employees"]',
        position: 'bottom'
      },
      {
        id: 'hierarchy-section',
        title: 'Organizational Structure',
        description: 'Build and manage your company hierarchy',
        content: 'Create branches, teams, and management structures. This determines who can verify whose work.',
        target: '[data-testid="nav-hierarchy"]',
        position: 'bottom'
      }
    ]
  },
  {
    id: 'company-initial-setup',
    title: 'Company Registration',
    description: 'Complete your company profile and settings',
    category: 'company',
    estimatedDuration: '8 min',
    steps: [
      {
        id: 'company-profile',
        title: 'Company Profile Setup',
        description: 'Establish your organization\'s identity',
        content: 'Complete your company information to build trust with employees and partners. This appears on employee profiles.',
        position: 'bottom'
      },
      {
        id: 'business-info',
        title: 'Business Information',
        description: 'Add essential company details',
        content: 'Include industry, size, location, and description. This helps employees understand your organization.',
        target: '[data-testid="company-business-info"]',
        position: 'right'
      },
      {
        id: 'verification-policies',
        title: 'Verification Policies',
        description: 'Set company-wide verification standards',
        content: 'Define what types of work require verification and approval workflows. This ensures consistent quality.',
        target: '[data-testid="verification-policies"]',
        position: 'right'
      },
      {
        id: 'invitation-settings',
        title: 'Employee Invitation Setup',
        description: 'Configure how employees join your organization',
        content: 'Generate invitation codes and set up email templates for onboarding new employees.',
        target: '[data-testid="invitation-settings"]',
        position: 'right'
      }
    ]
  }
];

export const managerTours: TourConfig[] = [
  {
    id: 'manager-verification-workflow',
    title: 'Work Verification',
    description: 'Learn how to review and verify employee work entries',
    category: 'manager',
    estimatedDuration: '5 min',
    steps: [
      {
        id: 'verification-importance',
        title: 'Why Verification Matters',
        description: 'Your role in building employee credibility',
        content: 'Your verification adds credibility to employee work history. This helps them in career growth and job applications.',
        position: 'bottom'
      },
      {
        id: 'pending-requests',
        title: 'Pending Verification Requests',
        description: 'Review work that needs your approval',
        content: 'Employees submit work entries that require your verification. Review these regularly for timely feedback.',
        target: '[data-testid="pending-verifications"]',
        position: 'bottom'
      },
      {
        id: 'review-work-entry',
        title: 'Reviewing Work Entries',
        description: 'What to look for in verification',
        content: 'Check accuracy of work description, time spent, skills used, and quality of outcomes. Your verification is your professional endorsement.',
        target: '[data-testid="work-entry-review"]',
        position: 'right',
        action: 'click'
      },
      {
        id: 'verification-decision',
        title: 'Making Verification Decisions',
        description: 'Approve, request changes, or decline',
        content: 'Approve accurate entries, request changes for unclear details, or decline if work wasn\'t performed as described.',
        target: '[data-testid="verification-actions"]',
        position: 'bottom'
      },
      {
        id: 'feedback-system',
        title: 'Providing Feedback',
        description: 'Help employees improve their entries',
        content: 'Add constructive feedback to help employees write better work entries and understand what makes quality verified work.',
        target: '[data-testid="verification-feedback"]',
        position: 'left'
      }
    ]
  }
];

// Export all tours by category
export const allTours = {
  employee: employeeTours,
  company: companyTours,
  manager: managerTours
};

// Helper function to get tours by user type
export function getToursByUserType(userType: 'employee' | 'company' | 'manager'): TourConfig[] {
  return allTours[userType] || [];
}

// Helper function to get a specific tour
export function getTourById(tourId: string, userType: 'employee' | 'company' | 'manager'): TourConfig | undefined {
  const tours = getToursByUserType(userType);
  return tours.find(tour => tour.id === tourId);
}