import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const action = url.searchParams.get('action') || '';
    
    const query: Record<string, unknown> = {};
    if (action) {
      query.action = action;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email')
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Audit Logs API Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}
