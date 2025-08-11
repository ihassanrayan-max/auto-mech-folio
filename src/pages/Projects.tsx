import SEO from "@/components/SEO";
import ProjectCard from "@/components/ProjectCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectRow } from "@/types/cms";

export default function Projects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("priority", { ascending: false })
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return (data as unknown as ProjectRow[]) || [];
    },
  });

  return (
    <main className="container py-12">
      <SEO
        title="Projects | Mechanical Engineering Portfolio"
        description="Five mechanical engineering projects with images, methods, and outcomes."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Projects - Mechanical Engineering Portfolio',
        }}
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">Projects</h1>
      <p className="text-muted-foreground mb-8">A selection of my recent engineering work spanning robotics, analysis, and automation.</p>
      {isLoading ? (
        <p>Loading projects…</p>
      ) : error ? (
        <p className="text-destructive">Failed to load projects.</p>
      ) : (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data!.map((p) => {
            const image = (p.media as any)?.images?.[0] || "/placeholder.svg";
            return (
              <ProjectCard
                key={p.slug}
                slug={p.slug}
                title={p.title}
                summary={p.shortSummary}
                image={image}
                imageAlt={`${p.title} hero image`}
              />
            );
          })}
        </section>
      )}
    </main>
  );
}
