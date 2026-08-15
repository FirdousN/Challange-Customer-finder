import { NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await requireAuth();

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
