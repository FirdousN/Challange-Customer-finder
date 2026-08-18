import { connectDB } from '@/lib/db/mongoose';
import { AuditLog, IAuditLog } from '@/models/AuditLog';
import { Types } from 'mongoose';

interface LogOptions {
  actorId?: Types.ObjectId | string;
  actorRole?: string;
  action: IAuditLog['action'];
  entityType?: string;
  entityId?: string | Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipHash?: string;
}

export async function logAdminAction(options: LogOptions) {
  try {
    await connectDB();
    await AuditLog.create({
      actorId: options.actorId ? new Types.ObjectId(options.actorId.toString()) : undefined,
      actorRole: options.actorRole,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId?.toString(),
      metadata: options.metadata,
      ipHash: options.ipHash,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // We intentionally don't throw to avoid breaking the main user flow.
  }
}
