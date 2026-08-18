import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { Customer } from '@/models/Customer';
import { ScanEvent } from '@/models/ScanEvent';
import { CampaignParticipation } from '@/models/CampaignParticipation';
import { Campaign } from '@/models/Campaign';

function getISTDayBounds() {
  const now = new Date();
  
  // Format the current time in IST to extract year, month, day
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  // Format returns "MM/DD/YYYY"
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find(p => p.type === 'month')!.value, 10);
  const day = parseInt(parts.find(p => p.type === 'day')!.value, 10);

  // Note: Date.UTC takes month 0-11
  // We want midnight IST (00:00:00). IST is UTC+5:30.
  // Midnight IST is 18:30:00 UTC the previous day.
  // Instead of complex math, we can create an IST string and parse it.
  
  // A clean way to get the exact Date object for 00:00:00 IST today
  // ISO format string: YYYY-MM-DDTHH:mm:ss.sss+05:30
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
      todaysPlayers,
      totalCustomers,
      alreadyPlayed,
      suspiciousScans,
      activeCampaign,
    ] = await Promise.all([
      // 1. Today's Scans
      ScanEvent.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 2. Today's Players (Participations created today)
      CampaignParticipation.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      // 3. Total Customers
      Customer.countDocuments({}),
      // 4. Already Played (Customers with participationCount > 0)
      Customer.countDocuments({ participationCount: { $gt: 0 } }),
      // 5. Suspicious/Rejected Scans
      ScanEvent.countDocuments({
        result: { $in: ['INVALID_QR', 'ERROR', 'REJECTED'] },
      }),
      // 6. Active Campaign
      Campaign.findOne({ status: 'STARTED' }).lean(),
    ]);

    const eligiblePlayers = totalCustomers - alreadyPlayed;

    const data = {
      todaysScans,
      todaysPlayers,
      totalCustomers,
      alreadyPlayed,
      eligiblePlayers: eligiblePlayers > 0 ? eligiblePlayers : 0,
      suspiciousScans,
      activeCampaign: activeCampaign ? {
        name: activeCampaign.name,
        status: activeCampaign.status,
      } : null,
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
