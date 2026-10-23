import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    updateAge: 2 * 60 * 60, // update session at most every 2 hours
  },
  cookies: {
    sessionToken: {
      name: "lv_session",
      options: {
        httpOnly: true,
        secure: process.env.NEXTAUTH_URL?.startsWith("https") ?? false,
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: "lv_csrf",
      options: {
        httpOnly: true,
        secure: process.env.NEXTAUTH_URL?.startsWith("https") ?? false,
        sameSite: "lax",
        path: "/",
      },
    },
  },
  providers: [],
} satisfies NextAuthConfig;
