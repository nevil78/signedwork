import { useQuery } from "@tanstack/react-query";
import { User, Building2, Briefcase, HelpCircle, ChevronDown, ChevronRight, Mail, Shield, FileText, Search, CheckCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import signedworkLogo from "@assets/Signed-Logo_1755167773532.png";

export default function SupportPage() {
  // Check if user is authenticated
  const { data: authUser } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
              <span className="text-xl font-bold text-slate-800">Signedwork</span>
            </a>
            <nav className="hidden md:flex space-x-8">
              <a href="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
                About
              </a>
              <a href="/support" className="text-slate-900 font-medium">
                Support
              </a>
              <a href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">
                Contact
              </a>
            </nav>
            <div className="md:hidden">
              {/* Mobile navigation - clean header */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 rounded-full p-3">
              <HelpCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4" data-testid="heading-support">
            Support Center
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto" data-testid="text-support-intro">
            Need help using Signedwork? We've got you covered.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {/* Account Help */}
          <Card className="rounded-xl shadow-lg" data-testid="section-account-help">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-slate-900">
                <User className="h-6 w-6 text-blue-600 mr-3" />
                Account Help
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="signup">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to sign up as an employee or company</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <div className="space-y-3">
                      <p><strong>For Employees:</strong></p>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Visit the main page and click "Employee" account type</li>
                        <li>Fill in your personal information (name, email, mobile number, etc.)</li>
                        <li>Create a secure password</li>
                        <li>Verify your email with the OTP code sent to your inbox</li>
                        <li>Complete your professional profile with skills and experience</li>
                      </ol>
                      <p className="mt-4"><strong>For Companies:</strong></p>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Select "Company" account type on the main page</li>
                        <li>Provide company details (name, industry, size, description)</li>
                        <li>Add business contact information</li>
                        <li>Wait for admin verification (usually within 24-48 hours)</li>
                        <li>Start posting jobs and managing employees</li>
                      </ol>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reset-password">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to reset your password</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Go to the sign-in page and click "Forgot password?"</li>
                      <li>Enter your email address</li>
                      <li>Check your email for an OTP verification code</li>
                      <li>Enter the 6-digit code on the verification page</li>
                      <li>Create a new secure password</li>
                      <li>Sign in with your new password</li>
                    </ol>
                    <p className="mt-3 text-sm text-slate-600">
                      Note: OTP codes expire after 5 minutes for security reasons.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="update-profile">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to update your profile</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <p><strong>For Employees:</strong></p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 mb-4">
                      <li>Navigate to your dashboard and click "Profile"</li>
                      <li>Edit personal information, professional summary, or skills</li>
                      <li>Upload a profile picture if desired</li>
                      <li>Add education, certifications, or work experience</li>
                      <li>Save changes to update your profile</li>
                    </ol>
                    <p><strong>For Companies:</strong></p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Go to company dashboard settings</li>
                      <li>Update company information, description, or contact details</li>
                      <li>Manage employee relationships and permissions</li>
                      <li>Save changes to update your company profile</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* For Employees */}
          <Card className="rounded-xl shadow-lg" data-testid="section-employees">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-slate-900">
                <Briefcase className="h-6 w-6 text-green-600 mr-3" />
                For Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="submit-work">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to submit work diaries for verification</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Go to "Work Diary" from your dashboard</li>
                      <li>Click "Add Work Entry" button</li>
                      <li>Select the company you're working with</li>
                      <li>Fill in work details:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Work title and description</li>
                        <li>Tasks completed and challenges faced</li>
                        <li>Skills and technologies used</li>
                        <li>Time spent and key learnings</li>
                      </ul>
                      <li>Upload any supporting files or screenshots</li>
                      <li>Submit for company review and verification</li>
                    </ol>
                    <p className="mt-3 text-sm text-slate-600">
                      Tip: Be detailed and specific in your work descriptions for better verification chances.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="track-verification">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to track verification status</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Visit your "Work Diary" page</li>
                      <li>Look for status badges on each work entry:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li><span className="inline-flex items-center"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>Pending</span> - Awaiting company review</li>
                        <li><span className="inline-flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>Verified</span> - Approved with company verification</li>
                        <li><span className="inline-flex items-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>Needs Changes</span> - Requires updates before approval</li>
                      </ul>
                      <li>Click on any entry to see detailed feedback from companies</li>
                      <li>Check your dashboard for verification statistics</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="apply-jobs">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to apply for jobs</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Navigate to "Job Discovery" from your dashboard</li>
                      <li>Use filters to find relevant positions:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Location, employment type, experience level</li>
                        <li>Salary range and work style preferences</li>
                        <li>Skills and industry categories</li>
                      </ul>
                      <li>Click on job cards to view detailed descriptions</li>
                      <li>Click "Apply Now" on interesting positions</li>
                      <li>Choose what to share:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Include your profile page as a CV</li>
                        <li>Share your verified work diary as experience</li>
                        <li>Upload additional documents if needed</li>
                      </ul>
                      <li>Write a personalized cover letter</li>
                      <li>Submit your application</li>
                    </ol>
                    <p className="mt-3 text-sm text-slate-600">
                      Note: You can only have one active application per company at a time.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* For Companies */}
          <Card className="rounded-xl shadow-lg" data-testid="section-companies">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-bold text-slate-900">
                <Building2 className="h-6 w-6 text-purple-600 mr-3" />
                For Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="post-jobs">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to post jobs</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Go to your company dashboard</li>
                      <li>Click "Jobs" from the management tools</li>
                      <li>Click "Post New Job" button</li>
                      <li>Fill in job details:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Job title and department</li>
                        <li>Detailed job description and responsibilities</li>
                        <li>Required skills and qualifications</li>
                        <li>Employment type (full-time, part-time, contract)</li>
                        <li>Location and work style (remote, hybrid, on-site)</li>
                        <li>Salary range and benefits</li>
                      </ul>
                      <li>Set application requirements and deadline</li>
                      <li>Review and publish your job posting</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="review-applications">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to review employee applications and CVs</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Navigate to "Recruiter Dashboard" from your management tools</li>
                      <li>View all applications organized by job posting</li>
                      <li>Filter applications by status:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>New applications requiring review</li>
                        <li>Shortlisted candidates</li>
                        <li>Rejected applications</li>
                      </ul>
                      <li>Click "View Attachments" to see shared documents:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Employee profile and professional summary</li>
                        <li>Verified work diary entries (only approved work)</li>
                        <li>Education, certifications, and skills</li>
                        <li>Additional uploaded documents</li>
                      </ul>
                      <li>Update application status (shortlist, reject, or contact)</li>
                      <li>Add internal notes for your hiring team</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="verify-work">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-medium">How to verify employee work</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-700 leading-relaxed">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Access "Work Entries" from your company dashboard</li>
                      <li>Review pending work submissions from your employees</li>
                      <li>For each work entry, examine:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>Work description and tasks completed</li>
                        <li>Challenges faced and solutions implemented</li>
                        <li>Skills and technologies used</li>
                        <li>Time invested and key learnings</li>
                        <li>Any attached files or documentation</li>
                      </ul>
                      <li>Provide detailed feedback and rating (1-5 stars)</li>
                      <li>Choose verification action:</li>
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li><strong>Approve:</strong> Work is verified and gets official badge</li>
                        <li><strong>Request Changes:</strong> Needs improvements before approval</li>
                        <li><strong>Reject:</strong> Work doesn't meet verification standards</li>
                      </ul>
                      <li>Submit your verification decision</li>
                    </ol>
                    <p className="mt-3 text-sm text-slate-600">
                      Verified work entries become part of the employee's trusted professional portfolio.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <Card className="rounded-xl shadow-lg bg-gradient-to-r from-blue-50 to-purple-50" data-testid="section-contact-support">
            <CardContent className="p-8">
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-full p-3 shadow-md">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Need More Help?</h3>
              <p className="text-slate-700 mb-6">
                If you need further assistance, please contact us at{" "}
                <a 
                  href="mailto:support@signedwork.com" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  data-testid="link-support-email"
                >
                  support@signedwork.com
                </a>
              </p>
              <p className="text-sm text-slate-600">
                We typically respond within 24 hours during business days.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={signedworkLogo} alt="Signedwork" className="h-6 w-6 mr-2" />
              <span className="text-slate-600">© 2025 Signedwork. Building trust through verification.</span>
            </div>
            <nav className="flex space-x-6">
              <a href="/" className="text-slate-600 hover:text-slate-900 transition-colors">
                Home
              </a>
              <a href="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
                About
              </a>
              <a href="/contact" className="text-slate-600 hover:text-slate-900 transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}