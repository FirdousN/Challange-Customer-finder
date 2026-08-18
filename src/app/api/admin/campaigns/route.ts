import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { Campaign } from '@/models/Campaign';
import { logAdminAction } from '@/lib/audit/logger';

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission.' },
        { status: 403 }
      );
    }

    await connectDB();

    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission.' },
        { status: 403 }
      );
    }
    console.error('Campaigns API Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole('ADMIN');
    if (!user) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, instagramAccounts, startDate, status } = body;

    if (!name || !instagramAccounts || !Array.isArray(instagramAccounts)) {
      return NextResponse.json(
        { success: false, code: 'INVALID_PAYLOAD', message: 'Missing required campaign fields.' },
        { status: 400 }
      );
    }

    await connectDB();

    // Prevent duplicate active campaigns
    if (status === 'STARTED') {
      const activeCampaign = await Campaign.findOne({ status: 'STARTED' });
      if (activeCampaign) {
        return NextResponse.json(
          { success: false, code: 'CONFLICT', message: 'Another campaign is already STARTED.' },
          { status: 409 }
        );
      }
    }

    const campaign = await Campaign.create({
      name,
      description,
      instagramAccounts,
      startDate: startDate ? new Date(startDate) : new Date(),
      status: status || 'PAUSED',
    });

    await logAdminAction({
      actorId: user._id,
      actorRole: user.role,
      action: 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      metadata: { name: campaign.name, status: campaign.status }
    });

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'You do not have permission.' },
        { status: 403 }
      );
    }
    console.error('Campaigns API POST Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An internal error occurred.' },
      { status: 500 }
    );
  }
}
