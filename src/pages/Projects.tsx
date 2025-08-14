import SEO from "@/components/SEO";
import ProjectCard from "@/components/ProjectCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectRow } from "@/types/cms";
import { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["projects", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("published", true)
        .eq("isVisible", true)
        .order("priority", { ascending: false })
        .order("createdAt", { ascending: false });
      if (error) throw error;
      return (data as unknown as ProjectRow[]) || [];
    },
  });

  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("priority");
  const [q, setQ] = useState<string>("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const items = (data ?? []);
  const filtered = items.filter((p) => {
    const byCat = category === "all" || p.category === category;
    const byStatus = status === "all" || p.status === status;
    const bySearch = !q || p.title.toLowerCase().includes(q.toLowerCase());
    const byTag = !activeTag || (p.tags ?? []).includes(activeTag);
    return byCat && byStatus && bySearch && byTag;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "priority") return (b.priority ?? 0) - (a.priority ?? 0);
    if (sort === "newest") return new Date(b.dateStarted).getTime() - new Date(a.dateStarted).getTime();
    if (sort === "oldest") return new Date(a.dateStarted).getTime() - new Date(b.dateStarted).getTime();
    return 0;
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
        <>
          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="flex-1">
              <Input
                placeholder="Search title..."
                aria-label="Search projects by title"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Software">Software Combo</SelectItem>
                <SelectItem value="Mini">Mini</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority (desc)</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {activeTag ? (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm">Filtering by tag:</span>
              <Badge variant="secondary">#{activeTag}</Badge>
              <Button variant="outline" size="sm" onClick={() => setActiveTag(null)}>Clear</Button>
            </div>
          ) : null}
          <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((p) => {
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
                  onTagClick={(t) => setActiveTag(t)}
                />
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
