import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../integrations/supabase/client";

const AuthContext = createContext(null);

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
  const fetchUserProfile = async (userId: string) => {
    if (isFetchingProfile.current) return;
    
    // Debounce profile fetches - don't fetch more than once per second
    const now = Date.now();
    if (now - lastProfileFetch.current < 1000) return;
    
    isFetchingProfile.current = true;
    lastProfileFetch.current = now;
    
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", userId)
        .single();
      
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          await fetchUserProfile(session.user.id);
        } else {
          setRole(null);
          setStatus(null);
        }
      } else if (session?.user && event === 'SIGNED_IN') {
        // If same user but SIGNED_IN event, just ensure profile is up to date
        // but don't trigger a full re-fetch unless necessary
        console.log('User already signed in, ensuring profile is current');
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