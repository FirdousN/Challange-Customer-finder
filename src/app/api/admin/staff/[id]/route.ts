import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { logAdminAction } from '@/lib/audit/logger';
import { Types } from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole('ADMIN');
    if (!user) return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, code: 'INVALID_ID', message: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();
    const staff = await User.findById(id).select('-passwordHash').lean();

    if (!staff) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND', message: 'Staff not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (_error) {
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireRole('ADMIN');
    if (!currentUser) return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, code: 'INVALID_ID', message: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { name, role, isActive } = body;

    await connectDB();

    const staff = await User.findById(id);
    if (!staff) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND', message: 'Staff not found.' }, { status: 404 });
    }

    // Prevent deactivating the last active ADMIN
    if (staff.role === 'ADMIN' && isActive === false && staff.isActive === true) {
      const activeAdmins = await User.countDocuments({ role: 'ADMIN', isActive: true });
      if (activeAdmins <= 1) {
        return NextResponse.json(
          { success: false, code: 'CONFLICT', message: 'Cannot deactivate the last active ADMIN.' },
          { status: 409 }
        );
      }
    }

    if (name !== undefined) staff.name = name;
    if (role !== undefined) staff.role = role;
    
    let actionStr = 'STAFF_UPDATED';
    if (isActive !== undefined && staff.isActive !== isActive) {
      staff.isActive = isActive;
      actionStr = isActive ? 'STAFF_ACTIVATED' : 'STAFF_DEACTIVATED';
    }

    await staff.save();

    await logAdminAction({
      actorId: currentUser._id,
      actorRole: currentUser.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: actionStr as any,
      entityType: 'User',
      entityId: staff._id,
      metadata: { name: staff.name, role: staff.role, isActive: staff.isActive }
    });

    const userObj = staff.toObject();
    // @ts-expect-error type override
    delete userObj.passwordHash;

    return NextResponse.json({ success: true, data: userObj });
  } catch (error) {
    console.error('Staff PATCH Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}
