import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import crypto from 'crypto';

const loginSchema = z.object({
  email: z.string({ required_error: 'Please enter a valid email address.' })
    .email('Please enter a valid email address.')
    .transform((e) => e.toLowerCase().trim()),
  
  password: z.string({ required_error: 'Please enter your password.' })
    .min(1, 'Please enter your password.'),
  
  role: z.enum(['ADMIN', 'STAFF'], {
    required_error: 'Please select a role.',
    invalid_type_error: 'Invalid role selected.',
  }), 
});

// Basic in-memory rate limiter for login
const ipLoginAttempts = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const attempt = ipLoginAttempts.get(ip);
  if (!attempt || now - attempt.timestamp > windowMs) {
    ipLoginAttempts.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (attempt.count >= maxAttempts) {
    return false;
  }

  attempt.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please try again later.' } },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 }
      );
    }

    const { email, password, role } = result.data;

    await connectDB();
    
    // Explicitly select passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid login credentials.'
          }
        },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid login credentials.'
          }
        },
        { status: 401 }
      );
    }
    
    //IMPORTANT: Validate role of user
    if (user.role !== role ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid login credentials.'
          },
        },
        { status: 401 }
      )
    }

    // Reset rate limit on success
    ipLoginAttempts.delete(ip);

    await createSession(user.id, user.role);

    user.lastLoginAt = new Date();
    await user.save();

    const ipHash = crypto
      .createHash('sha256')
      .update(ip)
      .digest('hex');

    await AuditLog.create({
      actorId: user._id,
      actorRole: user.role,
      action: user.role === 'ADMIN' ? 'ADMIN_LOGIN' : 'STAFF_LOGIN',
      ipHash,
    });

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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
