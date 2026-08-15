import { getSession } from './session';
import { User } from '@/models/User';
import { connectDB } from '@/lib/db/mongoose';
import { NextResponse } from 'next/server';

export class AuthError extends Error {
  code: string;
  statusCode: number;
  constructor(message: string, code: string, statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.userId || !session.role) {
    throw new AuthError('Unauthorized', 'UNAUTHORIZED');
  }

  await connectDB();
  const user = await User.findById(session.userId);

  if (!user) {
    throw new AuthError('Invalid session', 'INVALID_SESSION');
  }

  if (!user.isActive) {
    throw new AuthError('Account disabled', 'ACCOUNT_DISABLED', 403);
  }

  return user;
}

export async function requireRole(role: 'STAFF' | 'ADMIN') {
  const user = await requireAuth();

  if (role === 'ADMIN' && user.role !== 'ADMIN') {
    throw new AuthError('Forbidden', 'FORBIDDEN', 403);
  }

  return user;
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  console.error('Unhandled auth error:', error);
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 }
  );
}
