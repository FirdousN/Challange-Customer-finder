import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { z } from 'zod';
import { parseInstagramQr } from '@/lib/qr/parser';
import { getInstagramIdentityKey } from '@/lib/identity/instagram';
import { Customer } from '@/models/Customer';
import { Campaign } from '@/models/Campaign';
import { CampaignParticipation } from '@/models/CampaignParticipation';
import { ScanEvent } from '@/models/ScanEvent';

const scanSchema = z.object({
  rawPayload: z.string().min(1).max(2000),
  scannerDeviceHash: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireRole('STAFF');
    } catch (authError: unknown) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = scanSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid request payload' }, { status: 400 });
    }

    const { rawPayload, scannerDeviceHash } = result.data;

    let parsedQr;
    try {
      parsedQr = parseInstagramQr(rawPayload);
    } catch (err: unknown) {
      // Create a fast ScanEvent for invalid QR
      await connectDB();
      await ScanEvent.create({
        staffId: user._id,
        rawQrValue: rawPayload,
        scannerDeviceHash,
        result: 'INVALID_QR',
        riskLevel: 'LOW',
        riskReasons: [err instanceof Error ? err.message : 'Invalid QR parsing error'],
      });
      return NextResponse.json(
        { success: false, error: err instanceof Error ? err.message : 'Invalid QR code' },
        { status: 400 }
      );
    }

    await connectDB();

    const identityKey = getInstagramIdentityKey(parsedQr.instagramUsername);

    // Find active campaign
    const campaign = await Campaign.findOne({ status: 'STARTED' });
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'The challenge is currently unavailable.' },
        { status: 400 }
      );
    }

    // Upsert Customer
    const customer = await Customer.findOneAndUpdate(
      { instagramIdentityKey: identityKey },
      {
        $set: {
          instagramUsername: parsedQr.normalizedUsername,
          instagramQrRawPayload: parsedQr.rawPayload,
          instagramQrPayloadHash: parsedQr.payloadHash,
          instagramQrQueryParams: parsedQr.queryParams,
          instagramQrSource: parsedQr.utm_source || undefined,
          instagramProfileUrl: `https://www.instagram.com/${parsedQr.normalizedUsername}`,
          lastSeenAt: new Date(),
          lastScannedQrAt: new Date(),
        },
        $inc: { scanCount: 1 },
        $setOnInsert: {
          firstSeenAt: new Date(),
          participationCount: 0,
        }
      },
      { new: true, upsert: true }
    );

    // Check participation
    const participation = await CampaignParticipation.findOne({
      campaignId: campaign._id,
      instagramIdentityKey: identityKey,
    });

    let scanResult: 'NEW' | 'ALREADY_PLAYED' = 'NEW';
    
    if (participation) {
      scanResult = 'ALREADY_PLAYED';
    }

    // Log the scan event
    await ScanEvent.create({
      campaignId: campaign._id,
      staffId: user._id,
      customerId: customer._id,
      instagramIdentityKey: identityKey,
      rawQrValue: parsedQr.rawPayload,
      qrPayloadHash: parsedQr.payloadHash,
      scannerDeviceHash,
      result: scanResult,
      riskLevel: 'LOW',
    });

    if (scanResult === 'ALREADY_PLAYED') {
      return NextResponse.json({
        success: true,
        result: scanResult,
        customer: {
          id: customer._id,
          instagramUsername: customer.instagramUsername,
          firstSeenAt: customer.firstSeenAt,
          scanCount: customer.scanCount,
        },
        participation: {
          playedAt: participation?.playedAt,
          chancesEarned: participation?.chancesEarned,
          chancesUsed: participation?.chancesUsed,
          status: participation?.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: scanResult,
      customer: {
        id: customer._id,
        instagramUsername: customer.instagramUsername,
        instagramProfileUrl: customer.instagramProfileUrl,
        firstSeenAt: customer.firstSeenAt,
        lastSeenAt: customer.lastSeenAt,
        scanCount: customer.scanCount,
      },
      participation: null,
    });

  } catch (error: unknown) {
    console.error('Scan API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to check customer details. Please try again.' },
      { status: 500 }
    );
  }
}
