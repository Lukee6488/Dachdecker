import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "secretary" | "project_manager";

export interface UserProfile {
  id: string;
  display_name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (username: string, password: string, remember: boolean) => Promise<{ error: string | null; role?: UserRole }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const REMEMBER_KEY = "elk_remember";
const SESSION_FLAG = "elk_session";

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as UserProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const remember    = localStorage.getItem(REMEMBER_KEY);
          const sessionFlag = sessionStorage.getItem(SESSION_FLAG);

          if (remember === "false" && !sessionFlag) {
            await supabase.auth.signOut();
            return;
          }

          setUser(session.user);
          const p = await Promise.race([
            fetchProfile(session.user.id),
            new Promise<null>(res => setTimeout(() => res(null), 4000)),
          ]);
          setProfile(p);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    // Absoluter Fallback: nach 6s loading beenden
    const fallback = setTimeout(() => setLoading(false), 6000);
    init().finally(() => clearTimeout(fallback));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Nur Token-Erneuerung: User neu setzen, Profil nur wenn noch nicht geladen
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (
    username: string,
    password: string,
    remember: boolean,
  ): Promise<{ error: string | null; role?: UserRole }> => {
    const email = username.toLowerCase().trim();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      return { error: "Ungültiger Benutzername oder Passwort." };
    }

    localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
    sessionStorage.setItem(SESSION_FLAG, "1");

    // Profil direkt laden und State setzen – nicht auf onAuthStateChange warten
    const p = await fetchProfile(data.user.id);
    setUser(data.user);
    setProfile(p);

    return { error: null, role: p?.role };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorieren – hard logout folgt
    } finally {
      localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.removeItem(SESSION_FLAG);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
