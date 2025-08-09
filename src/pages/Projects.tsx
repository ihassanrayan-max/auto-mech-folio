import SEO from "@/components/SEO";
import ProjectCard from "@/components/ProjectCard";
import { projects } from "@/data/projects";

export default function Projects() {
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
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <ProjectCard key={p.slug} slug={p.slug} title={p.title} summary={p.summary} image={p.image} imageAlt={p.imageAlt} />
        ))}
      </section>
    </main>
  );
}
