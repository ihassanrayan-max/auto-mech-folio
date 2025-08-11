import { useParams, Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import type { ProjectRow } from "@/types/cms";
import { useQuery } from "@tanstack/react-query";

export default function ProjectDetail() {
  const { slug } = useParams();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ProjectRow) || null;
    },
  });

  if (isLoading) {
    return (
      <main className="container py-12">
        <p>Loading…</p>
      </main>
    );
  }

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
    description: project.shortSummary,
  } as const;

  const hero = (project.media as any)?.images?.[0] || "/placeholder.svg";
  const videoUrl = (project.media as any)?.videoUrl || null;

  return (
    <main className="container py-12">
      <SEO
        title={`${project.title} | Mechanical Engineering Portfolio`}
        description={project.shortSummary}
        jsonLd={jsonLd}
      />
      <article>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
          <Badge variant="secondary">{project.category}</Badge>
          <Badge variant="outline">{project.status}</Badge>
          <span className="ml-2">Started: {new Date(project.dateStarted).toLocaleDateString()}</span>
          <span>{project.dateCompleted ? `Completed: ${new Date(project.dateCompleted).toLocaleDateString()}` : 'Ongoing'}</span>
        </div>
        <img
          src={hero}
          alt={`${project.title} hero image`}
          loading="lazy"
          className="w-full rounded-md shadow-sm mb-6 object-cover max-h-[420px]"
        />
        {project.tags?.length ? (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((s) => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
          </div>
        ) : null}
        {project.shortSummary ? (
          <p className="text-base text-muted-foreground mb-4">{project.shortSummary}</p>
        ) : null}
        {project.longDescription ? (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{project.longDescription}</ReactMarkdown>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          {project.githubUrl ? (
            <Button asChild variant="secondary">
              <a href={project.githubUrl} target="_blank" rel="noreferrer">View on GitHub</a>
            </Button>
          ) : null}
          {Array.isArray(project.externalLinks) && project.externalLinks.length > 0
            ? project.externalLinks.map((u, i) => (
                <Button key={u + i} asChild variant="outline">
                  <a href={u} target="_blank" rel="noreferrer">{new URL(u).hostname.replace("www.", "")}</a>
                </Button>
              ))
            : null}
          {videoUrl ? (
            <Button asChild>
              <a href={videoUrl} target="_blank" rel="noreferrer">Watch Demo</a>
            </Button>
          ) : null}
          <div className="grow" />
          <Button asChild>
            <Link to="/projects">Back to Projects</Link>
          </Button>
        </div>
      </article>
    </main>
  );
}
