import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScanEvent extends Document {
  staffId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  instagramIdentityKey?: string;
  rawQrValue?: string;
  qrPayloadHash?: string;
  scannerDeviceHash?: string;
  scannerDeviceInfo?: Record<string, unknown>;
  result: 'NEW' | 'ALREADY_PLAYED' | 'SUSPICIOUS' | 'INVALID_QR' | 'REJECTED' | 'ERROR';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReasons?: string[];
  createdAt: Date;
}

const scanEventSchema = new Schema<IScanEvent>(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    instagramIdentityKey: {
      type: String,
    },
    rawQrValue: {
      type: String,
    },
    qrPayloadHash: {
      type: String,
    },
    scannerDeviceHash: {
      type: String,
    },
    scannerDeviceInfo: {
      type: Schema.Types.Mixed,
    },
    result: {
      type: String,
      enum: [
        'NEW',
        'ALREADY_PLAYED',
        'SUSPICIOUS',
        'INVALID_QR',
        'REJECTED',
        'ERROR',
      ],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    riskReasons: {
      type: [String],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
scanEventSchema.index({ instagramIdentityKey: 1 });
scanEventSchema.index({ scannerDeviceHash: 1 });

export const ScanEvent: Model<IScanEvent> =
  mongoose.models.ScanEvent || mongoose.model<IScanEvent>('ScanEvent', scanEventSchema);
