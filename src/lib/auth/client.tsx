"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "./types";

/**
 * Tiny client-side compatibility layer that mirrors the bits of
 * `next-auth/react` the app actually uses: SessionProvider, useSession,
 * signIn and signOut. No provider library, no extra bundle weight.
 */

const SESSION_EVENT = "lv:session-change";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionContextValue {
  data: Session | null;
  status: SessionStatus;
  update: (patch?: Partial<Session["user"]>) => Promise<Session | null>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function emitSessionChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
}

async function fetchSession(): Promise<Session | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as Session | null;
    if (!data || typeof data !== "object" || !("user" in data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refresh = useCallback(async () => {
    const next = await fetchSession();
    setData(next);
    setStatus(next ? "authenticated" : "unauthenticated");
    return next;
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const next = await fetchSession();
      if (!active) return;
      setData(next);
      setStatus(next ? "authenticated" : "unauthenticated");
    })();

    const onChange = () => {
      void refresh();
    };
    window.addEventListener(SESSION_EVENT, onChange);
    return () => {
      active = false;
      window.removeEventListener(SESSION_EVENT, onChange);
    };
  }, [refresh]);

  const update = useCallback(
    async (patch?: Partial<Session["user"]>) => {
      if (!patch) return refresh();

      try {
        const response = await fetch("/api/auth/session", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) return data;

        const payload = (await response.json().catch(() => null)) as {
          session?: Session | null;
        } | null;
        const next = payload?.session ?? null;
        setData(next);
        setStatus(next ? "authenticated" : "unauthenticated");
        return next;
      } catch {
        return data;
      }
    },
    [data, refresh]
  );

  const value = useMemo<SessionContextValue>(
    () => ({ data, status, update }),
    [data, status, update]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    return {
      data: null,
      status: "unauthenticated",
      update: async () => null,
    };
  }
  return context;
}

export interface SignInOptions {
  email?: string;
  password?: string;
  callbackUrl?: string;
  redirect?: boolean;
}

export interface SignInResult {
  error: string | null;
  ok: boolean;
  status?: number;
  url?: string | null;
}

export async function signIn(
  provider: "credentials" | "google",
  options: SignInOptions = {}
): Promise<SignInResult> {
  if (provider === "google") {
    const callbackUrl = options.callbackUrl ?? "/app";
    if (typeof window !== "undefined") {
      const url = new URL("/api/auth/signin/google", window.location.origin);
      url.searchParams.set("callbackUrl", callbackUrl);
      window.location.assign(url.toString());
    }
    return { error: null, ok: true, url: callbackUrl };
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: options.email,
        password: options.password,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        error: payload?.error ?? "CredentialsSignin",
        ok: false,
        status: response.status,
      };
    }

    emitSessionChange();

    if (options.redirect !== false && options.callbackUrl) {
      window.location.assign(options.callbackUrl);
    }

    return {
      error: null,
      ok: true,
      url: options.callbackUrl ?? null,
    };
  } catch {
    return { error: "Something went wrong. Please try again.", ok: false };
  }
}

export interface SignOutOptions {
  redirect?: boolean;
  redirectTo?: string;
}

export async function signOut(
  options: SignOutOptions = {}
): Promise<{ error: null; ok: true }> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } finally {
    emitSessionChange();
    if (options.redirect !== false && typeof window !== "undefined") {
      window.location.assign(options.redirectTo ?? "/login");
    }
  }
  return { error: null, ok: true };
}
