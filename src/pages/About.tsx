import SEO from "@/components/SEO";

export default function About() {
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
          <p>
            I am a mechanical engineering student passionate about designing efficient, reliable systems—from precise robotic mechanisms to scalable industrial automation. I enjoy solving open-ended problems and turning ideas into prototypes.
          </p>
          <p>
            My interests include robotics, mechatronics, structural analysis, and sustainable energy systems. I thrive in multidisciplinary teams and love learning new tools and methods.
          </p>
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
