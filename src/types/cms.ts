export type Category = "Mechanical" | "Electrical" | "Software" | "Mini";
export type Status = "In Progress" | "Completed";

export type ProjectRow = {
  id: string;
  title: string;
  shortSummary: string;
  longDescription: string; // Markdown
  category: Category;
  status: Status;
  dateStarted: string; // ISO date
  dateCompleted?: string | null; // ISO date or null
  media: {
    images: string[]; // public URLs
    videoUrl?: string | null;
  };
  tags: string[];
  githubUrl?: string | null;
  externalLinks: string[];
  slug: string;
  featured: boolean;
  priority: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type SiteHero = {
  headline: string;
  subcopy?: string;
  ctaText?: string;
  ctaHref?: string;
};

export type SiteAbout = {
  markdown: string;
};

export type SkillItem = { name: string; level: number };

export type SiteContact = {
  email?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  otherLinks?: { label: string; url: string }[];
};

export type SiteSettings = {
  id: string; // singleton id e.g., 'main'
  homeFeaturedEnabled: boolean;
  updatedAt: string;
  hero?: SiteHero;
  about?: SiteAbout;
  skills?: SkillItem[];
  contact?: SiteContact;
};
