import { ChevronRight } from "lucide-react";
import FooterLinks from "@/components/FooterLinks";

export default function PrivacyPolicy() {
  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neon-cyan">
            <ChevronRight className="w-5 h-5" />
            <span className="text-sm font-semibold">LEGAL</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-foreground/60">Last updated: January 20, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground/80 leading-relaxed">
          {/* 1. Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Zenith ("we," "us," "our," or "Company"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and applications.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, applications, and services (collectively, the "Services").
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
            
            <div className="space-y-4 ml-4 border-l-2 border-neon-cyan/30 pl-4">
              <div>
                <h3 className="font-bold text-foreground mb-2">Personal Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground/70">
                  <li>Name and email address</li>
                  <li>Account credentials (username, password)</li>
                  <li>Profile information (bio, avatar, preferences)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Social media credentials (when you connect accounts)</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground/70">
                  <li>Device information (browser type, IP address, operating system)</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                  <li>Location data (if permitted)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Social Media Integration</h3>
                <p className="text-foreground/70">
                  When you connect your TikTok, Instagram, or Twitter accounts, we receive:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/70 mt-2">
                  <li>Your username and profile information</li>
                  <li>Access to post to your connected accounts (with your permission)</li>
                  <li>Analytics data about your posts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Provide and improve our Services</li>
              <li>Create and manage your account</li>
              <li>Process payments and transactions</li>
              <li>Send service updates and announcements</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Personalize your experience</li>
              <li>Analyze usage patterns and trends</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* 4. Information Sharing */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who help us operate the Services (hosting, payment processing, analytics)
              </li>
              <li>
                <strong>Social Media Platforms:</strong> When you authorize us to access your accounts (TikTok, Instagram, Twitter)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or court order
              </li>
              <li>
                <strong>Business Partners:</strong> With your consent, to provide additional services
              </li>
            </ul>
          </section>

          {/* 5. Data Security */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Encryption of sensitive data (AES-256)</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal information</li>
              <li>Secure storage of authentication credentials</li>
            </ul>
            <p className="text-sm text-foreground/60 mt-4">
              However, no method of transmission is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </section>

          {/* 6. Cookies and Tracking */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience, remember preferences, and analyze usage. You can control cookie settings in your browser.
            </p>
          </section>

          {/* 7. Your Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at: <a href="mailto:privacy@zenith.app" className="text-neon-cyan hover:underline">privacy@zenith.app</a>
            </p>
          </section>

          {/* 8. Data Retention */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our Services and comply with legal obligations. When you delete your account, we remove your data within 30 days, except where we're legally required to retain it.
            </p>
          </section>

          {/* 9. Third-Party Links */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Third-Party Links and Services</h2>
            <p>
              Our Services may contain links to third-party websites and applications. We are not responsible for their privacy practices. We encourage you to review their privacy policies before providing personal information.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Children's Privacy</h2>
            <p>
              Our Services are not intended for children under 13. We do not knowingly collect personal information from children. If we discover we've collected data from a child under 13, we will delete it immediately.
            </p>
          </section>

          {/* 11. California Privacy Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">11. California Privacy Rights (CCPA)</h2>
            <p>
              If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Right to know what personal information is collected</li>
              <li>Right to know whether personal information is sold or disclosed</li>
              <li>Right to delete personal information collected</li>
              <li>Right to opt-out of the sale of personal information</li>
            </ul>
          </section>

          {/* 12. GDPR Compliance */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">12. GDPR Compliance</h2>
            <p>
              If you are in the European Union, your personal data is protected under the General Data Protection Regulation (GDPR). We process your data based on your consent, contractual necessity, or legitimate interests.
            </p>
          </section>

          {/* 13. Updates to This Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">13. Updates to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or through the Services. Your continued use of the Services after updates constitutes acceptance of the revised policy.
            </p>
          </section>

          {/* 14. Contact Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">14. Contact Information</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="font-semibold text-foreground mb-2">Zenith Inc.</p>
              <p className="text-foreground/70">Email: <a href="mailto:privacy@zenith.app" className="text-neon-cyan hover:underline">privacy@zenith.app</a></p>
              <p className="text-foreground/70">Support: <a href="https://zenith.app/contact" className="text-neon-cyan hover:underline">zenith.app/contact</a></p>
            </div>
          </section>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}

