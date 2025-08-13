import SEO from "@/components/SEO";
import profileImg from "@/assets/profile-portrait.jpg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/ProjectCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectRow } from "@/types/cms";

const Index = () => {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["projects", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("featured", true)
        .eq("published", true)
        .order("priority", { ascending: false })
        .order("createdAt", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data as unknown as ProjectRow[]) || [];
    },
  });

  const { data: siteSettings } = useQuery({
    queryKey: ["site_settings", "main"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  return (
    <main>
      <SEO
        title="Home | Mechanical Engineering Portfolio"
        description="Portfolio of a mechanical engineering student: projects, skills, and contact."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'Mechanical Engineering Student',
          url: typeof window !== 'undefined' ? window.location.origin : '',
        }}
      />
      <section className="container py-16 md:py-24 grid md:grid-cols-[1.2fr,0.8fr] gap-10 items-center">
        <div className="space-y-6">
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold leading-tight">{(siteSettings as any)?.hero?.headline || "Hi, I’m Alex Chen — Mechanical Engineering Student"}</h1>
          <p className="text-lg text-muted-foreground max-w-prose">
            {(siteSettings as any)?.hero?.subcopy || "I design and build efficient mechanical systems with a focus on robotics, structural analysis, and clean, manufacturable designs."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link to={(siteSettings as any)?.hero?.ctaHref || "/projects"}>{(siteSettings as any)?.hero?.ctaText || "View Projects"}</Link></Button>
            <Button variant="secondary" asChild><Link to="/skills">Explore Skills</Link></Button>
          </div>
        </div>
        <div className="justify-self-center">
          <div className="rounded-xl overflow-hidden shadow-[var(--shadow-elevated)]">
            <img src={profileImg} alt="Professional portrait of the student" className="w-56 h-56 md:w-72 md:h-72 object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {(siteSettings as any)?.homeFeaturedEnabled ? (
        <section className="border-t">
          <div className="container py-12">
            <h2 className="font-heading text-2xl font-semibold mb-6">Featured Projects</h2>
            {isLoading ? (
              <p>Loading featured projects…</p>
            ) : featured && featured.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((p) => {
                  const image = (p.media as any)?.images?.[0] || "/placeholder.svg";
                  return (
                    <ProjectCard
                      key={p.slug}
                      slug={p.slug}
                      title={p.title}
                      summary={p.shortSummary}
                      image={image}
                      imageAlt={`${p.title} hero image`}
                      category={p.category as any}
                      status={p.status as any}
                      tags={p.tags}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">No featured projects yet.</p>
            )}
            <div className="mt-6">
              <Button variant="secondary" asChild>
                <Link to="/projects">View all projects</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t bg-secondary/40">
        <div className="container py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/about" className="p-6 rounded-lg bg-background border hover-scale">
            <h3 className="font-heading font-semibold mb-1">About Me</h3>
            <p className="text-sm text-muted-foreground">Background, education, and activities.</p>
          </Link>
          <Link to="/projects" className="p-6 rounded-lg bg-background border hover-scale">
            <h3 className="font-heading font-semibold mb-1">Projects</h3>
            <p className="text-sm text-muted-foreground">Detailed write-ups with images and outcomes.</p>
          </Link>
          <Link to="/skills" className="p-6 rounded-lg bg-background border hover-scale">
            <h3 className="font-heading font-semibold mb-1">Skills</h3>
            <p className="text-sm text-muted-foreground">Interactive chart and toolchain.</p>
          </Link>
          <Link to="/contact" className="p-6 rounded-lg bg-background border hover-scale">
            <h3 className="font-heading font-semibold mb-1">Contact</h3>
            <p className="text-sm text-muted-foreground">Send a message or connect on socials.</p>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Index;

