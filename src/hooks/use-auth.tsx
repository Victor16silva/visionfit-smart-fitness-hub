import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  clearDemoSession,
  createDemoSession,
  createDemoUser,
  enableDemoSession,
  isDemoCredentials,
  isDemoSession,
} from "@/lib/demo-auth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemoSession()) {
      const demoUser = createDemoUser();
      setUser(demoUser);
      setSession(createDemoSession(demoUser));
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isDemoSession()) return;
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    const timeoutId = window.setTimeout(() => {
      if (!isDemoSession()) {
        setLoading(false);
      }
    }, 2500);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (isDemoSession()) return;
        window.clearTimeout(timeoutId);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        window.clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (isDemoCredentials(email, password)) {
        enableDemoSession();
        const demoUser = createDemoUser();
        setUser(demoUser);
        setSession(createDemoSession(demoUser));
        setLoading(false);
        navigate("/dashboard");
        return { error: null };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate("/dashboard");
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/onboarding-form`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      navigate("/onboarding-form");
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    const wasDemo = isDemoSession();
    clearDemoSession();
    setUser(null);
    setSession(null);
    if (!wasDemo) {
      await supabase.auth.signOut();
    }
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
