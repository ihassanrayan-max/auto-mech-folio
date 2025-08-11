import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

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
      const computeAllowed = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAllowed(false);
          setChecking(false);
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        const role = (profile as any)?.role as string | undefined;
        let ok = role === 'admin' || role === 'editor';
        if (!ok) {
          const { data: isAdminRpc } = await supabase.rpc('is_admin');
          ok = Boolean(isAdminRpc);
        }
        setAllowed(ok);
        setChecking(false);
      };
      await computeAllowed();
      const { data: sub } = supabase.auth.onAuthStateChange((_evt) => {
        setTimeout(() => { void computeAllowed(); }, 0);
      });
      unsub = () => sub.subscription.unsubscribe();
    };
    init();
    return () => {
      unsub?.();
    };
  }, []);

  if (checking) return <div className="p-6">Checking authentication…</div>;
  if (!allowed) return <Navigate to="/" replace />;
  return <>{children}</>;
}
