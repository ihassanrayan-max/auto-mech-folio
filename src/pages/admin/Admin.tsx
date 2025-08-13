import { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { generateResponsiveImages } from "@/lib/image";
import { slugify } from "@/lib/slug";
import type { Category, ProjectRow, SiteSettings, Status } from "@/types/cms";
import { useNavigate } from "react-router-dom";


const categories: Category[] = ["Mechanical", "Electrical", "Software", "Mini"];
const statuses: Status[] = ["In Progress", "Completed"];

function useAuthRole() {
  const [state, setState] = useState<{ allowed: boolean; isAdmin: boolean; role: 'admin' | 'editor' | null; loading: boolean; userEmail: string}>({
    allowed: false,
    isAdmin: false,
    role: null,
    loading: true,
    userEmail: "",
  });
  useEffect(() => {
    let unsub: (() => void) | null = null;
    const apply = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState({ allowed: false, isAdmin: false, role: null, loading: false, userEmail: "" });
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const role = (profile as any)?.role as 'admin' | 'editor' | undefined;
      const allowed = role === 'admin' || role === 'editor';
      setState({ allowed, isAdmin: role === 'admin', role: role ?? null, loading: false, userEmail: user.email || "" });
    };
    const init = async () => {
      await apply();
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          // handled in component UI
        }
        setTimeout(() => { void apply(); }, 0);
      });
      unsub = () => sub.subscription.unsubscribe();
    };
    init();
    return () => unsub?.();
  }, []);
  return state;
}

function NoIndexMeta() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
  return null;
}

