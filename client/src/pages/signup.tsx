import { User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import UnifiedHeader from "@/components/UnifiedHeader";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <UnifiedHeader 
        showBackButton={true} 
        showAuthButtons={false}
        currentPage="signup"
      />
      
      <div className="flex justify-center items-center min-h-[calc(100vh-120px)] p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2" data-testid="text-signup-title">
              Welcome to Signedwork
            </h1>
            <p className="text-slate-600" data-testid="text-signup-description">
              Choose your account type to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Employee Card */}
            <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors cursor-pointer group">
              <Link href="/signup/employee" className="block" data-testid="link-signup-employee">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-slate-900" data-testid="text-employee-title">
                    Professional Account
                  </CardTitle>
                  <CardDescription data-testid="text-employee-description">
                    Individual professional account
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Complete professional profile
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      AI-powered job discovery
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Verified work experience
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Professional networking
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-700 transition-colors">
                    Create Professional Account
                  </Button>
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Free forever
                  </p>
                </CardContent>
              </Link>
            </Card>

            {/* Company Card */}
            <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors cursor-pointer group">
              <Link href="/signup/company" className="block" data-testid="link-signup-company">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <Building className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-slate-900" data-testid="text-company-title">
                    Enterprise Account
                  </CardTitle>
                  <CardDescription data-testid="text-company-description">
                    Organization account
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      Hierarchical organization structure
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      Advanced work tracking
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      Employee management
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      Performance analytics
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:bg-purple-700 transition-colors">
                    Register Your Company
                  </Button>
                  <p className="text-center text-xs text-slate-500 mt-2">
                    Custom pricing
                  </p>
                </CardContent>
              </Link>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-600 text-sm">
              Already have an account?{" "}
              <Link href="/login" data-testid="link-login">
                <Button variant="link" className="p-0 h-auto text-blue-600">
                  Sign in
                </Button>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}