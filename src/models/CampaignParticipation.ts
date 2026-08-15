import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaignParticipation extends Document {
  campaignId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  instagramIdentityKey: string;
  instagramUserId?: string;
  instagramUsername?: string;
  instagramDisplayName?: string;
  qrId?: string;
  rawQrValue?: string;
  qrPayloadHash?: string;
  instagramUrl?: string;
  scannerDeviceHash?: string;
  scannerDeviceInfo?: Record<string, unknown>;
  chancesEarned: number;
  chancesUsed: number;
  verifiedAccounts?: string[];
  status: 'PLAYED' | 'REJECTED' | 'BLOCKED';
  playedAt: Date;
  staffId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const campaignParticipationSchema = new Schema<ICampaignParticipation>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    instagramIdentityKey: {
      type: String,
      required: true,
    },
    instagramUserId: {
      type: String,
    },
    instagramUsername: {
      type: String,
    },
    instagramDisplayName: {
      type: String,
    },
    qrId: {
      type: String,
    },
    rawQrValue: {
      type: String,
    },
    qrPayloadHash: {
      type: String,
    },
    instagramUrl: {
      type: String,
    },
    scannerDeviceHash: {
      type: String,
    },
    scannerDeviceInfo: {
      type: Schema.Types.Mixed,
    },
    chancesEarned: {
      type: Number,
      default: 0,
    },
    chancesUsed: {
      type: Number,
      default: 0,
    },
    verifiedAccounts: {
      type: [String],
    },
    status: {
      type: String,
      enum: ['PLAYED', 'REJECTED', 'BLOCKED'],
      required: true,
    },
    playedAt: {
      type: Date,
      default: Date.now,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
campaignParticipationSchema.index(
  { campaignId: 1, instagramIdentityKey: 1 },
  { unique: true }
);
campaignParticipationSchema.index({ customerId: 1 });
campaignParticipationSchema.index({ playedAt: 1 });

export const CampaignParticipation: Model<ICampaignParticipation> =
  mongoose.models.CampaignParticipation ||
  mongoose.model<ICampaignParticipation>(
    'CampaignParticipation',
    campaignParticipationSchema
  );
