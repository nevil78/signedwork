import { Button } from "@/components/ui/button";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface UnifiedHeaderProps {
  showBackButton?: boolean;
  showAuthButtons?: boolean;
  currentPage?: "landing" | "auth" | "login" | "signup";
}

export default function UnifiedHeader({ 
  showBackButton = false, 
  showAuthButtons = true,
  currentPage = "landing"
}: UnifiedHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {showBackButton && (
              <Link href="/" data-testid="button-back-home">
                <Button variant="ghost" className="mr-4 text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            )}
            <Link href="/" className="flex items-center" data-testid="link-home-logo">
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-auto" />
              <span className="ml-3 text-xl font-bold text-slate-900">Signedwork</span>
            </Link>
          </div>
          
          {/* Navigation Links - only on landing page */}
          {currentPage === "landing" && (
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900">Features</a>
              <a href="#enterprise" className="text-slate-600 hover:text-slate-900">Enterprise</a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-900">Testimonials</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900">Pricing</a>
            </div>
          )}

          {/* Auth Buttons */}
          {showAuthButtons && (
            <div className="flex space-x-4">
              {currentPage !== "login" && (
                <Link href="/login" data-testid="link-login">
                  <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                    Login
                  </Button>
                </Link>
              )}
              {currentPage !== "signup" && currentPage !== "auth" && (
                <Link href="/signup" data-testid="link-signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Breadcrumb for auth pages */}
      {(currentPage === "auth" || currentPage === "login" || currentPage === "signup") && (
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900" data-testid="breadcrumb-home">Home</Link>
              <span className="mx-2">›</span>
              <span className="text-slate-900">
                {currentPage === "login" ? "Login" : 
                 currentPage === "signup" ? "Sign Up" : 
                 "Account Setup"}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}