import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import allowedEmailsData from "../lib/allowedEmails.json";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase();
      
      if (!email) {
        console.log("❌ Auth: No email provided");
        return false;
      }

      // Check if email domain is allowed
      const emailDomain = email.split('@')[1];
      const isDomainAllowed = allowedEmailsData.allowedDomains.includes(emailDomain);
      
      // Check if specific email is allowed
      const isEmailAllowed = allowedEmailsData.allowedEmails.includes(email);

      if (isDomainAllowed || isEmailAllowed) {
        console.log(`✅ Auth: Access granted for ${email}`);
        return true;
      }

      console.log(`❌ Auth: Access denied for ${email}`);
      return false;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return baseUrl + url;
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: "/", // Redirect to home page for sign in
    error: "/auth/error", // Error page
  },
});
