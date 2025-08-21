import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  const [from, setFrom] = useState<string | null>(null);

  useEffect(() => {
    // Check query parameters for the 'from' parameter
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    setFrom(fromParam);

    // Prefetch the registration page for instant navigation
    if (fromParam === 'employee-registration' || fromParam === 'company-registration') {
      // Preload the auth page for instant navigation
      import('@/pages/auth').catch(() => {
        // Silently fail if prefetch doesn't work
      });
    }
  }, []);

  const handleBack = () => {
    // Use instant client-side navigation
    if (from === 'employee-registration') {
      setLocation('/?view=employee-register');
    } else if (from === 'company-registration') {
      setLocation('/?view=company-register');
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
              onClick={handleBack}
              data-testid="button-close-privacy"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4" data-testid="heading-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mt-2" data-testid="text-last-updated">
            Last updated: August 20, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="max-w-none">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-introduction">
                1. Introduction
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="text-introduction">
                At Signedwork, we respect your privacy and are committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform 
                at signedwork.com.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-collect">
                2. Information We Collect
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4" data-testid="text-collect">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">Personal Information You Provide</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Account registration information (name, email, password)</li>
                    <li>Professional profile details (work experience, education, skills)</li>
                    <li>Company information (business name, industry, contact details)</li>
                    <li>Work diary entries and project documentation</li>
                    <li>Profile pictures and uploaded documents</li>
                    <li>Communication preferences and settings</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">Automatically Collected Information</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP address and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Usage patterns and interaction data</li>
                    <li>Login times and session duration</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-use">
                3. How We Use Your Information
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-use">
                <p className="mb-4">We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our platform services</li>
                  <li>Facilitate work verification between employees and companies</li>
                  <li>Enable job discovery and application features</li>
                  <li>Send important notifications about your account</li>
                  <li>Improve our platform functionality and user experience</li>
                  <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal obligations and resolve disputes</li>
                  <li>Analyze usage patterns to enhance our services</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-sharing">
                4. Information Sharing
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-4" data-testid="text-sharing">
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">Within Signedwork Platform</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Employee profiles are visible to companies for hiring purposes</li>
                    <li>Work entries are shared between employees and their associated companies</li>
                    <li>Company information is visible to employees for verification purposes</li>
                    <li>Public profile information may be visible to other platform users</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900">External Sharing</h3>
                  <p className="mb-2">We may share your information with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Service providers who assist in platform operations</li>
                    <li>Legal authorities when required by law</li>
                    <li>Business partners with your explicit consent</li>
                    <li>Emergency contacts in urgent situations</li>
                  </ul>
                  <p className="mt-3 font-medium">We do not sell your personal information to third parties.</p>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-security">
                5. Data Security
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-security">
                <p className="mb-4">We implement comprehensive security measures to protect your information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encrypted data transmission using industry-standard SSL/TLS protocols</li>
                  <li>Secure password hashing and authentication systems</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and employee training programs</li>
                  <li>Data backup and disaster recovery procedures</li>
                  <li>Compliance with industry security standards</li>
                </ul>
                <p className="mt-4">
                  While we strive to protect your information, no internet transmission is 100% secure. 
                  We encourage you to use strong passwords and keep your login credentials confidential.
                </p>
              </div>
            </section>

            {/* Your Rights and Choices */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-rights">
                6. Your Rights and Choices
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-rights">
                <p className="mb-4">You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request copies of your personal data</li>
                  <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request removal of your personal data (subject to legal requirements)</li>
                  <li><strong>Data Portability:</strong> Export your data in a structured format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Privacy Settings:</strong> Control visibility of your profile information</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at privacy@signedwork.com with your request and verification information.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-retention">
                7. Data Retention
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-retention">
                <p className="mb-4">We retain your information for the following periods:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Data:</strong> Until you delete your account or request removal</li>
                  <li><strong>Work Entries:</strong> Permanently retained for verification integrity (with anonymization options)</li>
                  <li><strong>Communication Records:</strong> 7 years for legal compliance</li>
                  <li><strong>Usage Analytics:</strong> 2 years in aggregated, anonymized form</li>
                  <li><strong>Security Logs:</strong> 1 year for platform protection</li>
                </ul>
                <p className="mt-4">
                  After deletion, some information may persist in backup systems for up to 90 days 
                  before permanent removal.
                </p>
              </div>
            </section>

            {/* International Data Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-transfers">
                8. International Data Transfers
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="text-transfers">
                Your information may be stored and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data according to this Privacy Policy 
                and applicable data protection laws, including implementing standard contractual clauses 
                and conducting regular compliance assessments.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-children">
                9. Children's Privacy
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="text-children">
                Signedwork is not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children. If we discover that we have collected information from a minor, 
                we will promptly delete such information and terminate the associated account.
              </p>
            </section>

            {/* Policy Changes */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-changes">
                10. Policy Changes
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-changes">
                <p className="mb-4">
                  We may update this Privacy Policy periodically to reflect changes in our practices 
                  or applicable laws. When we make significant changes, we will:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Update the "Last updated" date at the top of this policy</li>
                  <li>Send notification to your registered email address</li>
                  <li>Display a prominent notice on our platform</li>
                  <li>Provide a summary of key changes</li>
                </ul>
                <p className="mt-4">
                  Your continued use of Signedwork after policy updates constitutes acceptance 
                  of the revised terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-contact">
                11. Contact Information
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-contact">
                <p className="mb-4">
                  If you have questions, concerns, or requests regarding this Privacy Policy 
                  or our data practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> privacy@signedwork.com</p>
                  <p><strong>Support:</strong> support@signedwork.com</p>
                  <p><strong>Address:</strong> Signedwork Privacy Team<br />
                  [Physical Address - To be determined]</p>
                </div>
                <p className="mt-4">
                  We are committed to addressing your privacy concerns promptly and transparently.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}