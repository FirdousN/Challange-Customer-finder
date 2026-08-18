import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { ScanEvent } from '@/models/ScanEvent';
import { FilterQuery } from 'mongoose';

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
    const status = url.searchParams.get('status') || '';
    
    // We cannot efficiently search by instagramUsername here unless we aggregate or have it denormalized.
    // The ScanEvent schema has `rawPayload` which contains the URL. We could search that, or we'd need to populate.
    // For simplicity and performance, we'll allow filtering by status/result first.
    
    const query: FilterQuery<typeof ScanEvent> = {};

    if (status) {
      query.result = status;
    }

    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      ScanEvent.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('customerId', 'instagramUsername')
        .populate('staffId', 'name email')
        .populate('campaignId', 'name')
        .lean(),
      ScanEvent.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: scans,
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
    console.error('Scans API Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
