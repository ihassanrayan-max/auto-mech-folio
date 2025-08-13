import SEO from "@/components/SEO";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { AspectRatio } from "@/components/ui/aspect-ratio";

function getSafeEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let id = "";
      if (host.includes("youtu.be")) id = u.pathname.slice(1);
      else id = u.searchParams.get("v") || "";
      if (!id) return null;
      return `https://www.youtube.com/embed/${id}`;
    }
    if (host.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default function About() {
  const { data: siteSettings } = useQuery({
    queryKey: ["site_settings", "main"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const about = (siteSettings as any)?.about || {};
  const markdown: string = about.markdown || "";
  const gallery: string[] = Array.isArray(about.gallery) ? about.gallery : [];
  const videoUrl = getSafeEmbedUrl(about.videoUrl);

  return (
    <main className="container py-12">
      <SEO
        title="About Me | Mechanical Engineering Portfolio"
        description="Biography, education, and extracurriculars of a mechanical engineering student."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About - Mechanical Engineering Portfolio',
        }}
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">About Me</h1>
      <section className="grid md:grid-cols-3 gap-8">
        <article className="md:col-span-2 space-y-4">
          {markdown?.trim() ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
          ) : (
            <>
              <p>
                I am a mechanical engineering student passionate about designing efficient, reliable systems—from precise robotic mechanisms to scalable industrial automation. I enjoy solving open-ended problems and turning ideas into prototypes.
              </p>
              <p>
                My interests include robotics, mechatronics, structural analysis, and sustainable energy systems. I thrive in multidisciplinary teams and love learning new tools and methods.
              </p>
            </>
          )}

          {videoUrl && (
            <div className="mt-6">
              <AspectRatio ratio={16/9}>
                <iframe
                  src={videoUrl}
                  title="About video"
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  referrerPolicy="no-referrer"
                  allowFullScreen
                  className="w-full h-full rounded-md border"
                />
              </AspectRatio>
            </div>
          )}

          {gallery.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((url: string, i: number) => (
                <img key={`${url}-${i}`} src={url} alt={`About gallery image ${i+1}`} className="w-full h-40 object-cover rounded" loading="lazy" />
              ))}
            </div>
          )}
        </article>
        <aside className="space-y-4">
          <div>
            <h2 className="font-heading text-xl mb-2">Education</h2>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>B.S. Mechanical Engineering — University of XYZ (Expected 2026)</li>
              <li>Relevant Coursework: Dynamics, Controls, Machine Design, Thermodynamics, FEA, CFD</li>
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-xl mb-2">Extracurriculars</h2>
            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Robotics Club — Mechanical Lead</li>
              <li>Formula Student — Chassis & Aerodynamics</li>
              <li>Maker Society — 3D Printing & Rapid Prototyping</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
