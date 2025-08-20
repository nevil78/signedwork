import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button 
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Home
              </button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4" data-testid="heading-privacy-title">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2" data-testid="text-last-updated">
            Last updated: August 20, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="prose dark:prose-invert max-w-none">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-introduction">
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-introduction">
                At Signedwork, we respect your privacy and are committed to protecting your personal information. 
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform 
                at signedwork.com.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-collection">
                2. Information We Collect
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4" data-testid="text-collection">
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Name, email address, and phone number</li>
                    <li>Professional information (CV, work experience, education)</li>
                    <li>Work diary entries and project documentation</li>
                    <li>Profile pictures and uploaded documents</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Company Information</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Company name, address, and contact details</li>
                    <li>Job postings and recruitment information</li>
                    <li>Employee verification actions and ratings</li>
                    <li>Business registration and compliance documents</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Usage Data</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Login times and activity history</li>
                    <li>Platform interactions and feature usage</li>
                    <li>Device information and IP addresses</li>
                    <li>Browser type and operating system</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-usage">
                3. How We Use Your Information
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-usage">
                <p className="mb-3">We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Facilitate work verification:</strong> Enable companies to verify employee work and projects</li>
                  <li><strong>Connect talent with opportunities:</strong> Help employees discover relevant job openings</li>
                  <li><strong>Send important notifications:</strong> Account updates, verification status, and security alerts (we never send spam)</li>
                  <li><strong>Improve our platform:</strong> Analyze usage patterns to enhance features and user experience</li>
                  <li><strong>Ensure security:</strong> Detect fraud, prevent abuse, and maintain platform integrity</li>
                  <li><strong>Provide customer support:</strong> Respond to inquiries and resolve technical issues</li>
                </ul>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-sharing">
                4. Data Sharing
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4" data-testid="text-sharing">
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Between Users</h3>
                  <p>
                    Work verification details are shared only between employees and their associated companies. 
                    This includes work diary entries, project documentation, and verification status.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Third Parties</h3>
                  <p>
                    <strong>We never sell your data to third parties.</strong> We may share limited information only in these circumstances:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>With service providers who help us operate the platform (under strict confidentiality agreements)</li>
                    <li>When required by law or legal authorities</li>
                    <li>To protect our rights, safety, or the safety of our users</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-security">
                5. Data Security
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3" data-testid="text-security">
                <p>
                  Signedwork implements industry-standard security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                  <li><strong>Secure storage:</strong> Data is stored in secure, monitored data centers</li>
                  <li><strong>Access controls:</strong> Strict limits on who can access your information</li>
                  <li><strong>Regular security audits:</strong> Ongoing monitoring and security assessments</li>
                </ul>
                <p>
                  <strong>Your responsibility:</strong> You are responsible for maintaining strong, unique passwords 
                  and keeping your login credentials secure.
                </p>
              </div>
            </section>

            {/* Cookies & Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-cookies">
                6. Cookies & Tracking
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3" data-testid="text-cookies">
                <p>
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze platform usage for improvements</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
                <p>
                  You can manage cookies through your browser settings. However, disabling certain cookies 
                  may affect your ability to use some platform features.
                </p>
              </div>
            </section>

            {/* User Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-rights">
                7. Your Rights
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4" data-testid="text-rights">
                
                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Account Management</h3>
                  <p>
                    You can update or correct your personal information (name, email, profile details) 
                    through your account settings at any time.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Account Deletion</h3>
                  <p>
                    You may request account deletion by sending an email to <strong>support@signedwork.com</strong>. 
                    Your request must include:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Your registered email address</li>
                    <li>A clear reason for deletion</li>
                  </ul>
                  <p className="mt-2">
                    <strong>Important:</strong> Account deletion is not automatic. Our admin team reviews each request 
                    and proceeds only if the reason is valid and complies with our policies.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Data Retention</h3>
                  <p>
                    Data related to verified work diaries may be retained as part of company verification records, 
                    even after account deletion, if required for compliance, audit, or legal purposes.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Data Access</h3>
                  <p>
                    You can request a copy of your personal data by contacting us at support@signedwork.com. 
                    We will provide your data in a commonly used, machine-readable format.
                  </p>
                </div>

              </div>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-transfers">
                8. International Data Transfers
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-transfers">
                Your data may be processed and stored in countries other than your own. We ensure that any 
                international transfers comply with applicable data protection laws and include appropriate 
                safeguards to protect your privacy.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-children">
                9. Children's Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-children">
                Signedwork is not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children. If we become aware that we have collected information from 
                a child under 18, we will take steps to delete that information promptly.
              </p>
            </section>

            {/* Changes to Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-policy-changes">
                10. Changes to This Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-policy-changes">
                We may update this Privacy Policy from time to time to reflect changes in our practices or 
                applicable laws. When we make significant changes, we will notify you through the platform 
                or via email. We encourage you to review this policy periodically.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white" data-testid="heading-privacy-contact">
                11. Contact Us
              </h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed" data-testid="text-privacy-contact">
                <p className="mb-3">
                  If you have questions about this Privacy Policy or how we handle your data, please contact us:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p><strong>Email:</strong> support@signedwork.com</p>
                  <p><strong>Subject line:</strong> Privacy Policy Inquiry</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}