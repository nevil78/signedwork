import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4" data-testid="page-change-password">
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
  );
}