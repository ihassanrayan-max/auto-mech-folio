import SEO from "@/components/SEO";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Github, Linkedin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showFallback, setShowFallback] = useState(false);
  const mailtoRef = useRef<HTMLAnchorElement | null>(null);

  const { data: siteSettings } = useQuery({
    queryKey: ["site_settings", "main"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const contact = (siteSettings as any)?.contact || {};
  const targetEmail = String(contact.email || "hassanrayan126@gmail.com");
  const linkedinUrl = contact.linkedinUrl || "https://www.linkedin.com";
  const githubUrl = contact.githubUrl || "https://github.com";
  const otherLinks: { label: string; url: string }[] = Array.isArray(contact.otherLinks) ? contact.otherLinks : [];

  const buildComposeUrls = (to: string, subject: string, body: string, maxLen = 1800) => {
    const truncateBody = (b: string) => {
      if (b.length <= maxLen) return b;
      const notice = "\n\n(truncated)";
      const base = b;
      // Try decreasing body length until it fits
      for (let len = Math.min(1500, base.length); len >= 100; len -= 100) {
        const truncated = base.slice(0, len) + notice;
        if (truncated.length <= maxLen) return truncated;
      }
      return "(message too long)" + notice;
    };

    const finalBody = truncateBody(body);
    const encodedTo = encodeURIComponent(to);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(finalBody);

    return {
      gmailApp: `googlegmail://co?to=${encodedTo}&subject=${encodedSubject}&body=${encodedBody}`,
      gmailWeb: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`,
      mailto: `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`,
      body: finalBody
    };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowFallback(false);

    // Validation
    const nameValid = name.trim().length >= 1 && name.trim().length <= 100;
    const emailValid = /^.+@.+\..+$/.test(email.trim());
    const messageValid = message.trim().length >= 1 && message.trim().length <= 5000;

    if (!nameValid) return toast({ title: "Invalid name", description: "Please enter 1–100 characters." });
    if (!emailValid) return toast({ title: "Invalid email", description: "Please enter a valid email address." });
    if (!messageValid) return toast({ title: "Invalid message", description: "Please enter 1–5000 characters." });

    const subject = `Inquiry from ${name || "Portfolio Visitor"}`;
    const body = `${message}\n\nFrom: ${name}\nEmail: ${email}`;

    const urls = buildComposeUrls(targetEmail, subject, body);
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    toast({ title: "Opening your email app…", description: "Your compose window should appear shortly." });

    const tryOpen = async (url: string) => {
      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 1000);
        
        if (mailtoRef.current) {
          mailtoRef.current.setAttribute("href", url);
          mailtoRef.current.click();
        } else {
          try {
            window.location.href = url;
          } catch {
            clearTimeout(timeout);
            resolve(false);
            return;
          }
        }
        
        // Check if we still have focus after a brief delay
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(document.hasFocus());
        }, 500);
      });
    };

    let success = false;

    // Try Gmail app on mobile first
    if (isMobile) {
      success = !(await tryOpen(urls.gmailApp));
    }

    // Try Gmail web if app didn't work or not mobile
    if (!success) {
      success = !(await tryOpen(urls.gmailWeb));
    }

    // Try mailto as final fallback
    if (!success) {
      success = !(await tryOpen(urls.mailto));
    }

    // If all failed, show fallback UI
    if (!success) {
      setTimeout(() => {
        if (document.hasFocus()) {
          setShowFallback(true);
        }
      }, 100);
    }
  };

  return (
    <main className="container py-12">
      <SEO
        title="Contact | Mechanical Engineering Portfolio"
        description="Get in touch via the contact form or connect on LinkedIn and GitHub."
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">Contact</h1>
      <section className="grid md:grid-cols-2 gap-8">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="name">Name</label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="message">Message</label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required />
          </div>
          <Button type="submit">Send Message</Button>
          {/* Invisible anchor for mailto trigger */}
          <a ref={mailtoRef} className="sr-only" aria-hidden="true" tabIndex={-1} />

          {showFallback && (
            <div className="mt-4 rounded-lg border p-4">
              <p className="mb-3">Couldn't open your mail app.</p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(targetEmail);
                      toast({ title: "Copied", description: "Email address copied to clipboard." });
                    } catch {
                      toast({ title: "Copy failed", description: targetEmail });
                    }
                  }}
                >
                  Copy email
                </Button>
                <p className="text-sm text-muted-foreground">Email us at {targetEmail} with your message.</p>
              </div>
            </div>
          )}
        </form>
        <aside className="space-y-4 text-muted-foreground">
          <p>Prefer social? Find me here:</p>
          <div className="flex flex-col gap-2">
            <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href={linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Linkedin size={20} /> LinkedIn
            </a>
            <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href={githubUrl} target="_blank" rel="noopener noreferrer">
              <Github size={20} /> GitHub
            </a>
            {otherLinks.map((l, i) => (
              <a key={`${l.label}-${i}`} className="inline-flex items-center gap-2 hover:text-primary transition-colors" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </div>
          <p>I&apos;ll respond promptly to inquiries regarding projects, internships, or collaboration opportunities.</p>
        </aside>
      </section>
    </main>
  );
}
