import { initTRPC } from '@trpc/server';
import { TRPCError } from '@trpc/server';
import superjson from 'superjson';

export interface Context {
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export const createTRPCContext = async (opts?: { req?: Request }): Promise<Context> => {
  // For now, we'll use a simple session check
  // In production, implement proper authentication
  // This will be called from the API route handler
  
  // In production, extract user from session/cookie
  // For now, return null user (public access)
  return { user: null };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to be non-null
    },
  });
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
