import { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, ProjectRow } from "@/types/cms";
import { supabase } from "@/lib/supabaseClient";
import { Link, useSearchParams } from "react-router-dom";

const categories: ("All" | Category)[] = ["All", "Mechanical", "Electrical", "Software", "Mini"];

export default function CMSProjectsList() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [q, setQ] = useState(params.get("q") || "");
  const [cat, setCat] = useState<(typeof categories)[number]>(
    (params.get("category") as any) || "All"
  );
  const [page, setPage] = useState(parseInt(params.get("page") || "1", 10));

  useEffect(() => {
    const load = async () => {
      const from = (page - 1) * 12;
      const to = from + 11;
      let query = supabase
        .from("projects")
        .select("*", { count: "exact" })
        .order("priority", { ascending: false })
        .order("createdAt", { ascending: false })
        .range(from, to);
      if (cat !== "All") query = query.eq("category", cat);
      const { data } = await query;
      setItems((data as any) ?? []);
    };
    load();
  }, [cat, page]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (cat && cat !== "All") next.set("category", String(cat));
    if (page > 1) next.set("page", String(page));
    setParams(next, { replace: true });
  }, [q, cat, page]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return items.filter((p) => !term || p.title.toLowerCase().includes(term) || p.shortSummary.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <div className="container py-8">
      <SEO title="Projects" description="Projects CMS listing" />
      <Card className="mb-4">
        <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Category</span>
            <Select value={cat} onValueChange={(v) => setCat(v as any)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="sm:ml-auto w-full sm:w-64" />
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <article key={p.id} className="border rounded-lg overflow-hidden">
            {p.media?.images?.length ? (
              <img src={p.media.images[0]} alt={`${p.title} thumbnail`} loading="lazy" className="w-full h-44 object-cover" />
            ) : null}
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{p.category}</Badge>
                {p.tags?.slice(0, 2).map((t) => (<Badge key={t} variant="outline">{t}</Badge>))}
              </div>
              <h3 className="font-heading text-lg">{p.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{p.shortSummary}</p>
              <Button asChild size="sm" className="mt-2">
                <Link to={`/cms/projects/${p.slug}`}>Learn More</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
