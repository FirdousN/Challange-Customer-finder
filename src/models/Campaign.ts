import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInstagramAccount {
  name: string;
  username: string;
}

export interface ICampaign extends Document {
  name: string;
  slug: string;
  description?: string;
  status: 'STARTED' | 'PAUSED' | 'ENDED';
  maxChances: number;
  instagramAccounts: IInstagramAccount[];
  startDate?: Date;
  endDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const instagramAccountSchema = new Schema<IInstagramAccount>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['STARTED', 'PAUSED', 'ENDED'],
      default: 'PAUSED',
      required: true,
    },
    maxChances: {
      type: Number,
      required: true,
      default: 1,
    },
    instagramAccounts: {
      type: [instagramAccountSchema],
      default: [],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ status: 1 });

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', campaignSchema);
