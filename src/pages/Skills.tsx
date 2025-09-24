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
      const { data, error } = await supabase.rpc("get_public_site_settings");
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
        title="Skills | Humza Muhammad - Mechanical Engineering"
        description="Core technical skills in CAD, FEA, embedded systems, programming, and mechatronics with relevant coursework."
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-6">Skills</h1>
      <p className="text-muted-foreground mb-8">An overview of my core technical strengths and tools.</p>
      <section className="grid md:grid-cols-2 gap-10 items-start">
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
        <div className="space-y-6 text-muted-foreground">
          <div>
            <h2 className="font-heading text-xl text-foreground mb-3">Software & Tools</h2>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground">CAD & Design</h4>
                <p className="text-sm">SolidWorks, Siemens NX, Fusion 360</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Analysis</h4>
                <p className="text-sm">Introductory FEA in ANSYS Mechanical, MATLAB for simulations</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Programming</h4>
                <p className="text-sm">Python, C/C++, MATLAB scripting</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Embedded & Electronics</h4>
                <p className="text-sm">ESP32, Arduino, motor drivers (L298N), ESCs, UBECs, sensors (MPU6050, BME280, GPS)</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground">Web & SaaS (support tools)</h4>
                <p className="text-sm">Next.js, React, Node.js, Tailwind</p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-heading text-xl text-foreground mb-3">Relevant Coursework</h2>
            <p className="text-sm mb-2 font-medium">(completed or in progress)</p>
            <div className="space-y-2 text-sm">
              <div>• Statics & Strength of Materials (Solids I & II)</div>
              <div>• Kinematics and Dynamics of Machines</div>
              <div>• Computer-Aided Design (CAD)</div>
              <div>• Thermodynamics I</div>
              <div>• Fluid Mechanics I</div>
              <div>• Manufacturing Processes</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
