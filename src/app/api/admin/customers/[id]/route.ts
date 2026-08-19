import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { Customer } from '@/models/Customer';
import { ScanEvent } from '@/models/ScanEvent';
import { Types } from 'mongoose';
import { logAdminAction } from '@/lib/audit/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, code: 'INVALID_ID', message: 'Invalid customer ID format.' },
        { status: 400 }
      );
    }

    await connectDB();

    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return NextResponse.json(
        { success: false, code: 'NOT_FOUND', message: 'Customer not found.' },
        { status: 404 }
      );
    }

    // Fetch recent scans concurrently
    const [recentScans] = await Promise.all([
      ScanEvent.find({ customerId: customer._id }).sort({ createdAt: -1 }).limit(10).populate('staffId', 'name').lean()
    ]);

    // Audit log this view
    await logAdminAction({
      actorId: user._id,
      actorRole: user.role,
      action: 'CUSTOMER_VIEWED',
      entityType: 'Customer',
      entityId: customer._id.toString(),
      metadata: { instagramUsername: customer.instagramUsername }
    });

    return NextResponse.json({
      success: true,
      data: {
        customer,
        recentScans
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }
    console.error('Customer Detail API Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
