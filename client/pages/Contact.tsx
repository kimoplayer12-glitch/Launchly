import { useState } from "react";
import { Mail, MessageSquare, Phone, MapPin, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FooterLinks from "@/components/FooterLinks";

export default function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send email via backend
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormState({
          name: "",
          email: "",
          subject: "",
          message: "",
        });

        // Reset submitted state after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="eyebrow justify-center">Contact</div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">Get in touch</h1>
          <p className="text-base text-foreground/60">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Contact information</h2>

            {/* Email */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-neon-cyan" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <a
                  href="mailto:support@zenith.app"
                  className="text-foreground/60 hover:text-neon-cyan transition-colors"
                >
                  support@zenith.app
                </a>
                <p className="text-sm text-foreground/40 mt-1">
                  We typically respond within 24 hours
                </p>
              </div>
            </div>

            {/* Support Tickets */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-neon-cyan" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Support Tickets</h3>
                <p className="text-foreground/60">
                  Use the form below to create a support ticket
                </p>
                <p className="text-sm text-foreground/40 mt-1">
                  Priority: Standard response
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-neon-cyan" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Phone Support</h3>
                <p className="text-foreground/60">
                  Available for premium customers
                </p>
                <p className="text-sm text-foreground/40 mt-1">
                  Schedule a call in settings
                </p>
              </div>
            </div>

            {/* Office */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-neon-cyan" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Mailing Address</h3>
                <p className="text-foreground/60">
                  Zenith HQ<br />
                  San Francisco, CA<br />
                  United States
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="font-semibold text-foreground mb-3">Business Hours</h3>
              <div className="space-y-2 text-sm text-foreground/60">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 5:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday - Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Send us a message</h2>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Message Sent!
                  </h3>
                  <p className="text-foreground/60 mb-6">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={formState.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                        className="w-full bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formState.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        required
                        className="w-full bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <Input
                      type="text"
                      name="subject"
                      value={formState.subject}
                      onChange={handleInputChange}
                      placeholder="How can we help?"
                      required
                      className="w-full bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <Textarea
                      name="message"
                      value={formState.message}
                      onChange={handleInputChange}
                      placeholder="Tell us more about your inquiry..."
                      required
                      rows={6}
                      className="w-full bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <MessageSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/70">
                      For urgent issues, please include "URGENT" in the subject line. We prioritize urgent requests.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full font-semibold"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </div>

            {/* FAQ Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Frequently asked questions</h3>
              <div className="space-y-3">
                <details className="group cursor-pointer">
                  <summary className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-neon-cyan font-bold text-lg group-open:rotate-45 transition-transform">+</span>
                    <span className="font-semibold text-foreground">How long does it take to get a response?</span>
                  </summary>
                  <p className="text-foreground/60 mt-2 ml-8 pb-3">
                    We typically respond to all inquiries within 24 business hours. Premium customers may receive priority support.
                  </p>
                </details>

                <details className="group cursor-pointer">
                  <summary className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-neon-cyan font-bold text-lg group-open:rotate-45 transition-transform">+</span>
                    <span className="font-semibold text-foreground">Can I schedule a call with your team?</span>
                  </summary>
                  <p className="text-foreground/60 mt-2 ml-8 pb-3">
                    Yes! Premium users can schedule a call through their dashboard under Settings to Support. Free users can request a call by mentioning it in their support message.
                  </p>
                </details>

                <details className="group cursor-pointer">
                  <summary className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-neon-cyan font-bold text-lg group-open:rotate-45 transition-transform">+</span>
                    <span className="font-semibold text-foreground">Do you offer phone support?</span>
                  </summary>
                  <p className="text-foreground/60 mt-2 ml-8 pb-3">
                    Phone support is available to premium customers. You can schedule a call directly in your dashboard or request one when submitting a support ticket.
                  </p>
                </details>

                <details className="group cursor-pointer">
                  <summary className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-neon-cyan font-bold text-lg group-open:rotate-45 transition-transform">+</span>
                    <span className="font-semibold text-foreground">What if I need emergency support?</span>
                  </summary>
                  <p className="text-foreground/60 mt-2 ml-8 pb-3">
                    For urgent issues, mark your message as "URGENT" in the subject line. Our team will prioritize emergency support requests and respond within 4 hours during business hours.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <a
            href="/privacy-policy"
            className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan/50 transition-all"
          >
            <h3 className="font-bold text-foreground group-hover:text-neon-cyan transition-colors">
              Privacy Policy
            </h3>
            <p className="text-sm text-foreground/60 mt-2">
              Learn how we protect your data and privacy
            </p>
          </a>

          <a
            href="/refund-policy"
            className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan/50 transition-all"
          >
            <h3 className="font-bold text-foreground group-hover:text-neon-cyan transition-colors">
              Refund Policy
            </h3>
            <p className="text-sm text-foreground/60 mt-2">
              Understand our refund and cancellation process
            </p>
          </a>

          <a
            href="/terms-of-service"
            className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan/50 transition-all"
          >
            <h3 className="font-bold text-foreground group-hover:text-neon-cyan transition-colors">
              Terms of Service
            </h3>
            <p className="text-sm text-foreground/60 mt-2">
              Review our terms and conditions
            </p>
          </a>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
}




