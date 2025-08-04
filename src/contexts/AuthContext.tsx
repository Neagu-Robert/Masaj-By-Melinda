import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (ignore) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role, status")
            .eq("id", session.user.id)
            .single();
          
          if (ignore) return;
          
          if (error) {
            console.error('Error fetching profile:', error);
            setRole(null);
            setStatus(null);
          } else {
            setRole(profile?.role || null);
            setStatus(profile?.status || null);
          }
        } else {
          setRole(null);
          setStatus(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (!ignore) {
          setUser(null);
          setRole(null);
          setStatus(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    // Load initial data
    loadUserData();

    return () => {
      ignore = true;
    };
  }, []);

  // Set up auth state listener only after initial load is complete
  useEffect(() => {
    if (!initialized) return;

    let ignore = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (ignore) return;
      
      // Only process actual auth changes, not initial session
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      console.log('Auth state change:', event);
      
      // Update user immediately
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", session.user.id)
          .single();
        
        if (ignore) return;
        
        if (error) {
          console.error('Error fetching profile:', error);
          setRole(null);
          setStatus(null);
        } else {
          setRole(profile?.role || null);
          setStatus(profile?.status || null);
        }
      } else {
        setRole(null);
        setStatus(null);
      }
    });

    return () => {
      ignore = true;
      subscription?.unsubscribe();
    };
  }, [initialized]);

  // Simplified banned user effect to prevent re-render loops
  useEffect(() => {
    if (status === 'banned' && user && !loading) {
      supabase.auth.signOut();
      setUser(null);
      setRole(null);
      setStatus(null);
    }
  }, [status, user, loading]);

  return (
    <AuthContext.Provider value={{ user, role, status, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 