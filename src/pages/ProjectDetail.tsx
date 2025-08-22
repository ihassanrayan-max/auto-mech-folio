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
        .eq("isVisible", true)
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
  const videos = (project.media as any)?.videos || [];
  const cadFiles = (project.media as any)?.cad || [];
  const driveUrl = (project.media as any)?.driveUrl || null;

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
        
        {videos.length > 0 && (
          <section className="mt-8">
            <h2 className="font-heading text-2xl font-bold mb-4">Videos</h2>
            <div className="space-y-4">
              {videos.map((video: any, i: number) => (
                <div key={i} className="space-y-2">
                  <video 
                    controls 
                    preload="metadata" 
                    poster={video.posterUrl} 
                    className="w-full max-h-96 rounded"
                  >
                    <source src={video.url} type={video.mime} />
                    Your browser does not support the video tag.
                  </video>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{video.mime.split('/')[1]}</Badge>
                    <a 
                      href={video.url} 
                      download={video.filename}
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      Download {video.filename}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {cadFiles.length > 0 && (
          <section className="mt-8">
            <h2 className="font-heading text-2xl font-bold mb-4">CAD Files</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cadFiles.map((cad: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-medium truncate">{cad.filename}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{cad.kind.toUpperCase()}</Badge>
                    <Button size="sm" asChild>
                      <a 
                        href={cad.url} 
                        download={cad.filename}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {driveUrl && (
          <section className="mt-8">
            <Button asChild variant="outline">
              <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.26 10.5L12 4.76l5.74 5.74H6.26zm11.48 0l-5.74 5.74-5.74-5.74h11.48z"/>
                </svg>
                View CAD folder on Drive
              </a>
            </Button>
          </section>
        )}
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
