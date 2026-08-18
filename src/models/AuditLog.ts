import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole?: string;
  action:
    | 'STAFF_LOGIN'
    | 'STAFF_LOGOUT'
    | 'QR_SCANNED'
    | 'CUSTOMER_CREATED'
    | 'CUSTOMER_FOUND'
    | 'CUSTOMER_VIEWED'
    | 'PARTICIPATION_CREATED'
    | 'PARTICIPATION_BLOCKED'
    | 'PARTICIPATION_REJECTED'
    | 'PARTICIPATION_ALLOWED'
    | 'PARTICIPATION_CONFIRMED'
    | 'ADMIN_LOGIN'
    | 'ADMIN_LOGOUT'
    | 'CAMPAIGN_CREATED'
    | 'CAMPAIGN_UPDATED'
    | 'CAMPAIGN_STARTED'
    | 'CAMPAIGN_PAUSED'
    | 'CAMPAIGN_ENDED'
    | 'STAFF_CREATED'
    | 'STAFF_UPDATED'
    | 'STAFF_ACTIVATED'
    | 'STAFF_DEACTIVATED'
    | 'STAFF_DISABLED';
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipHash?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    actorRole: {
      type: String,
    },
    action: {
      type: String,
      enum: [
        'STAFF_LOGIN',
        'STAFF_LOGOUT',
        'QR_SCANNED',
        'CUSTOMER_CREATED',
        'CUSTOMER_FOUND',
        'CUSTOMER_VIEWED',
        'PARTICIPATION_CREATED',
        'PARTICIPATION_BLOCKED',
        'PARTICIPATION_REJECTED',
        'PARTICIPATION_ALLOWED',
        'PARTICIPATION_CONFIRMED',
        'ADMIN_LOGIN',
        'ADMIN_LOGOUT',
        'CAMPAIGN_CREATED',
        'CAMPAIGN_UPDATED',
        'CAMPAIGN_STARTED',
        'CAMPAIGN_PAUSED',
        'CAMPAIGN_ENDED',
        'STAFF_CREATED',
        'STAFF_UPDATED',
        'STAFF_ACTIVATED',
        'STAFF_DEACTIVATED',
        'STAFF_DISABLED',
      ],
      required: true,
    },
    entityType: {
      type: String,
    },
    entityId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipHash: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ createdAt: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
