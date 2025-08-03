import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import WorkDiary from "@/pages/work-diary";
import WorkDiaryCompany from "@/pages/work-diary-company";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/work-diary" component={WorkDiary} />
      <Route path="/work-diary/:companyId" component={WorkDiaryCompany} />
      <Route path="/employee-profile" component={() => { window.location.href = "/profile"; return null; }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
