import { ChevronRight } from "lucide-react";
import FooterLinks from "@/components/FooterLinks";

export default function RefundPolicy() {
  return (
    <div className="page-shell">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-neon-cyan">
            <ChevronRight className="w-5 h-5" />
            <span className="text-sm font-semibold">LEGAL</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">Refund Policy</h1>
          <p className="text-foreground/60">Last updated: January 20, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground/80 leading-relaxed">
          {/* 1. Overview */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Overview</h2>
            <p>
              At Zenith, we want you to be completely satisfied with your purchase. This Refund Policy explains our refund process and your rights as a customer.
            </p>
          </section>

          {/* 2. Credit Purchases */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Credit Purchases</h2>
            <p>Credits are digital products that are consumed when you use our Services.</p>
            
            <div className="space-y-4 ml-4 border-l-2 border-neon-cyan/30 pl-4">
              <div>
                <h3 className="font-bold text-foreground mb-2">Refund Eligibility</h3>
                <ul className="list-disc list-inside space-y-2 text-foreground/70">
                  <li><strong>Unused Credits:</strong> 100% refund within 30 days of purchase</li>
                  <li><strong>Partially Used Credits:</strong> Refund for unused portion within 30 days</li>
                  <li><strong>Fully Used Credits:</strong> Non-refundable (you received the service)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">How to Request a Refund</h3>
                <ol className="list-decimal list-inside space-y-2 text-foreground/70">
                  <li>Go to your Account Settings → Billing → Order History</li>
                  <li>Find the credit purchase you want to refund</li>
                  <li>Click "Request Refund"</li>
                  <li>Provide a reason (optional)</li>
                  <li>Submit your request</li>
                  <li>We'll process within 3-5 business days</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Refund Method</h3>
                <p className="text-foreground/70">
                  Refunds will be returned to your original payment method. Processing time:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground/70 mt-2">
                  <li><strong>Credit Card:</strong> 3-5 business days</li>
                  <li><strong>PayPal:</strong> 1-2 business days</li>
                  <li><strong>Bank Transfer:</strong> 5-7 business days</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Subscriptions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Subscription Refunds</h2>
            
            <div className="space-y-4 ml-4 border-l-2 border-neon-cyan/30 pl-4">
              <div>
                <h3 className="font-bold text-foreground mb-2">Money-Back Guarantee</h3>
                <p className="text-foreground/70">
                  We offer a 14-day money-back guarantee on all subscription plans. If you're not satisfied with your subscription, you can request a full refund within 14 days of purchase.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Cancellation & Refund Process</h3>
                <ol className="list-decimal list-inside space-y-2 text-foreground/70">
                  <li>Go to Account Settings → Subscriptions</li>
                  <li>Click "Cancel Subscription"</li>
                  <li>Select "Request Refund" if within 14 days</li>
                  <li>Confirm cancellation</li>
                  <li>Refund processed within 3-5 business days</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Recurring Charges</h3>
                <p className="text-foreground/70">
                  If you cancel your subscription, you will not be charged again. Your access continues until the end of the current billing period, then terminates automatically. No refund for the remainder of the billing period after cancellation.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Exceptions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Refund Exceptions</h2>
            <p>The following are generally non-refundable:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Credits used for posting content</li>
              <li>Subscription plans canceled after 14 days</li>
              <li>Purchases made with fraudulent payment methods</li>
              <li>Accounts suspended for violation of Terms of Service</li>
              <li>Credits purchased as gifts (after 30 days)</li>
              <li>Promotional or discount credits</li>
            </ul>
          </section>

          {/* 5. Fraud Prevention */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Fraud Prevention & Abuse</h2>
            <p>
              We reserve the right to deny refunds if we detect suspicious activity, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Multiple refund requests from the same account</li>
              <li>Refund abuse patterns</li>
              <li>Fraudulent payment methods</li>
              <li>Violation of Terms of Service</li>
              <li>Chargebacks or payment disputes</li>
            </ul>
          </section>

          {/* 6. Chargeback Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Chargeback Policy</h2>
            <p>
              If you dispute a charge through your bank or payment provider (chargeback) instead of requesting a refund through our system, we will:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Suspend your account immediately</li>
              <li>Deactivate all credits and subscriptions</li>
              <li>Charge a $25 chargeback processing fee</li>
              <li>Require resolution before reactivation</li>
            </ul>
            <p className="mt-4 text-sm bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-4">
              Please contact our support team first if you have billing issues. Chargebacks should be a last resort.
            </p>
          </section>

          {/* 7. Business Plan Refunds */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Business Plan Refunds</h2>
            <p>
              Custom business plans are non-refundable after the initial 14-day trial period. Refunds for business plans must be requested in writing within 14 days of purchase.
            </p>
          </section>

          {/* 8. No-Refund Situations */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. When We Cannot Refund</h2>
            <p>We cannot process refunds for:</p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li>Requests made more than 30 days after purchase</li>
              <li>Accounts with Terms of Service violations</li>
              <li>Refunds that were already processed</li>
              <li>Amounts less than $1</li>
              <li>Premium features used after purchase (non-refundable features)</li>
            </ul>
          </section>

          {/* 9. How to Request a Refund */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. How to Request a Refund</h2>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-bold text-foreground mb-2">Option 1: Self-Service (Easiest)</h3>
                <ol className="list-decimal list-inside space-y-2 text-foreground/70">
                  <li>Log into your Zenith account</li>
                  <li>Go to Settings → Billing</li>
                  <li>Find your purchase</li>
                  <li>Click "Request Refund"</li>
                  <li>Follow the prompts</li>
                </ol>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">Option 2: Support Team</h3>
                <p className="text-foreground/70 mb-2">Email us at: <a href="mailto:support@zenith.app" className="text-neon-cyan hover:underline">support@zenith.app</a></p>
                <p className="text-foreground/70">Include:</p>
                <ul className="list-disc list-inside space-y-1 text-foreground/70 mt-1">
                  <li>Your account email</li>
                  <li>Order number</li>
                  <li>Purchase date</li>
                  <li>Reason for refund</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 10. Refund Status */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Track Your Refund Status</h2>
            <p>
              Once you request a refund, you can track its status in your account:
            </p>
            <ul className="list-disc list-inside space-y-2 text-foreground/70 ml-4">
              <li><strong>Pending:</strong> We received your request and are reviewing</li>
              <li><strong>Approved:</strong> Refund has been processed</li>
              <li><strong>Completed:</strong> Money has been sent to your payment method</li>
              <li><strong>Denied:</strong> Refund was not eligible</li>
            </ul>
          </section>

          {/* 11. Questions? */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">11. Questions About Refunds?</h2>
            <p>
              If you have questions about our refund policy or need help, contact us at:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="font-semibold text-foreground mb-2">Zenith Support</p>
              <p className="text-foreground/70">Email: <a href="mailto:support@zenith.app" className="text-neon-cyan hover:underline">support@zenith.app</a></p>
              <p className="text-foreground/70">Hours: 9 AM - 5 PM EST, Monday - Friday</p>
              <p className="text-foreground/70">Response time: Usually within 24 hours</p>
            </div>
          </section>

          {/* 12. Policy Changes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">12. Changes to This Policy</h2>
            <p>
              We may update this Refund Policy periodically. Significant changes will be communicated via email. Your continued use of our Services constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}

