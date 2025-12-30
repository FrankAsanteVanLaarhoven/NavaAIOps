import { z } from 'zod';
import { router, protectedProcedure } from '../_app';
import { createWorkflow, triggerWorkflows, WorkflowTriggerSchema } from '../../services/workflow';
import { db } from '../../db';
import { logChange } from '../../services/audit';

export const workflowsRouter = router({
  create: protectedProcedure
    .input(WorkflowTriggerSchema)
    .mutation(async ({ input, ctx }) => {
      const workflow = await createWorkflow(input, ctx.user.id);
      return workflow;
    }),

  list: protectedProcedure
    .input(
      z.object({
        channelId: z.string().optional(),
        threadId: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const workflows = await db.workflowTrigger.findMany({
        where: {
          ...(input.channelId && { channelId: input.channelId }),
          ...(input.threadId && { threadId: input.threadId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      return workflows;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        enabled: z.boolean().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const workflow = await db.workflowTrigger.update({
        where: { id: input.id },
        data: {
          ...(input.enabled !== undefined && { enabled: input.enabled }),
          ...(input.name && { name: input.name }),
        },
      });

      await logChange({
        tableName: 'WorkflowTrigger',
        action: 'UPDATE',
        recordId: workflow.id,
        userId: ctx.user.id,
        metadata: { enabled: input.enabled, name: input.name },
      });

      return workflow;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await logChange({
        tableName: 'WorkflowTrigger',
        action: 'DELETE',
        recordId: input.id,
        userId: ctx.user.id,
      });

      await db.workflowTrigger.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
