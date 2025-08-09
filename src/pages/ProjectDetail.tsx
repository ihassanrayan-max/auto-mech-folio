import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { getProjectBySlug } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProjectBySlug(slug || "");

  if (!project) {
    return (
      <main className="container py-12">
        <h1 className="font-heading text-3xl font-bold mb-4">Project Not Found</h1>
        <Button asChild><Link to="/projects">Back to Projects</Link></Button>
      </main>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
  };

  return (
    <main className="container py-12">
      <SEO
        title={`${project.title} | Mechanical Engineering Portfolio`}
        description={project.summary}
        jsonLd={jsonLd}
      />
      <article>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{project.title}</h1>
        <img
          src={project.image}
          alt={project.imageAlt}
          loading="lazy"
          className="w-full rounded-md shadow-sm mb-6 object-cover max-h-[420px]"
        />
        <div className="flex flex-wrap gap-2 mb-6">
          {project.skills.map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
        <div className="space-y-4 text-muted-foreground">
          {project.description.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>
        <div className="mt-6">
          <h2 className="font-heading text-xl mb-2">Outcomes</h2>
          <ul className="list-disc pl-5 text-muted-foreground">
            {project.outcomes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <Button asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      </article>
    </main>
  );
}
