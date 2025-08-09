# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/05d0a157-6630-489f-992e-7ce5b3c69b0b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/05d0a157-6630-489f-992e-7ce5b3c69b0b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/05d0a157-6630-489f-992e-7ce5b3c69b0b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## CMS + Admin (Supabase) – Setup & Operations

This project adds a lightweight CMS and admin dashboard without changing any existing pages, styles, or routes.

New routes added:
- Admin dashboard: /admin
- CMS listing: /cms/projects
- CMS detail: /cms/projects/[slug]

No changes were made to existing pages, layout, or navigation. Robots updated to disallow /admin indexing.

### 1) Connect Supabase (Lovable native integration)
- Click the green Supabase button in Lovable (top-right) and connect.
- No VITE_* env variables are required; Lovable injects configuration automatically.

### 2) Create database schema
Run the following SQL in Supabase SQL editor:

```sql
-- Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  shortSummary text not null,
  longDescription text not null,
  category text not null check (category in ('Mechanical','Electrical','Software','Mini')),
  status text not null check (status in ('In Progress','Completed')),
  dateStarted date not null,
  dateCompleted date,
  media jsonb not null default '{"images":[]}'::jsonb,
  tags text[] not null default '{}',
  githubUrl text,
  externalLinks text[] not null default '{}',
  slug text not null unique,
  featured boolean not null default false,
  priority int not null default 0,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);

-- Site Settings (singleton row id='main')
create table if not exists public.site_settings (
  id text primary key,
  homeFeaturedEnabled boolean not null default false,
  updatedAt timestamptz not null default now()
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.site_settings enable row level security;

-- Policies: anonymous read, only admin writes
-- Replace the email below if you change the admin email
-- Projects
create policy "anon read projects" on public.projects
  for select using (true);

create policy "admin write projects" on public.projects
  for all using (auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com');

-- Site settings
create policy "anon read settings" on public.site_settings
  for select using (true);

create policy "admin write settings" on public.site_settings
  for all using (auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com');
```

### 3) Storage bucket for media
Run in SQL editor to create a public bucket (or use the Storage UI):
```sql
insert into storage.buckets (id, name, public)
values ('media-projects','media-projects', true)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "public read media-projects" on storage.objects
  for select using (bucket_id = 'media-projects');

create policy "admin insert media-projects" on storage.objects
  for insert with check (bucket_id = 'media-projects' and auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com');

create policy "admin update media-projects" on storage.objects
  for update using (bucket_id = 'media-projects' and auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com')
  with check (bucket_id = 'media-projects' and auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com');

create policy "admin delete media-projects" on storage.objects
  for delete using (bucket_id = 'media-projects' and auth.jwt() ->> 'email' = 'ihassanrayan@gmail.com');
```

### 4) First admin user
- In Supabase Auth, create a user with email: ihassanrayan@gmail.com and set a password.
- Sign in at /admin using that email/password.
- Only this email can create/update/delete content and settings per RLS above.

### 5) Authoring flow
- Go to /admin → Add New
- Upload images (client-side compression + responsive sizes), add details, click Publish
- Content appears on /cms/projects and /cms/projects/[slug]

### 6) Optional Home Featured section
- Toggle in /admin → Site Settings (homeFeaturedEnabled)
- If a "Featured Projects" placeholder already exists on Home, it can be wired to query top 3 featured=true projects. No Home edits were made here.

### 7) Backups
- In /admin → Site Settings click "Export Backup" to download a JSON snapshot of all projects and media URLs. For weekly backups, set a calendar reminder to click this or automate via Supabase scheduled functions (optional).

### 8) Privacy & Security
- /admin is marked noindex via meta and robots.txt Disallow.
- Session timeout: auto sign-out after 30 minutes of inactivity.
- CSRF: requests are direct to Supabase with the authenticated session token; no custom server.

### 9) Notes
- No changes to existing pages, routes, or styles were made. New code lives under src/pages/admin, src/pages/cms, src/components/projects, and src/lib.
- Media bucket is public read for performance; write access is restricted to the admin per policies.
