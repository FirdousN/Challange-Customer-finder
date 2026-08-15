import { NextRequest, NextResponse } from 'next/server';
import { destroySession, getSession } from '@/lib/auth/session';
import { AuditLog } from '@/models/AuditLog';
import { connectDB } from '@/lib/db/mongoose';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (session.userId && session.role === 'STAFF') {
      try {
        await connectDB();
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
        
        await AuditLog.create({
          actorId: session.userId,
          actorRole: session.role,
          action: 'STAFF_LOGOUT',
          ipHash,
        });
      } catch (e) {
        // Ignore audit log failure on logout
      }
    }

    await destroySession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
