import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Terms of Service</DialogTitle>
            <button 
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={onClose}
              data-testid="button-close-terms-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-2">Last updated: August 20, 2025</p>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-none space-y-6">
            
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Welcome to Signedwork ("we," "our," or "us"). By accessing or using our platform at signedwork.com, 
                you agree to be bound by these Terms of Service. If you do not agree with these terms, 
                please do not use our services.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">2. Eligibility</h2>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 18 years old and of legal working age in your jurisdiction to use Signedwork. 
                By using our platform, you represent and warrant that you meet these eligibility requirements.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">3. User Accounts</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">3.1 Account Registration</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may register as either an employee or a company. You must provide accurate, current, 
                  and complete information during registration and keep your account information updated.
                </p>
                
                <h3 className="text-lg font-medium text-gray-800">3.2 Account Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and 
                  for all activities that occur under your account.
                </p>
              </div>
            </section>

            {/* Platform Use */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">4. Platform Use</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">4.1 Permitted Use</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may use Signedwork for legitimate professional networking, job searching, 
                  employee verification, and work documentation purposes.
                </p>
                
                <h3 className="text-lg font-medium text-gray-800">4.2 Prohibited Activities</h3>
                <p className="text-gray-700 leading-relaxed mb-2">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Provide false or misleading information</li>
                  <li>Impersonate another person or entity</li>
                  <li>Use the platform for illegal activities</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with other users' use of the platform</li>
                </ul>
              </div>
            </section>

            {/* Work Verification */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">5. Work Verification System</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Our platform includes a work verification system where:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Employees can document their work experiences</li>
                <li>Companies can verify and approve employee work entries</li>
                <li>Verified work entries become immutable records</li>
                <li>False documentation may result in account suspension</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                You retain ownership of content you submit to our platform. However, by submitting content, 
                you grant us a license to use, display, and distribute such content as necessary to provide our services.
              </p>
            </section>

            {/* Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">7. Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                use, and protect your personal information.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">8. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your account at any time for violation of these terms or for any other reason. 
                You may also delete your account at any time through your account settings.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, Signedwork shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages resulting from your use of our platform.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">10. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms of Service, please contact us at legal@signedwork.com 
                or through our platform's contact form.
              </p>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}