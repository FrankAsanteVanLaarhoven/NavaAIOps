import { db } from '../db';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogParams {
  tableName: string;
  action: AuditAction;
  recordId: string;
  userId: string;
  metadata?: any;
}

/**
 * Log a change to the audit trail (immutable)
 */
export async function logChange(params: AuditLogParams) {
  try {
    await db.auditLog.create({
      data: {
        tableName: params.tableName,
        action: params.action,
        recordId: params.recordId,
        userId: params.userId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to log audit trail:', error);
  }
}

/**
 * Query audit logs for a specific table
 */
export async function queryAuditLogs(
  tableName: string,
  options: {
    limit?: number;
    recordId?: string;
    userId?: string;
    action?: AuditAction;
  } = {}
) {
  const { limit = 50, recordId, userId, action } = options;

  return db.auditLog.findMany({
    where: {
      tableName,
      ...(recordId && { recordId }),
      ...(userId && { userId }),
      ...(action && { action }),
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}

/**
 * Get audit trail for a specific record
 */
export async function getRecordAuditTrail(tableName: string, recordId: string) {
  return queryAuditLogs(tableName, { recordId, limit: 100 });
}

/**
 * Get all changes made by a user
 */
export async function getUserAuditTrail(userId: string, limit = 100) {
  return db.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
}
