import SEO from "@/components/SEO";
import { useState } from "react";
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

  const { data: siteSettings } = useQuery({
    queryKey: ["site_settings", "main"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const contact = (siteSettings as any)?.contact || {};
  const targetEmail = String(contact.email || "your.email@example.com");
  const linkedinUrl = contact.linkedinUrl || "https://www.linkedin.com";
  const githubUrl = contact.githubUrl || "https://github.com";
  const otherLinks: { label: string; url: string }[] = Array.isArray(contact.otherLinks) ? contact.otherLinks : [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Inquiry from ${name || 'Portfolio Visitor'}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    toast({ title: "Thanks!", description: "Your email client is opening. Looking forward to your message." });
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
