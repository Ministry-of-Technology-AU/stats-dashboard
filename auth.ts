import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ALLOWED_EMAILS, ALLOWED_DOMAIN } from "@/lib/allowed-emails";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          hd: ALLOWED_DOMAIN, // Restricts to Ashoka domain
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase();
      
      // Check if email exists
      if (!email) {
        return false;
      }

      // Check if email is in allowed list
      if (!ALLOWED_EMAILS.includes(email)) {
        console.log(`❌ Unauthorized email attempted: ${email}`);
        return false;
      }

      // Ensure email is from ashoka.edu.in domain
      if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        console.log(`❌ Non-Ashoka email attempted: ${email}`);
        return false;
      }

      console.log(`✅ Authorized login: ${email}`);
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.AUTH_SECRET,
});
