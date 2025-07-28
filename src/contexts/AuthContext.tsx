import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null); // NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function getSessionAndRole() {
      setLoading(true); // Start loading
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch role and status from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", session.user.id)
          .single();
        setRole(profile?.role || null);
        setStatus(profile?.status || null); // NEW
      } else {
        setRole(null);
        setStatus(null); // NEW
      }
      setLoading(false); // Finish loading
    }
    getSessionAndRole();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true); // Start loading on auth change
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role, status")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            setRole(profile?.role || null);
            setStatus(profile?.status || null); // NEW
          });
      } else {
        setRole(null);
        setStatus(null); // NEW
      }
      setLoading(false); // Finish loading
    });

    return () => {
      listener?.subscription.unsubscribe();
      ignore = true;
    };
  }, []);

  // Auto-logout if banned
  useEffect(() => {
    if (status === 'banned' && user) {
      supabase.auth.signOut();
      setUser(null);
      setRole(null);
      setStatus(null);
      // Optionally, you can redirect to a banned page or show a toast here
      // For now, just log out
    }
  }, [status, user]);

  return (
    <AuthContext.Provider value={{ user, role, status, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 