import { z } from 'zod';
import { router, protectedProcedure } from '../_app';
import { queryAuditLogs, getRecordAuditTrail, getUserAuditTrail } from '../../services/audit';

export const auditRouter = router({
  query: protectedProcedure
    .input(
      z.object({
        tableName: z.string(),
        recordId: z.string().optional(),
        userId: z.string().optional(),
        action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return queryAuditLogs(input.tableName, {
        limit: input.limit,
        recordId: input.recordId,
        userId: input.userId,
        action: input.action,
      });
    }),

  getRecordTrail: protectedProcedure
    .input(
      z.object({
        tableName: z.string(),
        recordId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return getRecordAuditTrail(input.tableName, input.recordId);
    }),

  getUserTrail: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(100),
      })
    )
    .query(async ({ input }) => {
      return getUserAuditTrail(input.userId, input.limit);
    }),
});
