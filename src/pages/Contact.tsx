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
      const { data, error } = await supabase.rpc("get_public_site_settings");
      if (error) throw error;
      return data as any;
    },
  });

  const contact = (siteSettings as any)?.contact || {};
  const targetEmail = String(contact.email || "hassanrayan126@gmail.com");
  const linkedinUrl = contact.linkedinUrl || "https://www.linkedin.com";
  const githubUrl = contact.githubUrl || "https://github.com";
  const otherLinks: { label: string; url: string }[] = Array.isArray(contact.otherLinks) ? contact.otherLinks : [];

  const buildMailtoUrl = (to: string, name: string, email: string, message: string, maxLen = 1800) => {
    const subject = `Portfolio message from ${name}`;
    const body = `From: ${name} (${email})\n\nMessage:\n${message}`;
    
    const encodedTo = encodeURIComponent(to);
    const encodedSubject = encodeURIComponent(subject);
    
    // Build full URL to check length
    let encodedBody = encodeURIComponent(body);
    let mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Truncate body if URL is too long
    if (mailtoUrl.length > maxLen) {
      const notice = "\n\n(truncated)";
      const available = maxLen - `mailto:${encodedTo}?subject=${encodedSubject}&body=`.length - encodeURIComponent(notice).length;
      
      // Try decreasing body length until it fits
      for (let len = Math.min(1500, body.length); len >= 100; len -= 100) {
        const truncated = body.slice(0, len) + notice;
        encodedBody = encodeURIComponent(truncated);
        mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
        if (mailtoUrl.length <= maxLen) break;
      }
    }
    
    return {
      mailto: mailtoUrl,
      gmailWeb: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`
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

    const urls = buildMailtoUrl(targetEmail, name.trim(), email.trim(), message.trim());

    toast({ title: "Opening your email app…", description: "Your compose window should appear shortly." });

    // Single mailto attempt with smart detection
    let success = false;
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // Assume blocked if still visible after timeout
        setShowFallback(true);
      }
    }, 1500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !resolved) {
        resolved = true;
        success = true;
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
      }
    };

    const handleBlur = () => {
      if (!resolved) {
        resolved = true;
        success = true;
        clearTimeout(timeout);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Trigger mailto
    if (mailtoRef.current) {
      mailtoRef.current.setAttribute("href", urls.mailto);
      mailtoRef.current.removeAttribute("target");
      mailtoRef.current.removeAttribute("rel");
      mailtoRef.current.click();
    }
  };

  const openGmailWeb = () => {
    const urls = buildMailtoUrl(targetEmail, name.trim(), email.trim(), message.trim());
    if (mailtoRef.current) {
      mailtoRef.current.setAttribute("href", urls.gmailWeb);
      mailtoRef.current.setAttribute("target", "_blank");
      mailtoRef.current.setAttribute("rel", "noopener");
      mailtoRef.current.click();
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
              <div className="flex flex-col sm:flex-row gap-3">
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={openGmailWeb}
                >
                  Open Gmail (web)
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Email us at {targetEmail} with your message.</p>
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
