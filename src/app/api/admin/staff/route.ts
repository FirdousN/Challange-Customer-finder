import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { logAdminAction } from '@/lib/audit/logger';
import { hashPassword } from '@/lib/auth/password';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    // Do NOT select passwordHash
    const staff = await User.find({}).select('-passwordHash').sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error('Staff GET Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, code: 'INVALID_PAYLOAD', message: 'Missing fields.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ success: false, code: 'CONFLICT', message: 'Email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
    });

    await logAdminAction({
      actorId: user._id,
      actorRole: user.role,
      action: 'STAFF_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      metadata: { email: newUser.email, role: newUser.role }
    });

    const userObj = newUser.toObject();
    // @ts-expect-error type override
    delete userObj.passwordHash;

    return NextResponse.json({ success: true, data: userObj });
  } catch (error) {
    console.error('Staff POST Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}
