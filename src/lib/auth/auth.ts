import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Account } from "@/models/Account";
import { verifyPassword } from "@/lib/auth/password";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await dbConnect();
        const user = await User.findOne({ email: parsed.data.email }).select(
          "+passwordHash"
        );
        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
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
        } catch (error) {
          console.error("OAuth user upsert error:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).id =
          token.id as string;
        session.user.name = (token.name as string) || session.user.name;
        session.user.email = (token.email as string) || session.user.email;
        session.user.image =
          (token.picture as string) || session.user.image || null;
      }
      return session;
    },
  },
});
