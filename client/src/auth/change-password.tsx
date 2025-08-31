import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import signedworkLogo from "@assets/Signed-work-Logo (1)_1755168042120.png";

export function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-testid="page-change-password">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={signedworkLogo} alt="Signedwork" className="h-8 w-8 mr-3" />
              <span className="text-xl font-bold text-slate-800">Signedwork</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900" data-testid="heading-change-password">
              Password Security
            </h1>
            <p className="text-gray-600 mt-2" data-testid="text-description">
              Keep your account secure by updating your password regularly
            </p>
          </div>
          
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}