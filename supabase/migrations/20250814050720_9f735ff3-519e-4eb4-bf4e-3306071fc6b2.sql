-- Add isVisible column to projects table with default true
ALTER TABLE public.projects 
ADD COLUMN "isVisible" boolean NOT NULL DEFAULT true;