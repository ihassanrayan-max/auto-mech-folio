import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Category, Status } from "@/types/cms";

type ProjectCardProps = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  category?: Category;
  status?: Status;
  tags?: string[];
  onTagClick?: (tag: string) => void;
  hasVideo?: boolean;
  hasCAD?: boolean;
};

export default function ProjectCard({ slug, title, summary, image, imageAlt, category, status, tags, onTagClick, hasVideo, hasCAD }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden hover-scale shadow-sm hover:shadow-md transition-shadow">
      <img src={image} alt={imageAlt} loading="lazy" className="w-full h-48 object-cover" />
      <CardHeader>
        {(category || status || hasVideo || hasCAD) && (
          <div className="flex flex-wrap gap-2 mb-1">
            {category ? <Badge variant="secondary">{category}</Badge> : null}
            {status ? <Badge variant="outline">{status}</Badge> : null}
            {hasVideo ? <Badge variant="outline" className="text-xs">Video</Badge> : null}
            {hasCAD ? <Badge variant="outline" className="text-xs">CAD</Badge> : null}
          </div>
        )}
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{summary}</p>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTagClick?.(t)}
                className="rounded-full border px-2.5 py-0.5 text-xs text-foreground hover:bg-accent"
                aria-label={`Filter by tag ${t}`}
                title={`Filter by ${t}`}
              >
                #{t}
              </button>
            ))}
          </div>
        ) : null}
        <Button asChild>
          <Link to={`/projects/${slug}`}>Learn More</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
