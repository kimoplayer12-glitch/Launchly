import { useState } from "react";
import { Mail, MessageSquare, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FooterLinks from "@/components/FooterLinks";

export default function Contact() {
const [formState, setFormState] = useState({ name: "", email: "", subject: "", message: "" });
const [submitted, setSubmitted] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError("");
setLoading(true);
try {
const response = await fetch("/api/contact", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(formState),
});
if (response.ok) {
setSubmitted(true);
setFormState({ name: "", email: "", subject: "", message: "" });
setTimeout(() => setSubmitted(false), 5000);
} else {
throw new Error("Failed to send message");
}
} catch {
setError("Failed to send message. Please try emailing us directly.");
} finally {
setLoading(false);
}
};

return (
<div className="page-shell">
<div className="max-w-5xl mx-auto px-3 sm:px-0 space-y-10 sm:space-y-16">
<div className="space-y-3 sm:space-y-4 text-center">
<div className="eyebrow justify-center">Contact</div>
<h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Get in touch</h1>
<p className="text-sm sm:text-base text-foreground/60 max-w-xl mx-auto">
Have questions? Send us a message and we'll respond within 24 hours.
</p>
</div>

    <div className="grid lg:grid-cols-3 gap-8 sm:gap-12">
      {/* Contact Info */}
      <div className="space-y-5 sm:space-y-6">
        <h2 className="text-base sm:text-xl font-semibold">Contact information</h2>

        <div className="flex gap-4">
          <div className="w-10 h-10 bg-neon-cyan/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Email</h3>
            <a href="mailto:support@launchly.app" className="text-foreground/60 hover:text-neon-cyan transition-colors text-sm">
              support@launchly.app
            </a>
            <p className="text-xs text-foreground/40 mt-1">Response within 24 hours</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-10 h-10 bg-neon-cyan/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base mb-1">Support Tickets</h3>
            <p className="text-foreground/60 text-sm">Use the form to create a ticket</p>
            <p className="text-xs text-foreground/40 mt-1">Standard response time</p>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
          <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Business Hours</h3>
          <div className="space-y-1.5 text-xs sm:text-sm text-foreground/60">
            <div className="flex justify-between">
              <span>Mon – Fri</span>
              <span>9 AM – 5 PM EST</span>
            </div>
            <div className="flex justify-between">
              <span>Sat – Sun</span>
              <span>Closed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="lg:col-span-2">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h2 className="text-base sm:text-xl font-semibold mb-5 sm:mb-6">Send us a message</h2>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-center">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Message Sent!</h3>
              <p className="text-foreground/60 text-sm mb-5">We'll get back to you within 24 hours.</p>
              <Button onClick={() => setSubmitted(false)} variant="outline" size="sm">Send Another</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                  <Input type="text" name="name" value={formState.name} onChange={handleInputChange} placeholder="John Doe" required className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                  <Input type="email" name="email" value={formState.email} onChange={handleInputChange} placeholder="john@example.com" required className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <Input type="text" name="subject" value={formState.subject} onChange={handleInputChange} placeholder="How can we help?" required className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message</label>
                <Textarea name="message" value={formState.message} onChange={handleInputChange} placeholder="Tell us more about your inquiry..." required rows={5} className="bg-white/5 border-white/10 text-foreground placeholder:text-foreground/40 resize-none text-sm" />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full text-sm">
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>

    {/* Resources */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
      {[
        { href: "/privacy-policy", title: "Privacy Policy", desc: "How we protect your data" },
        { href: "/refund-policy", title: "Refund Policy", desc: "Our refund and cancellation process" },
        { href: "/terms-of-service", title: "Terms of Service", desc: "Our terms and conditions" },
      ].map((link) => (
        <a key={link.href} href={link.href} className="group p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-cyan/50 transition-all">
          <h3 className="font-bold text-sm sm:text-base group-hover:text-neon-cyan transition-colors">{link.title}</h3>
          <p className="text-xs sm:text-sm text-foreground/60 mt-1">{link.desc}</p>
        </a>
      ))}
    </div>

    <FooterLinks />
  </div>
</div>

);
}
