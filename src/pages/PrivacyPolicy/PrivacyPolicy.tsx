// src/pages/PrivacyPolicy/PrivacyPolicy.tsx
import React from "react";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEOHead } from "@/components/SEOHead";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  usePageTitle('Privacy Policy');
  
  return (
    <>
      <SEOHead
        title="Privacy Policy - PenguinShift"
        description="PenguinShift Privacy Policy - Learn how we collect, use, and protect your personal information."
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
              <Shield className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                Privacy Policy
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to PenguinShift ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience while using our service to transfer playlists between music platforms.
              </p>
              <p className="text-gray-700 leading-relaxed">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. Please read this policy carefully to understand our practices regarding your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Account information (username, email address, password)</li>
                <li>Profile information you choose to provide</li>
                <li>Communications with us (support requests, feedback)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Information from Third-Party Services</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you connect your music platform accounts (Spotify, YouTube Music), we access:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Playlist information (names, tracks, metadata)</li>
                <li>Account information necessary for authentication</li>
                <li>OAuth tokens for accessing your playlists</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                We only access data necessary to provide our transfer service. We do not access or store your payment information, personal messages, or other sensitive data from these platforms.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, features used, transfer history)</li>
                <li>IP address and location data (for security and analytics)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and complete playlist transfers</li>
                <li>Authenticate your accounts with music platforms</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Detect, prevent, and address technical issues and security threats</li>
                <li>Comply with legal obligations and enforce our terms</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our service (e.g., hosting, analytics, email services)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, or that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication protocols (OAuth 2.0)</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure storage of OAuth tokens</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Update or correct your account information</li>
                <li>Delete your account and associated data</li>
                <li>Disconnect your music platform accounts</li>
                <li>Opt-out of non-essential communications</li>
                <li>Request a copy of your data</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:penguinshift42@gmail.com" className="text-purple-600 hover:text-purple-700 underline">
                  penguinshift42@gmail.com
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist with security. You can control cookies through your browser settings, but disabling cookies may affect some functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                Our service integrates with third-party platforms (Spotify, YouTube Music, Google OAuth). These services have their own privacy policies, and we encourage you to review them:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>
                  <a href="https://www.spotify.com/us/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">
                    Spotify Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">
                    Google Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 underline">
                    Google Terms of Service
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our service after changes become effective constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
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