export default function AdminPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [view, setView] = useState<"list" | "new" | "edit" | "settings">("list");
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const { allowed, isAdmin, role, loading, userEmail } = useAuthRole();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [search, setSearch] = useState("");
const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [authMode, setAuthMode] = useState<"signin"|"forgot"|"reset">("signin");

  // Site settings local state
  const [homeFeaturedEnabledLocal, setHomeFeaturedEnabledLocal] = useState<boolean>(false);
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubcopy, setHeroSubcopy] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("");
  const [heroCtaHref, setHeroCtaHref] = useState("");
  const [aboutMarkdown, setAboutMarkdown] = useState("");
  const [skillsList, setSkillsList] = useState<{ name: string; level: number }[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactLinkedin, setContactLinkedin] = useState("");
  const [contactGithub, setContactGithub] = useState("");
  const [otherLinks, setOtherLinks] = useState<{ label: string; url: string }[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const load = async () => {
      const { data } = await supabase.from("projects").select("*").order("priority", { ascending: false }).order("createdAt", { ascending: false });
      setProjects((data as any) ?? []);
      const { data: s } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (s) setSettings(s as any);
    };
    load();
  }, []);

  useEffect(() => {
    // Idle sign-out after 30m
    let timer: any;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => supabase.auth.signOut(), 30 * 60 * 1000);
    };
    ["mousemove", "keydown", "scroll", "click"].forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      ["mousemove", "keydown", "scroll", "click"].forEach((e) => window.removeEventListener(e, reset));
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAuthMode('reset');
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (hash.get('type') === 'recovery') setAuthMode('reset');
    }
  }, []);

  // Hydrate local site settings state when settings load
  useEffect(() => {
    const s: any = settings || {};
    setHomeFeaturedEnabledLocal(!!s.homeFeaturedEnabled);
    const h = s.hero || {};
    setHeroHeadline(h.headline || "");
    setHeroSubcopy(h.subcopy || "");
    setHeroCtaText(h.ctaText || "");
    setHeroCtaHref(h.ctaHref || "");
    const a = s.about || {};
    setAboutMarkdown(a.markdown || "");
    const sk = Array.isArray(s.skills) ? s.skills : [];
    setSkillsList(sk.map((it: any) => ({ name: String(it?.name || ""), level: Math.max(0, Math.min(100, Number(it?.level ?? 0))) })));
    const c = s.contact || {};
    setContactEmail(c.email || "");
    setContactLinkedin(c.linkedinUrl || "");
    setContactGithub(c.githubUrl || "");
    setOtherLinks(Array.isArray(c.otherLinks) ? c.otherLinks.map((l: any) => ({ label: String(l?.label || ""), url: String(l?.url || "") })) : []);
  }, [settings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => !q || p.title.toLowerCase().includes(q) || p.shortSummary.toLowerCase().includes(q));
  }, [projects, search]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="container py-8">
        <SEO title="Admin Dashboard" description="Admin area" />
        <NoIndexMeta />
        <Card>
          <CardHeader>
            <CardTitle>Supabase not configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please connect the project to Supabase using Lovable's native integration, then refresh this page.</p>
            <a className="underline" href="https://docs.lovable.dev/integrations/supabase/" target="_blank" rel="noreferrer">Read integration docs</a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Clean up existing state and sign out
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) localStorage.removeItem(key);
      });
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) sessionStorage.removeItem(key);
      });
      try { await supabase.auth.signOut({ scope: 'global' } as any); } catch {}

      const targetForm = e.currentTarget instanceof HTMLFormElement ? e.currentTarget : ((e as any).target?.closest?.('form') ?? null);
      if (!targetForm) throw new Error('Form not found');
      const form = new FormData(targetForm);
      const email = String(form.get('email') || '');
      const password = String(form.get('password') || '');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return toast({ title: 'Login failed', description: error.message });
      window.location.href = '/admin';
    } catch (err: any) {
      toast({ title: 'Login error', description: err.message || String(err) });
    }
  };

  const handleResetRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetForm = e.currentTarget instanceof HTMLFormElement ? e.currentTarget : ((e as any).target?.closest?.('form') ?? null);
    if (!targetForm) throw new Error('Form not found');
    const form = new FormData(targetForm);
    const email = String(form.get('email') || '');
    const redirectTo = `${window.location.origin}/admin`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    toast({ title: 'Check your email', description: "If an account exists for that email, we've sent a reset link." });
    setAuthMode('signin');
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const targetForm = e.currentTarget instanceof HTMLFormElement ? e.currentTarget : ((e as any).target?.closest?.('form') ?? null);
    if (!targetForm) throw new Error('Form not found');
    const form = new FormData(targetForm);
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');
    if (!password || password !== confirm) {
      return toast({ title: 'Passwords do not match', description: 'Please re-enter your new password.' });
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast({ title: 'Update failed', description: error.message });
    await supabase.auth.signOut();
    navigate('/admin');
    toast({ title: 'Password updated', description: 'Sign in with your new password.' });
  };
  const onSave = async (payload: Omit<ProjectRow, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    const now = new Date().toISOString();
    if (payload.id) {
      const { error } = await supabase.from("projects").update({ ...payload, updatedAt: now }).eq("id", payload.id);
      if (error) return toast({ title: "Update failed", description: error.message });
    } else {
      const { error } = await supabase.from("projects").insert({ ...payload, createdAt: now, updatedAt: now });
      if (error) return toast({ title: "Create failed", description: error.message });
    }
    toast({ title: "Saved" });
    const { data } = await supabase.from("projects").select("*").order("priority", { ascending: false }).order("createdAt", { ascending: false });
    setProjects((data as any) ?? []);
    setView("list");
    setEditing(null);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleFeatured = async (proj: ProjectRow) => {
    const { error } = await supabase.from("projects").update({ featured: !proj.featured }).eq("id", proj.id);
    if (!error) setProjects((prev) => prev.map((p) => (p.id === proj.id ? { ...p, featured: !p.featured } : p)));
  };

  const saveSettings = async (enabled: boolean) => {
    const now = new Date().toISOString();
    const upsert = { id: "main", homeFeaturedEnabled: enabled, updatedAt: now } as SiteSettings;
    const { error } = await supabase.from("site_settings").upsert(upsert, { onConflict: "id" });
    if (error) return toast({ title: "Settings failed", description: error.message });
    setSettings(upsert);
    toast({ title: "Settings saved" });
  };

  const exportBackup = async () => {
    const { data: rows } = await supabase.from("projects").select("*");
    // Try to list bucket files (works if bucket is public)
    const media: Record<string, string[]> = {};
    try {
      const listRes = await supabase.storage.from("media-projects").list(undefined, { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });
      if (!listRes.error && listRes.data) {
        for (const item of listRes.data) {
          const { data } = supabase.storage.from("media-projects").getPublicUrl(item.name);
          media[item.name] = [data.publicUrl];
        }
      }
    } catch {}
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), rows, media }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-projects-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isValidUrl = (u: string) => {
    if (!u) return true;
    try { new URL(u); return true; } catch { return false; }
  };

  const handleSaveSiteSettings = async () => {
    if (contactEmail && !/^([^@\s]+)@([^@\s]+)\.[^@\s]+$/.test(contactEmail)) {
      return toast({ title: "Invalid email", description: "Please enter a valid email address." });
    }
    const urlsToCheck = [heroCtaHref, contactLinkedin, contactGithub, ...otherLinks.map((l) => l.url)];
    if (urlsToCheck.some((u) => !isValidUrl(u))) {
      return toast({ title: "Invalid URL", description: "Please check all URL fields." });
    }
    if (skillsList.some((s) => !s.name.trim() || isNaN(s.level) || s.level < 0 || s.level > 100)) {
      return toast({ title: "Invalid skills", description: "Each skill must have a name and 0–100 level." });
    }

    const payload: any = {
      id: "main",
      homeFeaturedEnabled: !!homeFeaturedEnabledLocal,
      hero: { headline: heroHeadline, subcopy: heroSubcopy, ctaText: heroCtaText, ctaHref: heroCtaHref },
      about: { markdown: aboutMarkdown },
      skills: skillsList.map((s) => ({ name: s.name, level: Number(s.level) })),
      contact: { email: contactEmail, linkedinUrl: contactLinkedin, githubUrl: contactGithub, otherLinks },
    };

    const { data, error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" }).select().maybeSingle();
    if (error) return toast({ title: "Settings failed", description: error.message });
    setSettings((data as any) ?? payload);
    toast({ title: "Settings saved" });
  };

  const addSkill = () => setSkillsList((prev) => [...prev, { name: "", level: 50 }]);
  const removeSkill = (idx: number) => setSkillsList((prev) => prev.filter((_, i) => i !== idx));

  const addLink = () => setOtherLinks((prev) => [...prev, { label: "", url: "" }]);
  const removeLink = (idx: number) => setOtherLinks((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="container py-8">
      <SEO title="Admin Dashboard" description="Manage projects and settings" />
      <NoIndexMeta />
      {(!allowed || authMode === 'reset') ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>{authMode === 'forgot' ? 'Forgot password' : authMode === 'reset' ? 'Set new password' : 'Admin Login'}</CardTitle>
          </CardHeader>
          <CardContent>
            {authMode === 'signin' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit">Sign in</Button>
                <div className="text-sm text-muted-foreground pt-2">
                  <button type="button" className="underline" onClick={() => setAuthMode('forgot')}>Forgot password</button>
                </div>
              </form>
            )}
            {authMode === 'forgot' && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input id="fp-email" name="email" type="email" required />
                </div>
                <Button type="submit">Send reset link</Button>
                <div className="text-sm text-muted-foreground pt-2">
                  <button type="button" className="underline" onClick={() => setAuthMode('signin')}>Back to sign in</button>
                </div>
              </form>
            )}
            {authMode === 'reset' && (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="np-password">New password</Label>
                  <Input id="np-password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="np-confirm">Confirm new password</Label>
                  <Input id="np-confirm" name="confirm" type="password" required />
                </div>
                <Button type="submit">Update password</Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}>Projects</Button>
            <Button variant={view === "new" ? "default" : "outline"} onClick={() => setView("new")}>Add New</Button>
            <Button disabled={!isAdmin} variant={view === "settings" ? "default" : "outline"} onClick={() => isAdmin && setView("settings")}>Site Settings</Button>
            <div className="ml-auto flex items-center gap-2">
              <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
              <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            </div>
          </div>

          {view === "list" && (
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((p) => (
                    <div key={p.id} className="border rounded-md p-4 space-y-3">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.category} • {p.status}</div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setEditing(p); setView("edit"); }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>Delete</Button>
                        <Button size="sm" variant={p.featured ? "default" : "outline"} onClick={() => toggleFeatured(p)}>
                          {p.featured ? "Featured" : "Make Featured"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {view === "new" && (
            <ProjectForm onSave={onSave} />
          )}

          {view === "edit" && editing && (
            <ProjectForm initial={editing} onSave={onSave} />
          )}

          {view === "settings" && (
            <Card className="max-w-3xl">
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Home Featured section</div>
                    <div className="text-sm text-muted-foreground">Show Featured Projects on the Home page.</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={homeFeaturedEnabledLocal} onCheckedChange={setHomeFeaturedEnabledLocal} id="home-featured" />
                    <Label htmlFor="home-featured">{homeFeaturedEnabledLocal ? 'Enabled' : 'Disabled'}</Label>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="font-medium">Hero</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="e.g., Hi, I’m Alex — Mechanical Engineering Student" />
                    </div>
                    <div className="space-y-2">
                      <Label>CTA Text</Label>
                      <Input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} placeholder="View Projects" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subcopy</Label>
                    <Textarea value={heroSubcopy} onChange={(e) => setHeroSubcopy(e.target.value)} rows={3} placeholder="Short supporting sentence." />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Href (URL)</Label>
                    <Input type="url" value={heroCtaHref} onChange={(e) => setHeroCtaHref(e.target.value)} placeholder="/projects" />
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="font-medium">About</div>
                  <div className="space-y-2">
                    <Label>Markdown</Label>
                    <Textarea value={aboutMarkdown} onChange={(e) => setAboutMarkdown(e.target.value)} rows={10} placeholder="Write your About content in Markdown" />
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="font-medium">Skills</div>
                  <div className="space-y-3">
                    {skillsList.map((s, idx) => (
                      <div key={idx} className="grid md:grid-cols-[1fr,140px,auto] items-end gap-3">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={s.name} onChange={(e) => setSkillsList((prev) => prev.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} placeholder="CAD" />
                        </div>
                        <div className="space-y-2">
                          <Label>Level (0–100)</Label>
                          <Input type="number" min={0} max={100} value={s.level} onChange={(e) => setSkillsList((prev) => prev.map((it, i) => i === idx ? { ...it, level: Math.max(0, Math.min(100, Number(e.target.value || 0))) } : it))} />
                        </div>
                        <Button type="button" variant="outline" onClick={() => removeSkill(idx)}>Remove</Button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addSkill}>Add skill</Button>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="font-medium">Contact</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="name@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <Input type="url" value={contactGithub} onChange={(e) => setContactGithub(e.target.value)} placeholder="https://github.com/username" />
                    </div>
                    <div className="space-y-2">
                      <Label>LinkedIn URL</Label>
                      <Input type="url" value={contactLinkedin} onChange={(e) => setContactLinkedin(e.target.value)} placeholder="https://www.linkedin.com/in/username" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Other Links</Label>
                    <div className="space-y-3">
                      {otherLinks.map((l, idx) => (
                        <div key={idx} className="grid md:grid-cols-[1fr,1fr,auto] items-end gap-3">
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input value={l.label} onChange={(e) => setOtherLinks((prev) => prev.map((it, i) => i === idx ? { ...it, label: e.target.value } : it))} placeholder="Portfolio" />
                          </div>
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input type="url" value={l.url} onChange={(e) => setOtherLinks((prev) => prev.map((it, i) => i === idx ? { ...it, url: e.target.value } : it))} placeholder="https://..." />
                          </div>
                          <Button type="button" variant="outline" onClick={() => removeLink(idx)}>Remove</Button>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" onClick={addLink}>Add link</Button>
                    </div>
                  </div>
                </section>

                <div className="flex items-center gap-3 pt-2">
                  <Button onClick={handleSaveSiteSettings}>Save Settings</Button>
                  <Button variant="secondary" onClick={exportBackup}>Export Backup (JSON)</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectForm({ initial, onSave }: { initial?: any; onSave: (p: any) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [shortSummary, setShortSummary] = useState(initial?.shortSummary ?? "");
  const [longDescription, setLongDescription] = useState(initial?.longDescription ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "Mechanical");
  const [status, setStatus] = useState<Status>(initial?.status ?? "In Progress");
  const [dateStarted, setDateStarted] = useState<string>(initial?.dateStarted ?? "");
  const [dateCompleted, setDateCompleted] = useState<string>(initial?.dateCompleted ?? "");
  const [githubUrl, setGithubUrl] = useState<string>(initial?.githubUrl ?? "");
  const [externalLinks, setExternalLinks] = useState<string>(Array.isArray(initial?.externalLinks) ? initial.externalLinks.join(", ") : "");
  const [tags, setTags] = useState<string>(Array.isArray(initial?.tags) ? initial.tags.join(", ") : "");
  const [videoUrl, setVideoUrl] = useState<string>(initial?.media?.videoUrl ?? "");
  const [priority, setPriority] = useState<number>(initial?.priority ?? 0);
  const [featured, setFeatured] = useState<boolean>(initial?.featured ?? false);
  const [images, setImages] = useState<string[]>(initial?.media?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const slugBase = slugify(title || initial?.title || "");

  const ensureUniqueSlug = async (base: string) => {
    let candidate = base || "post";
    let i = 1;
    while (true) {
      const { data, error } = await supabase.from("projects").select("id").eq("slug", candidate).maybeSingle();
      if (!data && !error) return candidate;
      if (initial?.slug === candidate) return candidate; // editing existing
      i += 1;
      candidate = `${base}-${i}`;
    }
  };

  const onUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 12) return toast({ title: "Too many files", description: "Max 12 images per project" });
    setUploading(true);
    try {
      const baseSlug = await ensureUniqueSlug(slugBase);
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const variants = await generateResponsiveImages(file);
        for (const v of variants) {
          const ext = v.suffix === "orig" ? file.name.split(".").pop() || "jpg" : "jpg";
          const path = `${baseSlug}/${Date.now()}-${Math.random().toString(36).slice(2)}-${v.suffix}.${ext}`;
          const { error } = await supabase.storage.from("media-projects").upload(path, v.blob, { upsert: false, contentType: "image/jpeg" });
          if (error) throw error;
          const { data } = supabase.storage.from("media-projects").getPublicUrl(path);
          uploaded.push(data.publicUrl);
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
      toast({ title: "Uploaded", description: `${files.length} image(s) uploaded` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message ?? String(e) });
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortSummary || !dateStarted) {
      return toast({ title: "Missing fields", description: "Title, Short Summary and Start Date are required" });
    }
    const baseSlug = await ensureUniqueSlug(slugBase);
    const payload = {
      id: initial?.id,
      title,
      shortSummary,
      longDescription,
      category,
      status,
      dateStarted,
      dateCompleted: dateCompleted || null,
      media: { images, videoUrl: videoUrl || null },
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      githubUrl: githubUrl || null,
      externalLinks: externalLinks ? externalLinks.split(",").map((t) => t.trim()).filter(Boolean) : [],
      slug: baseSlug,
      featured,
      priority: Number(priority) || 0,
    } as Omit<ProjectRow, "id" | "createdAt" | "updatedAt"> & { id?: string };
    await onSave(payload);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Edit Project" : "Add Project"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Short Summary</Label>
              <Textarea value={shortSummary} onChange={(e) => setShortSummary(e.target.value)} rows={3} required />
            </div>
            <div className="space-y-2">
              <Label>Long Description (Markdown)</Label>
              <Textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={10} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Started</Label>
                <Input type="date" value={dateStarted} onChange={(e) => setDateStarted(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Completed (optional)</Label>
                <Input type="date" value={dateCompleted ?? ""} onChange={(e) => setDateCompleted(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input type="number" value={priority} onChange={(e) => setPriority(parseInt(e.target.value || "0", 10))} />
              </div>
              <div className="space-y-2">
                <Label>Featured</Label>
                <div className="flex items-center gap-3">
                  <input id="featured" type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                  <Label htmlFor="featured">Show in Featured</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>GitHub URL (optional)</Label>
              <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label>External Links (comma separated)</Label>
              <Input value={externalLinks} onChange={(e) => setExternalLinks(e.target.value)} placeholder="https://... , https://..." />
            </div>
            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="robotics, control, CAD" />
            </div>
            <div className="space-y-2">
              <Label>Video URL (optional)</Label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/..." />
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => onUploadImages(e.target.files)} disabled={uploading} />
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.slice(0, 6).map((url) => (
                    <img key={url} src={url} alt="Uploaded" loading="lazy" className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
            <div className="pt-2">
              <Button type="submit">{initial ? "Save Changes" : "Publish"}</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
