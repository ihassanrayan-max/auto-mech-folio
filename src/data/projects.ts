import roboticArm from "@/assets/projects/robotic-arm.jpg";
import windTurbine from "@/assets/projects/wind-turbine.jpg";
import droneFrame from "@/assets/projects/drone-frame.jpg";
import feaBracket from "@/assets/projects/fea-bracket.jpg";
import packagingConveyor from "@/assets/projects/packaging-conveyor.jpg";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  image: string;
  imageAlt: string;
  skills: string[];
  outcomes: string[];
};

export const projects: Project[] = [
  {
    slug: "robotic-arm",
    title: "Robotic Arm Design and Control",
    summary:
      "Designed a 6-DOF robotic arm and implemented kinematics-based control for precise pick-and-place operations.",
    description: [
      "I led the end-to-end design of a compact 6-DOF robotic arm, starting from initial concept sketches through CAD modeling and component selection.",
      "Using forward and inverse kinematics, I implemented motion planning to achieve accurate repeatability and smooth trajectories.",
      "The system was validated with calibration routines and error analysis, resulting in reliable performance across various tasks.",
    ],
    image: roboticArm,
    imageAlt: "CAD render of a robotic arm prototype",
    skills: ["SolidWorks", "Kinematics", "Motion Control", "Embedded Systems"],
    outcomes: ["±0.8 mm repeatability", "30% faster cycle time", "Modular design"],
  },
  {
    slug: "wind-turbine-optimization",
    title: "Wind Turbine Aerodynamic Optimization",
    summary:
      "Optimized blade profiles using CFD to increase energy capture under varying wind conditions.",
    description: [
      "Developed a CFD workflow to evaluate multiple blade geometries with different tip-speed ratios.",
      "Applied parametric sweeps and mesh refinement to improve prediction accuracy and convergence.",
      "Identified an airfoil configuration that improved annual energy production in moderate wind sites.",
    ],
    image: windTurbine,
    imageAlt: "Wind turbine farm with airflow visualization",
    skills: ["CFD", "Optimization", "Ansys Fluent", "Matlab"],
    outcomes: ["+7.5% AEP", "Reduced stall losses", "Robust across wind bins"],
  },
  {
    slug: "drone-frame-3d-print",
    title: "3D-Printed Drone Frame Prototype",
    summary:
      "Designed and fabricated a lightweight drone frame optimizing stiffness-to-weight via topology optimization.",
    description: [
      "Modeled a modular quadcopter frame and used topology optimization to remove non-critical mass.",
      "Iterated material selection (PLA, PETG, nylon) and infill strategies to balance rigidity and durability.",
      "Bench-tested vibration characteristics and refined arm geometry to mitigate resonance.",
    ],
    image: droneFrame,
    imageAlt: "3D-printed drone frame on a lab table",
    skills: ["Topology Optimization", "Additive Manufacturing", "Vibration Analysis"],
    outcomes: ["18% lighter", "Improved stiffness", "Rapid iteration"],
  },
  {
    slug: "fea-bracket",
    title: "Finite Element Analysis of Structural Bracket",
    summary:
      "Performed static and fatigue analyses to validate a high-load bracket using FEA and hand calculations.",
    description: [
      "Built an FEA model with appropriate boundary conditions and material properties to assess stress concentrations.",
      "Corroborated results with closed-form calculations and safety factors for design decisions.",
      "Delivered design recommendations that reduced peak stress while meeting packaging constraints.",
    ],
    image: feaBracket,
    imageAlt: "FEA heatmap of a bracket showing stress distribution",
    skills: ["FEA", "Stress Analysis", "Ansys", "Hand Calcs"],
    outcomes: ["-22% peak stress", "Validated safety factor", "Manufacturable design"],
  },
  {
    slug: "packaging-conveyor",
    title: "Automated Packaging Conveyor",
    summary:
      "Designed a conveyor subsystem with integrated sensors and controls to automate package sorting.",
    description: [
      "Specified motors, belts, and rollers; integrated photoelectric sensors for object detection.",
      "Developed PLC logic for routing, jam detection, and throughput monitoring.",
      "Validated throughput with test runs and implemented ergonomic improvements for operators.",
    ],
    image: packagingConveyor,
    imageAlt: "Automated conveyor system in a factory",
    skills: ["Automation", "PLC Programming", "System Integration"],
    outcomes: ["+25% throughput", "Reduced jams", "Improved safety"],
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}
