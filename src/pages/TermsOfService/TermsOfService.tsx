// src/pages/TermsOfService/TermsOfService.tsx
import React from "react";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEOHead } from "@/components/SEOHead";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  usePageTitle('Terms of Service');
  
  return (
    <>
      <SEOHead
        title="Terms of Service - PenguinShift"
        description="PenguinShift Terms of Service - Read our terms and conditions for using our playlist transfer service."
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                Terms of Service
              </h1>
            </div>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Content Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 space-y-8"
          >
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using PenguinShift ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                PenguinShift is a service that allows you to transfer music playlists between different music streaming platforms, including but not limited to Spotify and YouTube Music. The Service:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Facilitates the transfer of playlist data between platforms</li>
                <li>Uses matching algorithms to find corresponding tracks</li>
                <li>Creates new playlists on destination platforms</li>
                <li>Provides tools for managing and sharing playlists</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">3.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Account Eligibility</h3>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 13 years old to use the Service. By using the Service, you represent that you meet this age requirement and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Platform Integration</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Our Service integrates with third-party music platforms (e.g., Spotify, YouTube Music) through OAuth authentication. By connecting your accounts:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>You authorize us to access your playlists and related data</li>
                <li>You agree to comply with the terms of service of those platforms</li>
                <li>You understand that we only access data necessary for the transfer service</li>
                <li>You can disconnect your accounts at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We are not responsible for the policies, practices, or content of third-party platforms. Your use of those platforms is subject to their respective terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Violate or infringe upon the rights of others (including intellectual property rights)</li>
                <li>Transmit any harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems (bots, scrapers) to access the Service without permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Create multiple accounts to circumvent restrictions or abuse the Service</li>
                <li>Share or distribute your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">6.1 Our Content</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                The Service, including its design, features, and content, is owned by PenguinShift and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Your Content</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                You retain ownership of your playlists and content. By using the Service, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access and process your playlists to provide the transfer service</li>
                <li>Display your playlists (if you choose to make them public)</li>
                <li>Use anonymized, aggregated data for service improvement</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Third-Party Content</h3>
              <p className="text-gray-700 leading-relaxed">
                Music tracks, album art, and other content from music platforms remain the property of their respective owners. We do not claim ownership of this content.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability and Modifications</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We strive to provide reliable service but cannot guarantee:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Uninterrupted or error-free operation</li>
                <li>100% accuracy in track matching</li>
                <li>Compatibility with all playlists or platforms</li>
                <li>Availability at all times</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We are not liable for any loss or inconvenience resulting from such actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind</li>
                <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
                <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
                <li>Our total liability is limited to the amount you paid for the Service (if any) in the past 12 months</li>
                <li>We are not responsible for data loss, service interruptions, or third-party platform issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless PenguinShift and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent, harmful, or illegal activity</li>
                <li>Extended periods of inactivity</li>
                <li>At our discretion for any reason</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You may terminate your account at any time by contacting us or using account deletion features. Upon termination, your right to use the Service ceases immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms are governed by the laws of the jurisdiction in which PenguinShift operates. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration or in the appropriate courts, as applicable by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. General Provisions</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and PenguinShift</li>
                <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect</li>
                <li><strong>Waiver:</strong> Our failure to enforce any right does not constitute a waiver</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our consent; we may assign them freely</li>
                <li><strong>Contact:</strong> For questions about these Terms, contact us at{" "}
                  <a href="mailto:penguinshift42@gmail.com" className="text-purple-600 hover:text-purple-700 underline">
                    penguinshift42@gmail.com
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Email:{" "}
                <a href="mailto:penguinshift42@gmail.com" className="text-purple-600 hover:text-purple-700 underline">
                  penguinshift42@gmail.com
                </a>
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </>
  );
}

