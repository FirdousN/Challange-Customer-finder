import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { z } from 'zod';
import { parseInstagramQr } from '@/lib/qr/parser';
import { getInstagramIdentityKey } from '@/lib/identity/instagram';
import { Customer } from '@/models/Customer';
import { ScanEvent } from '@/models/ScanEvent';

const scanSchema = z.object({
  rawPayload: z.string().min(1).max(2000),
  scannerDeviceHash: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const tStart = performance.now();
  try {
    let user;
    try {
      user = await requireRole('STAFF');
    } catch (authError: unknown) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = scanSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ success: false, code: 'INVALID_PAYLOAD', message: 'Invalid request payload' }, { status: 400 });
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
        { success: false, code: 'INVALID_QR', message: err instanceof Error ? err.message : 'Invalid QR code' },
        { status: 400 }
      );
    }

    await connectDB();

    const identityKey = getInstagramIdentityKey(parsedQr.instagramUsername);

    // Attempt to upsert the Customer.
    // We use $setOnInsert to set firstPlayedAt only if the customer is newly created.
    // However, if the customer exists but has NOT played (which shouldn't happen in this new logic but could from old data),
    // we would need to handle that. To be safe, let's first check if the customer exists.
    // We'll use a transaction if possible, or just atomic updates.
    
    // Let's use findOneAndUpdate to try to find and update an existing customer.
    let customer = await Customer.findOne({ instagramIdentityKey: identityKey }).populate('playedByStaffId', 'name');
    let scanResult: 'NEW' | 'ALREADY_PLAYED' = 'NEW';
    let isFirstTime = false;

    const now = new Date();

    if (!customer) {
      // Create new customer
      try {
        customer = await Customer.create({
          instagramIdentityKey: identityKey,
          instagramUsername: parsedQr.normalizedUsername,
          instagramQrRawPayload: parsedQr.rawPayload,
          instagramQrPayloadHash: parsedQr.payloadHash,
          instagramQrQueryParams: parsedQr.queryParams,
          instagramQrSource: parsedQr.utm_source || undefined,
          instagramProfileUrl: `https://www.instagram.com/${parsedQr.normalizedUsername}`,
          igsh: parsedQr.igsh || undefined,
          firstSeenAt: now,
          lastSeenAt: now,
          lastScannedQrAt: now,
          scanCount: 1,
          firstPlayedAt: now,
          lastPlayedAt: now,
          playedByStaffId: user._id,
          participationCount: 1, // for historical compatibility
        });
        isFirstTime = true;
      } catch (createError: unknown) {
        // If duplicate key error, someone else just created it
        if ((createError as { code?: number }).code === 11000) {
          customer = await Customer.findOne({ instagramIdentityKey: identityKey }).populate('playedByStaffId', 'name');
          if (!customer) throw createError;
        } else {
          throw createError;
        }
      }
    }

    // If customer already existed (or we caught a race condition duplicate key)
    if (!isFirstTime) {
      scanResult = 'ALREADY_PLAYED';
      
      // Still update their scan counts and last seen info, but don't change firstPlayedAt
      customer = await Customer.findOneAndUpdate(
        { _id: customer._id },
        {
          $set: {
            lastSeenAt: now,
            lastScannedQrAt: now,
            lastPlayedAt: now,
          },
          $inc: { scanCount: 1 }
        },
        { new: true }
      ).populate('playedByStaffId', 'name');
    }

    // Log the scan event
    await ScanEvent.create({
      staffId: user._id,
      customerId: customer!._id,
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
          id: customer!._id,
          instagramUsername: customer!.instagramUsername,
          firstSeenAt: customer!.firstSeenAt,
          scanCount: customer!.scanCount,
        },
        participation: {
          playedAt: customer!.firstPlayedAt,
          playedByStaffName: (customer!.playedByStaffId as { name?: string })?.name || 'Unknown Staff',
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: scanResult,
      customer: {
        id: customer!._id,
        instagramUsername: customer!.instagramUsername,
        instagramProfileUrl: customer!.instagramProfileUrl,
        firstSeenAt: customer!.firstSeenAt,
        lastSeenAt: customer!.lastSeenAt,
        scanCount: customer!.scanCount,
      },
      participation: {
        playedAt: customer!.firstPlayedAt,
        playedByStaffName: user.name || 'Unknown Staff',
      },
    });

  } catch (error: unknown) {
    console.error('Scan API Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'Unable to check customer details. Please try again.' },
      { status: 500 }
    );
  }
}
