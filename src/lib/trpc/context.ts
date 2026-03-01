import { auth, type Session } from '@/lib/auth';
import { db } from '@/lib/db';

export async function createContext(opts: any) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    db,
    session: session as Session | null,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
