import React from "react";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow } from "@/types/cms";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";

export default function CMSProjectDetail() {
  const { slug } = useParams();
  const [project, setProject] = React.useState<ProjectRow | null>(null);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
      if (!data) setNotFound(true);
      setProject(data as any);
    };
    load();
  }, [slug]);

  if (notFound) {
    return (
      <div className="container py-12">
        <SEO title="Project not found" />
        <p>We couldn't find that project.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/cms/projects">Back to Projects</Link></Button>
      </div>
    );
  }

  if (!project) return <div className="container py-12">Loading…</div>;

  const hero = project.media?.images?.[0];

  return (
    <div className="container py-8">
      <SEO title={`${project.title} – Projects`} description={project.shortSummary} />
      {hero && (
        <img src={hero} alt={`${project.title} hero`} loading="eager" className="w-full h-64 object-cover rounded" />
      )}
      <article className="prose prose-slate max-w-none dark:prose-invert mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{project.category}</Badge>
          <span className="text-sm text-muted-foreground">{project.status}</span>
          <span className="text-sm text-muted-foreground">• {new Date(project.dateStarted).toLocaleDateString()} {project.dateCompleted ? `→ ${new Date(project.dateCompleted).toLocaleDateString()}` : ""}</span>
        </div>
        <h1 className="font-heading text-3xl">{project.title}</h1>
        <p className="text-muted-foreground">{project.shortSummary}</p>
        <ReactMarkdown className="mt-4">{project.longDescription || ""}</ReactMarkdown>

        {project.media?.images?.length ? (
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.media.images.map((url) => (
              <img key={url} src={url} alt={`${project.title} image`} loading="lazy" className="w-full h-48 object-cover rounded" />
            ))}
          </section>
        ) : null}

        {(project.githubUrl || (project.externalLinks?.length ?? 0) > 0) && (
          <Card className="mt-8">
            <CardContent className="p-4 space-y-2">
              {project.githubUrl && (
                <a className="underline" href={project.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
              )}
              {project.externalLinks?.map((u) => (
                <div key={u}><a className="underline" href={u} target="_blank" rel="noreferrer">External link</a></div>
              ))}
            </CardContent>
          </Card>
        )}

        <Button asChild variant="outline" className="mt-8"><Link to="/cms/projects">Back to Projects</Link></Button>
      </article>
    </div>
  );
}
