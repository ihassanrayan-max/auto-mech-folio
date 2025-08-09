import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, isSupabaseConfigured, ADMIN_EMAIL } from "@/lib/supabaseClient";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    const init = async () => {
      if (!isSupabaseConfigured()) {
        setAllowed(false);
        setChecking(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      const ok = Boolean(data.user && data.user.email === ADMIN_EMAIL);
      setAllowed(ok);
      setChecking(false);
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setAllowed(Boolean(session?.user?.email === ADMIN_EMAIL));
      });
      unsub = () => sub.subscription.unsubscribe();
    };
    init();
    return () => {
      unsub?.();
    };
  }, []);

  if (checking) return <div className="p-6">Checking authentication…</div>;
  if (!allowed) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
