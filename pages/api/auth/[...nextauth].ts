import NextAuth, { NextAuthOptions } from "next-auth";
import TodoistProvider from "next-auth/providers/todoist";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in environment variables');
}

if (!process.env.TODOIST_CLIENT_ID) {
  throw new Error('TODOIST_CLIENT_ID must be set in environment variables');
}

if (!process.env.TODOIST_CLIENT_SECRET) {
  throw new Error('TODOIST_CLIENT_SECRET must be set in environment variables');
}

// Resolve the canonical base URL used for OAuth. Prefer an explicit NEXTAUTH_URL;
// when it isn't set (e.g. a fresh Vercel deploy), fall back to the project's stable
// production domain so OAuth always uses one consistent host. Any trailing slash is
// stripped so we never build a double-slashed callback URL — a common misconfiguration
// that makes the redirect_uri stop matching the one registered in the Todoist console.
const AUTH_BASE_URL = (
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '')
).replace(/\/+$/, '');

if (!AUTH_BASE_URL) {
  throw new Error(
    'NEXTAUTH_URL must be set in environment variables (or deploy on Vercel, where VERCEL_PROJECT_PRODUCTION_URL is provided automatically).'
  );
}

// Keep NextAuth's own URL handling consistent with the redirect_uri we build below.
process.env.NEXTAUTH_URL = AUTH_BASE_URL;

const TODOIST_REDIRECT_URI = `${AUTH_BASE_URL}/api/auth/callback/todoist`;

// Server-side log only (never sent to the browser) so the exact OAuth redirect URL
// is easy to verify against the one registered in the Todoist App Console.
console.log(`[auth] Todoist OAuth redirect_uri = ${TODOIST_REDIRECT_URI}`);

export const authOptions: NextAuthOptions = {
  providers: [
    TodoistProvider({
      clientId: process.env.TODOIST_CLIENT_ID!,
      clientSecret: process.env.TODOIST_CLIENT_SECRET!,
      authorization: {
        url: "https://todoist.com/oauth/authorize",
        params: {
          scope: "data:read",
          response_type: "code",
          redirect_uri: TODOIST_REDIRECT_URI,
        },
      },
      token: {
        url: "https://todoist.com/oauth/access_token",
      },
    })
  ],
  callbacks: {
    async jwt({ token, account }): Promise<JWT> {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session }): Promise<Session> {
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/',
  },
};

export default NextAuth(authOptions);
