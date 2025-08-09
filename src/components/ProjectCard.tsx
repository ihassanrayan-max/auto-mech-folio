import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProjectCardProps = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
};

export default function ProjectCard({ slug, title, summary, image, imageAlt }: ProjectCardProps) {
  return (
    <Card className="overflow-hidden hover-scale shadow-sm hover:shadow-md transition-shadow">
      <img src={image} alt={imageAlt} loading="lazy" className="w-full h-48 object-cover" />
      <CardHeader>
        <CardTitle className="font-heading text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{summary}</p>
        <Button asChild>
          <Link to={`/projects/${slug}`}>Learn More</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
