/**
 * Authentication utilities and configuration
 * 
 * This file provides authentication helpers and NextAuth configuration
 */

import { NextAuthOptions } from 'next-auth';
// import { PrismaAdapter } from '@next-auth/prisma-adapter';
// Note: Install with: npm install @next-auth/prisma-adapter
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { db } from './db';

/**
 * NextAuth configuration
 */
export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(db), // Uncomment when @next-auth/prisma-adapter is installed
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // Log sign-in events for audit
      await db.auditLog.create({
        data: {
          tableName: 'User',
          action: 'SIGN_IN',
          recordId: user.id,
          userId: user.id,
          metadata: JSON.stringify({
            provider: account?.provider,
            email: user.email,
          }),
        },
      });
    },
  },
};

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  // This will be used in server components/API routes
  // Implementation depends on NextAuth session retrieval
  return null;
}

/**
 * Check if user has required role
 */
export function hasRole(user: any, role: string): boolean {
  // TODO: Implement role-based access control
  return true;
}

/**
 * Check if user has permission
 */
export function hasPermission(user: any, permission: string): boolean {
  // TODO: Implement permission system
  return true;
}
