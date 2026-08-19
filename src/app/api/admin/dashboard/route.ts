import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { Customer } from '@/models/Customer';
import { ScanEvent } from '@/models/ScanEvent';

function getISTDayBounds() {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find(p => p.type === 'month')!.value, 10);
  const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);

  const startStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+05:30`;
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999+05:30`;

  return {
    startOfDay: new Date(startStr),
    endOfDay: new Date(endStr),
  };
}

export async function GET() {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { startOfDay, endOfDay } = getISTDayBounds();

    const [
      todaysScans,
      todaysUniqueCustomersResult,
      todaysFirstTimePlayers,
      todaysAlreadyPlayedAttempts,
      totalCustomers,
      totalPlayedCustomers,
      totalDuplicateScans,
      suspiciousScans
    ] = await Promise.all([
      // 1. Today's Scans
      ScanEvent.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 2. Today's Unique Customers
      ScanEvent.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: "$instagramIdentityKey" } },
        { $count: "count" }
      ]),
      // 3. Today's First-Time Players (Customers created/played today)
      Customer.countDocuments({
        firstPlayedAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 4. Today's Already-Played Attempts
      ScanEvent.countDocuments({
        result: 'ALREADY_PLAYED',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 5. Total Customers
      Customer.countDocuments({}),
      // 6. Total Played Customers
      Customer.countDocuments({ firstPlayedAt: { $exists: true } }),
      // 7. Total Duplicate Scans
      ScanEvent.countDocuments({ result: 'ALREADY_PLAYED' }),
      // 8. Suspicious/Rejected Scans
      ScanEvent.countDocuments({
        result: { $in: ['INVALID_QR', 'ERROR', 'REJECTED'] },
      }),
    ]);

    const todaysUniqueCustomers = todaysUniqueCustomersResult[0]?.count || 0;

    const data = {
      todaysScans,
      todaysUniqueCustomers,
      todaysFirstTimePlayers,
      todaysAlreadyPlayedAttempts,
      totalCustomers,
      totalPlayedCustomers,
      totalDuplicateScans,
      suspiciousScans,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission to perform this action.' },
        { status: 403 }
      );
    }
    console.error('Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
