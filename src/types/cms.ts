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

export type SiteSettings = {
  id: string; // singleton id e.g., 'main'
  homeFeaturedEnabled: boolean;
  updatedAt: string;
};
