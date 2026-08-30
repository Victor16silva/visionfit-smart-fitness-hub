import type { Session, User } from "@supabase/supabase-js";

export const DEMO_EMAIL = "vsz16silva@gmail.com";
export const DEMO_PASSWORD = "VisionFit2026!";
export const DEMO_FULL_NAME = "Victor Cavalcante";

const DEMO_STORAGE_KEY = "visionfit-demo-session";

export function isDemoModeEnabled(): boolean {
  return import.meta.env.DEV;
}

export function isDemoSession(): boolean {
  if (!isDemoModeEnabled() || typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_STORAGE_KEY) === "1";
}

export function enableDemoSession(): void {
  localStorage.setItem(DEMO_STORAGE_KEY, "1");
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

export function isDemoCredentials(email: string, password: string): boolean {
  return (
    isDemoModeEnabled() &&
    email.trim().toLowerCase() === DEMO_EMAIL &&
    password === DEMO_PASSWORD
  );
}

export function createDemoUser(): User {
  const now = new Date().toISOString();
  return {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: DEMO_EMAIL,
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: DEMO_FULL_NAME },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as User;
}

export function createDemoSession(user: User): Session {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    expires_in: 3600,
    expires_at: now + 3600,
    token_type: "bearer",
    user,
  };
}
