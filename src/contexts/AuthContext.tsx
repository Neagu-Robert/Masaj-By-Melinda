import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../integrations/supabase/client";

type AuthContextValue = {
  user: any;
  role: string | null;
  status: string | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Refs to track state and prevent unnecessary re-fetches
  const currentUserId = useRef(null);
  const isFetchingProfile = useRef(false);
  const lastProfileFetch = useRef(0);

  // Helper function to fetch user profile
  const fetchUserProfile = async (userId: string, force: boolean = false) => {
    if (isFetchingProfile.current) return;
    
    // Debounce profile fetches - don't fetch more than once per second
    // Unless force is true (used for SIGNED_IN events)
    const now = Date.now();
    if (!force && now - lastProfileFetch.current < 1000) return;
    
    isFetchingProfile.current = true;
    lastProfileFetch.current = now;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", userId)
        .single();
      
      console.log('Profile fetch result:', profile, error);
      
      if (error) {
        console.error('Error fetching profile:', error);
        setRole(null);
        setStatus(null);
      } else {
        setRole(profile?.role || null);
        setStatus(profile?.status || null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setRole(null);
      setStatus(null);
    } finally {
      isFetchingProfile.current = false;
    }
  };

  useEffect(() => {
    let ignore = false;

    async function loadUserData() {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (ignore) return;
        
        setUser(session?.user ?? null);
        currentUserId.current = session?.user?.id || null;
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          // No authenticated user
          setRole(null);
          setStatus(null);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (!ignore) {
          setUser(null);
          setRole(null);
          setStatus(null);
          currentUserId.current = null;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (ignore) return;
      
      // Only process actual auth changes, not initial session
      if (event === 'INITIAL_SESSION') {
        return;
      }
      
      console.log('Auth state change:', event);
      
      const newUserId = session?.user?.id || null;
      
      // Only update if the user actually changed
      if (currentUserId.current !== newUserId) {
        setUser(session?.user ?? null);
        currentUserId.current = newUserId;
        
        if (session?.user) {
          // Schedule profile fetch outside the auth lock to prevent deadlock.
          // setSession holds an internal lock; awaiting a Supabase DB query
          // here would try to acquire the same lock via getSession → deadlock.
          setTimeout(() => fetchUserProfile(session.user.id, true), 0);
        } else {
          setRole(null);
          setStatus(null);
        }
      } else if (session?.user && event === 'SIGNED_IN') {
        // Same user ID but SIGNED_IN event (e.g., from setSession after auth-proxy)
        console.log('User signed in, fetching profile for redirect');
        setUser(session.user);
        setTimeout(() => fetchUserProfile(session.user.id, true), 0);
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
      currentUserId.current = null;
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