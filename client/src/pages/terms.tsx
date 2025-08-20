import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button 
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4" data-testid="heading-terms-title">
            Terms of Service
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
                Welcome to Signedwork ("we," "our," or "us"). By accessing or using our platform at signedwork.com, 
                you agree to be bound by these Terms of Service. If you do not agree with these terms, 
                please do not use our services.
              </p>
            </section>

            {/* Eligibility */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-eligibility">
                2. Eligibility
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="text-eligibility">
                You must be at least 18 years old and of legal working age in your jurisdiction to use Signedwork. 
                By using our platform, you represent that you meet these age requirements and have the legal capacity 
                to enter into these terms.
              </p>
            </section>

            {/* Accounts & Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-accounts">
                3. Accounts & Responsibilities
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-3" data-testid="text-accounts">
                <p>When creating an account on Signedwork, you agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information about yourself or your company</li>
                  <li>Maintain and update your information to keep it accurate and current</li>
                  <li>Safeguard your login credentials and not share them with others</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Take responsibility for all activities that occur under your account</li>
                </ul>
              </div>
            </section>

            {/* Employee Work Verification */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-verification">
                4. Employee Work Verification
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-3" data-testid="text-verification">
                <p>
                  Signedwork serves as a platform to facilitate work verification between employees and companies. 
                  We provide tools and systems to support this process, but we do not guarantee the accuracy 
                  of any work claims or verifications.
                </p>
                <p>
                  <strong>Important:</strong> Signedwork is not responsible for disputes regarding the accuracy, 
                  completeness, or validity of submitted work entries or company verifications. Users must 
                  resolve such disputes directly with each other.
                </p>
              </div>
            </section>

            {/* Job Applications & Hiring */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-hiring">
                5. Job Applications & Hiring
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-3" data-testid="text-hiring">
                <p>Companies using Signedwork to post jobs are solely responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ensuring job listings are accurate, legal, and fair</li>
                  <li>Complying with applicable employment laws and regulations</li>
                  <li>Making hiring decisions based on their own judgment</li>
                  <li>Conducting proper due diligence on potential employees</li>
                </ul>
                <p>
                  Signedwork is not liable for hiring decisions, employment disputes, or any consequences 
                  arising from the hiring process.
                </p>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-prohibited">
                6. Prohibited Activities
              </h2>
              <div className="text-gray-700 leading-relaxed" data-testid="text-prohibited">
                <p>You may not use Signedwork to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Create fake profiles or provide false information</li>
                  <li>Submit fraudulent work claims or fake verifications</li>
                  <li>Send spam or unsolicited communications</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Interfere with the platform's functionality or security</li>
                  <li>Use automated systems to access the platform without permission</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-ip">
                7. Intellectual Property
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-3" data-testid="text-ip">
                <p>
                  The Signedwork platform, including its design, features, and content (excluding user-submitted content), 
                  is owned by Signedwork and protected by intellectual property laws.
                </p>
                <p>
                  By submitting content to Signedwork (such as work entries, profiles, or other information), 
                  you grant us a non-exclusive license to display, process, and store your content for the purpose 
                  of providing our verification services. You retain ownership of your submitted content.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-termination">
                8. Termination
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-3" data-testid="text-termination">
                <p>
                  Signedwork reserves the right to suspend or terminate your account at any time if you violate 
                  these terms or engage in conduct that we determine is harmful to our platform or other users.
                </p>
                <p>
                  You may also terminate your account at any time by contacting us at support@signedwork.com. 
                  Upon termination, your access to the platform will be discontinued, though certain information 
                  may be retained as required by law or for legitimate business purposes.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-liability">
                9. Limitation of Liability
              </h2>
              <div className="text-gray-700 leading-relaxed space-y-3" data-testid="text-liability">
                <p>
                  Signedwork is provided "as is" without warranties of any kind. To the maximum extent permitted by law, 
                  we disclaim all liability for any losses, damages, or consequences arising from:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use of the platform</li>
                  <li>Interactions with other users</li>
                  <li>Work verification disputes</li>
                  <li>Hiring decisions or employment relationships</li>
                  <li>Technical issues or platform downtime</li>
                </ul>
                <p>
                  Our total liability to you for any claims related to Signedwork shall not exceed the amount 
                  you have paid to us in the 12 months preceding the claim.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-changes">
                10. Changes to Terms
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="text-changes">
                We may update these Terms of Service from time to time. When we do, we will notify users through 
                the platform or via email. Your continued use of Signedwork after such changes constitutes your 
                acceptance of the updated terms.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900" data-testid="heading-contact">
                11. Contact Us
              </h2>
              <p className="text-gray-700 leading-relaxed" data-testid="text-contact">
                If you have questions about these Terms of Service, please contact us at: 
                <span className="font-medium"> support@signedwork.com</span>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}