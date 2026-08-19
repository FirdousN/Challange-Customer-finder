import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { Customer } from '@/models/Customer';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }

    await connectDB();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { instagramUsername: { $regex: search, $options: 'i' } },
        { instagramIdentityKey: { $regex: search, $options: 'i' } },
      ];
    }

    if (status === 'played') {
      query.firstPlayedAt = { $exists: true };
    } else if (status === 'unplayed') {
      query.firstPlayedAt = { $exists: false };
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ lastScannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }
    console.error('Customers API Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
