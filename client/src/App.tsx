import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";
import AuthPage from "@/pages/auth";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { ChangePasswordPage } from "@/pages/change-password";
import EmailVerificationPage from "@/pages/email-verification";
import VerifyEmailChangePage from "@/pages/verify-email-change";
import VerifyDelayedEmail from "@/pages/verify-delayed-email";
import VerifyEmail from "@/pages/verify-email";
import EmailOTPVerificationPage from "@/pages/email-otp-verification";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import WorkDiary from "@/pages/work-diary";
import WorkDiaryCompany from "@/pages/work-diary-company";
import ProfessionalProfile from "@/pages/professional-profile";
import ProfessionalWorkDiary from "@/pages/professional-work-diary";
import JobDiscoveryPage from "@/pages/job-discovery";
import CompanyDashboard from "@/pages/company-dashboard";
import CompanyWorkEntries from "@/pages/company-work-entries";
import CompanyEmployeeProfile from "@/pages/company-employee-profile";
import CompanyJobsPage from "@/pages/company-jobs";
import CompanyRecruiterPage from "@/pages/company-recruiter";
import CompanySharedDocumentsPage from "@/pages/company-shared-documents";
import CompanyEmployeeWorkDiary from "@/pages/company-employee-work-diary";
import CompanyEmployees from "@/pages/company-employees";
import { EmployeeSummaryDashboard } from "@/pages/employee-summary-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminSetup from "@/pages/admin-setup";
import AdminVerifications from "@/pages/admin-verifications";
import AdminFeedback from "@/pages/admin-feedback";
import FeedbackPage from "@/pages/feedback";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/change-password" component={ChangePasswordPage} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/legacy-verify-email" component={VerifyDelayedEmail} />
      <Route path="/email-otp-verification" component={EmailOTPVerificationPage} />
      <Route path="/verify-email-change" component={VerifyEmailChangePage} />
      <Route path="/email-verification" component={EmailVerificationPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={ProfessionalProfile} />
      <Route path="/summary" component={EmployeeSummaryDashboard} />
      <Route path="/work-diary" component={ProfessionalWorkDiary} />
      <Route path="/work-diary/:companyId" component={WorkDiaryCompany} />
      <Route path="/legacy-profile" component={Profile} />
      <Route path="/legacy-work-diary" component={WorkDiary} />
      <Route path="/job-discovery" component={JobDiscoveryPage} />
      <Route path="/company-dashboard" component={CompanyDashboard} />
      <Route path="/company-work-entries" component={CompanyWorkEntries} />
      <Route path="/company-jobs" component={CompanyJobsPage} />
      <Route path="/company-recruiter" component={CompanyRecruiterPage} />
      <Route path="/company-shared-documents/:applicationId" component={CompanySharedDocumentsPage} />
      <Route path="/company-employees" component={CompanyEmployees} />
      <Route path="/company-employee/:employeeId" component={CompanyEmployeeProfile} />
      <Route path="/employee-work-diary/:employeeId" component={CompanyEmployeeWorkDiary} />
      <Route path="/employee-profile" component={() => { window.location.href = "/profile"; return null; }} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/verifications" component={AdminVerifications} />
      <Route path="/admin/feedback" component={AdminFeedback} />
      <Route path="/admin/setup" component={AdminSetup} />
      <Route path="/feedback" component={FeedbackPage} />
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
