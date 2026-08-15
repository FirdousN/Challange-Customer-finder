import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  instagramIdentityKey: string;
  instagramUserId?: string;
  instagramUsername?: string;
  instagramDisplayName?: string;
  qrId?: string;
  rawQrValue?: string;
  qrPayloadHash?: string;
  instagramUrl?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  totalCampaigns: number;
  totalAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    instagramIdentityKey: {
      type: String,
      required: true,
      unique: true,
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
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    totalCampaigns: {
      type: Number,
      default: 0,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerSchema.index({ instagramUsername: 1 });
customerSchema.index({ instagramUserId: 1 });
customerSchema.index({ qrPayloadHash: 1 });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
