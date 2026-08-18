import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { connectDB } from '@/lib/db/mongoose';
import { Campaign } from '@/models/Campaign';
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
      return NextResponse.json({ success: false, code: 'INVALID_ID', message: 'Invalid ID format.' }, { status: 400 });
    }

    await connectDB();
    const campaign = await Campaign.findById(id).lean();

    if (!campaign) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND', message: 'Campaign not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Campaign GET Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole('ADMIN');
    if (!user) return NextResponse.json({ success: false, code: 'FORBIDDEN', message: 'Forbidden' }, { status: 403 });

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, code: 'INVALID_ID', message: 'Invalid ID format.' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, status, instagramAccounts } = body;

    await connectDB();

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, code: 'NOT_FOUND', message: 'Campaign not found.' }, { status: 404 });
    }

    const oldStatus = campaign.status;

    // Prevent duplicate active campaigns
    if (status === 'STARTED' && oldStatus !== 'STARTED') {
      const activeCampaign = await Campaign.findOne({ status: 'STARTED' });
      if (activeCampaign) {
        return NextResponse.json(
          { success: false, code: 'CONFLICT', message: 'Another campaign is already STARTED.' },
          { status: 409 }
        );
      }
    }

    if (name !== undefined) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (status !== undefined) campaign.status = status;
    if (instagramAccounts !== undefined) campaign.instagramAccounts = instagramAccounts;

    await campaign.save();

    let auditAction = 'CAMPAIGN_UPDATED';
    if (status === 'STARTED' && oldStatus !== 'STARTED') auditAction = 'CAMPAIGN_STARTED';
    else if (status === 'PAUSED' && oldStatus !== 'PAUSED') auditAction = 'CAMPAIGN_PAUSED';
    else if (status === 'ENDED' && oldStatus !== 'ENDED') auditAction = 'CAMPAIGN_ENDED';

    await logAdminAction({
      actorId: user._id,
      actorRole: user.role,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      action: auditAction as any,
      entityType: 'Campaign',
      entityId: campaign._id,
      metadata: { previousStatus: oldStatus, newStatus: status, name: campaign.name }
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Campaign PATCH Error:', error);
    return NextResponse.json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal error' }, { status: 500 });
  }
}
