import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FooterLinks from "@/components/FooterLinks";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-foreground/60 hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-foreground/60">
            Last Updated: January 18, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground/80">
          {/* 1. Agreement */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Zenith website and services (the "Service"), 
              you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* 2. Use License */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information 
              or software) on Zenith for personal, non-commercial transitory viewing only. This is 
              the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose, or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software on Zenith</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              <li>Using the materials in a way that violates any applicable law or regulation</li>
            </ul>
          </section>

          {/* 3. Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">3. Disclaimer</h2>
            <p>
              The materials on Zenith are provided on an 'as is' basis. Zenith makes no warranties, 
              expressed or implied, and hereby disclaims and negates all other warranties including, 
              without limitation, implied warranties or conditions of merchantability, fitness for a 
              particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          {/* 4. Limitations */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">4. Limitations</h2>
            <p>
              In no event shall Zenith or its suppliers be liable for any damages (including, without 
              limitation, damages for loss of data or profit, or due to business interruption) arising 
              out of the use or inability to use the materials on Zenith, even if Zenith or a Zenith 
              authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          {/* 5. Accuracy of Materials */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Zenith could include technical, typographical, or photographic 
              errors. Zenith does not warrant that any of the materials on its website are accurate, 
              complete, or current. Zenith may make changes to the materials contained on its website 
              at any time without notice.
            </p>
          </section>

          {/* 6. Materials and Links */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">6. Links</h2>
            <p>
              Zenith has not reviewed all of the sites linked to its website and is not responsible 
              for the contents of any such linked site. The inclusion of any link does not imply 
              endorsement by Zenith of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          {/* 7. Modifications */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">7. Modifications</h2>
            <p>
              Zenith may revise these terms of service for its website at any time without notice. 
              By using this website, you are agreeing to be bound by the then current version of 
              these terms of service.
            </p>
          </section>

          {/* 8. Governing Law */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws 
              of the United States, and you irrevocably submit to the exclusive jurisdiction of the 
              courts in that location.
            </p>
          </section>

          {/* 9. User Accounts */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">9. User Accounts</h2>
            <p>
              If you create an account on Zenith, you are responsible for maintaining the 
              confidentiality of your account information and password. You agree to accept 
              responsibility for all activities that occur under your account. You must notify us 
              immediately of any unauthorized use of your account.
            </p>
          </section>

          {/* 10. Payment Terms */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">10. Payment and Billing</h2>
            <p>
              All payments are processed through Paddle. By making a purchase, you agree to Paddle's 
              terms and conditions. All sales are final unless otherwise stated. Refunds are subject 
              to our refund policy. Credits do not expire while you maintain an active account.
            </p>
          </section>

          {/* 11. Content Ownership */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">11. Content Ownership</h2>
            <p>
              All content generated, created, or provided through Zenith (including business plans, 
              social posts, websites, and other materials) is owned by you. We provide the tools to 
              generate this content, but you retain all rights to your generated content.
            </p>
          </section>

          {/* 12. Prohibited Conduct */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">12. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Transmit viruses, malware, or harmful code</li>
              <li>Use automated tools to scrape or collect data</li>
              <li>Engage in any form of fraud or misrepresentation</li>
              <li>Interfere with the operation of the service</li>
            </ul>
          </section>

          {/* 13. Intellectual Property Rights */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">13. Intellectual Property Rights</h2>
            <p>
              The Service and its original content (excluding user-generated content), features, 
              and functionality are owned by Zenith, its licensors, or other providers of such material 
              and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          {/* 14. Termination */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">14. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, 
              without prior notice or liability, for any reason whatsoever, including if you breach 
              the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          {/* 15. Contact Information */}
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">15. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
              <p className="font-semibold">Zenith Support</p>
              <p className="text-sm text-foreground/60">Email: support@zenith.app</p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-foreground/60">
              © 2026 Zenith. All rights reserved. This Terms of Service agreement is effective 
              as of January 18, 2026 and will remain in full force and effect except with respect 
              to any provision that shall be superseded by any subsequent written instrument.
            </p>
          </div>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}

