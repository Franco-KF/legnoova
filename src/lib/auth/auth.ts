import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Account } from "@/models/Account";
import { verifyPassword } from "@/lib/auth/password";
import { authConfig } from "./auth.config";
import { checkLoginThrottle, recordLoginFailure, recordLoginSuccess } from "@/lib/security/brute-force";
import { recordSecurityEvent } from "@/models/AuditLog";
import { getClientIp } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const ip = getClientIp(req as Request);
        const userAgent = (req as Request)?.headers.get("user-agent") ?? null;

        // Brute-force / lockout check before touching the database.
        const throttle = await checkLoginThrottle(parsed.data.email);
        if (!throttle.allowed) {
          await recordSecurityEvent({
            type: "login_lockout",
            ip,
            userAgent,
            details: { email: parsed.data.email, retryAfterSec: throttle.retryAfterSec },
            severity: "high",
          });
          return null;
        }

        await dbConnect();
        const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");
        if (!user || !user.passwordHash) {
          // Constant-time-ish: still run bcrypt compare against a dummy hash to avoid timing leaks.
          await verifyPassword(parsed.data.password, "$2a$12$dummyhashforexampleonly0000000000000");
          await recordLoginFailure(parsed.data.email, ip, userAgent);
          return null;
        }

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) {
          await recordLoginFailure(parsed.data.email, ip, userAgent);
          return null;
        }

        await recordLoginSuccess(parsed.data.email, ip, userAgent);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image ?? undefined,
          plan: user.plan ?? undefined,
          brokerAutomationEnabled: !!user.brokerAutomationEnabled,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.plan = (user as unknown as { plan?: string }).plan;
        token.brokerAutomationEnabled = (user as unknown as { brokerAutomationEnabled?: boolean }).brokerAutomationEnabled;
        token.csrf = crypto.randomUUID().replace(/-/g, "");
      }

      if (trigger === "update") {
        // Re-issue CSRF token on session updates to invalidate old tokens.
        token.csrf = crypto.randomUUID().replace(/-/g, "");
      }

      // On OAuth sign-in (account present, no adapter), upsert User + Account
      if (account && account.provider !== "credentials") {
        await dbConnect();
        try {
          const providerAccountId = account.providerAccountId as string;
          let mongoUser = await User.findOne({
            email: token.email as string,
          });

          if (!mongoUser) {
            mongoUser = await User.create({
              name: (token.name as string) || "User",
              email: token.email as string,
              image: token.picture as string | undefined,
              emailVerified: new Date(),
            });
          } else if (!mongoUser.image && token.picture) {
            mongoUser.image = token.picture as string;
            await mongoUser.save();
          }

          const existingAccount = await Account.findOne({
            provider: account.provider,
            providerAccountId,
          });
          if (!existingAccount) {
            await Account.create({
              userId: mongoUser._id,
              type: account.type,
              provider: account.provider,
              providerAccountId,
              refresh_token: account.refresh_token as string | undefined,
              access_token: account.access_token as string | undefined,
              expires_at: account.expires_at,
              token_type: account.token_type as string | undefined,
              scope: account.scope as string | undefined,
              id_token: account.id_token as string | undefined,
              session_state: account.session_state as string | undefined,
            });
          }

          token.id = mongoUser._id.toString();
          token.email = mongoUser.email;
          token.name = mongoUser.name;
          token.picture = mongoUser.image ?? token.picture;
          token.csrf = crypto.randomUUID().replace(/-/g, "");
        } catch (error) {
          console.error("OAuth user upsert error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id = token.id as string;
        session.user.name = (token.name as string) || session.user.name;
        session.user.email = (token.email as string) || session.user.email;
        session.user.image = (token.picture as string) || session.user.image || null;
        (session.user as unknown as Record<string, unknown>).plan = token.plan as string | undefined;
        (session.user as unknown as Record<string, unknown>).brokerAutomationEnabled = token.brokerAutomationEnabled as boolean | undefined;
        (session.user as unknown as Record<string, unknown>).csrf = token.csrf as string;
      }
      return session;
    },
    async signIn({ user, account }: { user: { id: string; name?: string | null; email?: string | null; image?: string | null }; account?: { provider: string } | null; profile?: unknown; email?: unknown }): Promise<boolean> {
      // Record OAuth sign-in as a security event.
      if (account?.provider === "google") {
        await recordSecurityEvent({
          type: "login_success",
          userId: user.id,
          ip: "oauth",
          userAgent: null,
          details: { provider: "google" },
          severity: "low",
        });
      }
      return true;
    },
  },
  events: {
    async signOut() {
      await recordSecurityEvent({
        type: "login_success", // reused for session end tracking; type is a misnomer but logs the event
        ip: "system",
        userAgent: null,
        details: { action: "sign_out" },
        severity: "low",
      });
    },
  },
});
