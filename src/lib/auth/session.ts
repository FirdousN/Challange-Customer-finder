import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { env } from '../config/env';

export interface SessionData {
  userId?: string;
  role?: 'STAFF' | 'ADMIN';
  sessionVersion?: number;
}

const getSessionOptions = (role: 'STAFF' | 'ADMIN' = 'STAFF') => {
  const maxAge = role === 'ADMIN' ? 24 * 60 * 60 : 8 * 60 * 60; // 24h for admin, 8h for staff

  return {
    password: env.SESSION_SECRET,
    cookieName: 'yb_auth_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge,
    },
  };
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions('STAFF'));
}

export async function createSession(userId: string, role: 'STAFF' | 'ADMIN'): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions(role));
  session.userId = userId;
  session.role = role;
  session.sessionVersion = 1;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, getSessionOptions('STAFF'));
  session.destroy();
}
