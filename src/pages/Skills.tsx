import SEO from "@/components/SEO";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const data = [
  { skill: "CAD", value: 85 },
  { skill: "FEA", value: 78 },
  { skill: "CFD", value: 72 },
  { skill: "Controls", value: 70 },
  { skill: "Manufacturing", value: 76 },
  { skill: "Programming", value: 68 },
];

export default function Skills() {
  const { data: siteSettings } = useQuery({
    queryKey: ["site_settings", "main"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const skills: { name: string; level: number }[] = Array.isArray((siteSettings as any)?.skills)
    ? (siteSettings as any).skills
    : [];

  return (
    <main className="container py-12">
      <SEO
        title="Skills | Mechanical Engineering Portfolio"
        description="Key technical skills, software proficiencies, and coursework presented as an interactive chart."
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">Skills</h1>
      <p className="text-muted-foreground mb-8">An overview of my core technical strengths and tooling.</p>
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="min-h-[20rem]">
          {skills.length > 0 ? (
            <div className="space-y-5">
              {skills.map((s, i) => (
                <div key={`${s.name}-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-sm text-muted-foreground">{Math.max(0, Math.min(100, Number(s.level))).toFixed(0)}%</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, Number(s.level)))} />
                </div>
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={data} outerRadius={110}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="space-y-4 text-muted-foreground">
          <h2 className="font-heading text-xl text-foreground">Software & Tools</h2>
          <ul className="list-disc pl-5">
            <li>SolidWorks, Fusion 360</li>
            <li>Ansys (Mechanical/Fluent)</li>
            <li>MATLAB, Python</li>
            <li>Altium, Arduino, PLCs</li>
          </ul>
          <h2 className="font-heading text-xl text-foreground">Relevant Coursework</h2>
          <ul className="list-disc pl-5">
            <li>Dynamics, Vibrations, Control Systems</li>
            <li>Machine Design, Materials</li>
            <li>Heat Transfer, Fluid Mechanics</li>
            <li>Manufacturing Processes</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
