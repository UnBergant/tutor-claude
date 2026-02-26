import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/shared/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.image = token.picture as string | null;
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = request.nextUrl.pathname === "/login";

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", request.nextUrl.origin));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
});
