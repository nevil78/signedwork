import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
            <button 
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={onClose}
              data-testid="button-close-privacy-modal"
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
                At Signedwork, we respect your privacy and are committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform 
                at signedwork.com.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">2. Information We Collect</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">2.1 Personal Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Name, email address, phone number</li>
                  <li>Professional information (job title, company, work experience)</li>
                  <li>Profile information and work diary entries</li>
                  <li>Resume and portfolio documents</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Provide and maintain our services</li>
                <li>Verify work experience and professional credentials</li>
                <li>Facilitate connections between employees and companies</li>
                <li>Send important updates and notifications</li>
                <li>Improve our platform and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">4. Information Sharing</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>With companies when you apply for jobs or share your profile</li>
                <li>With third-party service providers who assist in our operations</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
                secure servers, and regular security assessments.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">6. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Access and review your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Object to certain data processing activities</li>
                <li>Data portability (receive your data in a structured format)</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">7. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at privacy@signedwork.com or through our platform's contact form.
              </p>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}