import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Shield, AlertTriangle, ArrowLeft, Home } from "lucide-react";

interface Company403Props {
  requiredRole?: string;
  currentRole?: string;
  route?: string;
}

function Company403({ requiredRole, currentRole, route }: Company403Props) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" data-testid="company-403-page">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">Insufficient Permissions</span>
            </div>
            <p className="text-sm text-red-700">
              You don't have the required permissions to access this page.
            </p>
          </div>

          {requiredRole && currentRole && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Required Role:</span>
                <Badge variant="destructive">{requiredRole}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Your Role:</span>
                <Badge variant="secondary">{currentRole}</Badge>
              </div>
            </div>
          )}

          {route && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Restricted Route:</span>
              <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">{route}</code>
            </div>
          )}

          <div className="pt-4 space-y-3">
            <p className="text-sm text-gray-600">
              Contact your company administrator if you believe you should have access to this page.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
                data-testid="button-go-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                onClick={() => setLocation("/company-dashboard")}
                className="w-full"
                data-testid="button-dashboard"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Company403;