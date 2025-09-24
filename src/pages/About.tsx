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
        title="About Me | Humza Muhammad - Mechanical Engineering"
        description="Third-year Mechanical Engineering student at Ontario Tech University specializing in AI applications, robotics, and mechatronics."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About - Humza Muhammad - Mechanical Engineering Portfolio',
        }}
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">About Me</h1>
      <section className="grid md:grid-cols-3 gap-8">
        <article className="md:col-span-2 space-y-6">
          {markdown?.trim() ? (
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{markdown}</ReactMarkdown>
          ) : (
            <>
              <p className="text-lg">
                I'm <strong>Humza Muhammad</strong>, a third-year Mechanical Engineering student at <strong>Ontario Tech University</strong>, specializing in AI applications in engineering, graduating April 2028.
              </p>
              <p>
                I design and build systems that merge mechanical design, embedded electronics, and intelligent software—from robots and drones to AI-assisted tools.
              </p>
              
              <div className="space-y-4">
                <h3 className="font-heading text-xl font-semibold">My experience spans:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Mechanical Design & CAD</strong> – SolidWorks, NX, Fusion 360; assemblies, drawings, GD&T</li>
                  <li><strong className="text-foreground">Analysis & Testing</strong> – Intro FEA, tolerance/fit, prototyping for strength & reliability</li>
                  <li><strong className="text-foreground">Embedded Systems & Controls</strong> – ESP32/Arduino, PWM motor control, sensor fusion (MPU6050, BME280, GPS), PID basics</li>
                  <li><strong className="text-foreground">Programming & Software</strong> – C/C++, Python, MATLAB; web (Next.js/React, Node)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-heading text-xl font-semibold">I've applied these skills to:</h3>
                <div className="grid gap-3">
                  <div className="flex gap-3">
                    <span className="text-2xl">🛠</span>
                    <div>
                      <strong>Autonomous Drone Platform</strong> – ESP32 flight controller, custom wiring, sensor fusion, 3D-printed frame for mapping/survey use-cases
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <strong>Line-Following Robot</strong> – Dual-IR sensing with L298N motor control
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">💻</span>
                    <div>
                      <strong>JobBot (SaaS)</strong> – AI résumé/cover-letter generator with ATS-aware prompts and admin tools
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <strong>Client Sites</strong> – Next.js/Tailwind builds with scheduling/Stripe and simple CMS
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="font-medium">
                  Seeking <strong>Fall 2025 co-op/internship roles</strong> in mechanical design, testing, or mechatronics/controls.
                </p>
              </div>
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
        <aside className="space-y-6">
          <div>
            <h2 className="font-heading text-xl font-semibold mb-3">Education</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">B.S. Mechanical Engineering</strong></p>
              <p>Ontario Tech University</p>
              <p>Expected: April 2028</p>
              <p className="text-sm">Specializing in AI applications in engineering</p>
            </div>
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold mb-3">Relevant Coursework</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground">Core Mechanics</h4>
                <p>Statics, Dynamics, Strength of Materials, Machine Design</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Thermofluids</h4>
                <p>Thermodynamics, Fluid Mechanics, Heat Transfer</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Controls & Mechatronics</h4>
                <p>Signals & Systems, Feedback Control, Mechatronics, Sensors & Instrumentation</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Computing & Data</h4>
                <p>MATLAB & Numerical Methods, Programming (C/C++/Python), Data Analysis</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Design & Manufacturing</h4>
                <p>CAD/CAM, Manufacturing Processes, Tolerancing & GD&T</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">AI/Applied Computing</h4>
                <p>Intro to AI for Engineers, Optimization/Linear Algebra, Basic Computer Vision</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
