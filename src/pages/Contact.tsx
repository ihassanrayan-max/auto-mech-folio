import SEO from "@/components/SEO";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Github, Linkedin } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Inquiry from ${name || 'Portfolio Visitor'}`);
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);
    window.location.href = `mailto:your.email@example.com?subject=${subject}&body=${body}`;
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
          <div className="flex gap-3">
            <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href="https://www.linkedin.com" target="_blank" rel="noreferrer">
              <Linkedin size={20} /> LinkedIn
            </a>
            <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href="https://github.com" target="_blank" rel="noreferrer">
              <Github size={20} /> GitHub
            </a>
          </div>
          <p>I'll respond promptly to inquiries regarding projects, internships, or collaboration opportunities.</p>
        </aside>
      </section>
    </main>
  );
}
