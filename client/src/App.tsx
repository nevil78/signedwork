import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedRedirect } from "@/components/AuthenticatedRedirect";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import AuthPage from "@/auth/auth";
import { ForgotPasswordPage } from "@/auth/forgot-password";
import { ChangePasswordPage } from "@/auth/change-password";
import EmailVerificationPage from "@/auth/email-verification";
import VerifyEmailChangePage from "@/auth/verify-email-change";
import VerifyDelayedEmail from "@/auth/verify-delayed-email";
import VerifyEmail from "@/auth/verify-email";
import EmailOTPVerificationPage from "@/auth/email-otp-verification";
import Dashboard from "@/employee/dashboard";
import Profile from "@/employee/profile";
import WorkDiaryCompany from "@/employee/work-diary-company";
import ProfessionalProfile from "@/employee/professional-profile";
import ProfessionalWorkDiary from "@/employee/professional-work-diary";
import JobDiscoveryPage from "@/employee/job-discovery";
import CompanyDashboard from "@/company/company-dashboard";
import CompanySettings from "@/company/company-settings";
import CompanyWorkEntries from "@/company/company-work-entries";
import CompanyEmployeeProfile from "@/company/employees/company-employee-profile";
import CompanyJobsPage from "@/company/company-jobs";
import CompanyRecruiterPage from "@/company/company-recruiter";
import CompanySharedDocumentsPage from "@/company/company-shared-documents";
import CompanyEmployeeWorkDiary from "@/company/employees/company-employee-work-diary";
import CompanyEmployees from "@/company/employees/company-employees";
import CompanyHierarchySimple from "@/company/hierarchy/company-hierarchy-simple";
import WorkVerification from "@/employee/work-verification";
import { EmployeeSummaryDashboard } from "@/employee/employee-summary-dashboard";
import AdminLogin from "@/auth/admin-login";
import AdminDashboard from "@/admin/admin-dashboard";
import AdminSetup from "@/admin/admin-setup";
import AdminVerifications from "@/admin/admin-verifications";
import AdminFeedback from "@/admin/admin-feedback";
import ManagerLogin from "@/employee/manager-login";
import ManagerDashboard from "@/employee/manager-dashboard";
import ManagerWorkEntries from "@/employee/manager-work-entries";
import ManagerEmployees from "@/employee/manager-employees";
{/* CompanyManagerManagement consolidated into CompanyHierarchy */}
import FeedbackPage from "@/employee/feedback";
import ContactPage from "@/pages/contact";
import AboutPage from "@/pages/about";
import SupportPage from "@/pages/support";
import HelpSettingsPage from "@/pages/help-settings";
// Lazy load legal pages for better performance
import { lazy, Suspense } from "react";
const TermsOfService = lazy(() => import("@/pages/terms"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy"));

// Loading component for lazy-loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public Routes - No authentication required */}
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/change-password" component={ChangePasswordPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/legacy-verify-email" component={VerifyDelayedEmail} />
      <Route path="/email-otp-verification" component={EmailOTPVerificationPage} />
      <Route path="/verify-email-change" component={VerifyEmailChangePage} />
      <Route path="/email-verification" component={EmailVerificationPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/help" component={HelpSettingsPage} />
      <Route path="/terms" component={() => <Suspense fallback={<PageLoader />}><TermsOfService /></Suspense>} />
      <Route path="/privacy" component={() => <Suspense fallback={<PageLoader />}><PrivacyPolicy /></Suspense>} />
      
      {/* Protected Routes - Authentication required */}
      <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Employee Protected Routes */}
      <Route path="/profile" component={() => <ProtectedRoute requireUserType="employee"><ProfessionalProfile /></ProtectedRoute>} />
      <Route path="/summary" component={() => <ProtectedRoute requireUserType="employee"><EmployeeSummaryDashboard /></ProtectedRoute>} />
      <Route path="/work-diary" component={() => <ProtectedRoute requireUserType="employee"><ProfessionalWorkDiary /></ProtectedRoute>} />
      <Route path="/work-diary/:companyId" component={() => <ProtectedRoute requireUserType="employee"><WorkDiaryCompany /></ProtectedRoute>} />
      <Route path="/legacy-profile" component={() => <ProtectedRoute requireUserType="employee"><Profile /></ProtectedRoute>} />
      <Route path="/job-discovery" component={() => <ProtectedRoute requireUserType="employee"><JobDiscoveryPage /></ProtectedRoute>} />
      
      {/* Company Protected Routes */}
      <Route path="/company-dashboard" component={() => <ProtectedRoute requireUserType="company"><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/company-settings" component={() => <ProtectedRoute requireUserType="company"><CompanySettings /></ProtectedRoute>} />
      <Route path="/company-work-entries" component={() => <ProtectedRoute requireUserType="company"><CompanyWorkEntries /></ProtectedRoute>} />
      <Route path="/company-jobs" component={() => <ProtectedRoute requireUserType="company"><CompanyJobsPage /></ProtectedRoute>} />
      <Route path="/company-recruiter" component={() => <ProtectedRoute requireUserType="company"><CompanyRecruiterPage /></ProtectedRoute>} />
      <Route path="/company-shared-documents/:applicationId" component={() => <ProtectedRoute requireUserType="company"><CompanySharedDocumentsPage /></ProtectedRoute>} />
      <Route path="/company-employees" component={() => <ProtectedRoute requireUserType="company"><CompanyEmployees /></ProtectedRoute>} />
      <Route path="/company-hierarchy" component={() => <ProtectedRoute requireUserType="company"><CompanyHierarchySimple /></ProtectedRoute>} />
      <Route path="/work-verification" component={() => <ProtectedRoute requireUserType="company"><WorkVerification /></ProtectedRoute>} />
      <Route path="/company-employee/:employeeId" component={() => <ProtectedRoute requireUserType="company"><CompanyEmployeeProfile /></ProtectedRoute>} />
      <Route path="/employee-work-diary/:employeeId" component={() => <ProtectedRoute requireUserType="company"><CompanyEmployeeWorkDiary /></ProtectedRoute>} />
      
      {/* Admin Protected Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute requireUserType="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/verifications" component={() => <ProtectedRoute requireUserType="admin"><AdminVerifications /></ProtectedRoute>} />
      <Route path="/admin/feedback" component={() => <ProtectedRoute requireUserType="admin"><AdminFeedback /></ProtectedRoute>} />
      <Route path="/admin/setup" component={() => <ProtectedRoute requireUserType="admin"><AdminSetup /></ProtectedRoute>} />
      
      {/* Manager Protected Routes */}
      <Route path="/manager/login" component={ManagerLogin} />
      <Route path="/manager/dashboard" component={() => <ProtectedRoute requireUserType="manager"><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/work-entries" component={() => <ProtectedRoute requireUserType="manager"><ManagerWorkEntries /></ProtectedRoute>} />
      <Route path="/manager/employees" component={() => <ProtectedRoute requireUserType="manager"><ManagerEmployees /></ProtectedRoute>} />
      
      {/* Legacy redirect - now protected */}
      <Route path="/employee-profile" component={() => <ProtectedRoute requireUserType="employee"><AuthenticatedRedirect to="/profile" requireUserType="employee" /></ProtectedRoute>} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize session heartbeat to keep sessions alive
  useSessionHeartbeat();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
