import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  instagramIdentityKey: string;
  instagramUserId?: string;
  instagramUsername?: string;
  instagramDisplayName?: string;
  instagramProfileUrl?: string;
  instagramQrRawPayload?: string;
  instagramQrPayloadHash?: string;
  instagramQrQueryParams?: Record<string, string>;
  instagramQrSource?: string;
  igsh?: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastScannedQrAt?: Date;
  scanCount: number;
  firstPlayedAt?: Date;
  lastPlayedAt?: Date;
  playedByStaffId?: mongoose.Types.ObjectId;
  participationCount: number; // Keeping this for historical compatibility
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
    instagramProfileUrl: {
      type: String,
    },
    instagramQrRawPayload: {
      type: String,
    },
    instagramQrPayloadHash: {
      type: String,
    },
    instagramQrQueryParams: {
      type: Schema.Types.Mixed,
    },
    instagramQrSource: {
      type: String,
    },
    igsh: {
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
    lastScannedQrAt: {
      type: Date,
    },
    scanCount: {
      type: Number,
      default: 1,
    },
    firstPlayedAt: {
      type: Date,
    },
    lastPlayedAt: {
      type: Date,
    },
    playedByStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    participationCount: {
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
customerSchema.index({ instagramQrPayloadHash: 1 });

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
