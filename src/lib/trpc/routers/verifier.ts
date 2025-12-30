import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../_app';
import { planChain, executeCMDPChain } from '@/lib/ai/cmdp-loop';
import { generateCertificate } from '@/lib/ai/certifier';
import { checkCompliance } from '@/lib/ai/verifier';

/**
 * Verifier Router
 * Handles compliance verification and certificate generation
 */
export const verifierRouter = router({
  /**
   * Verify compliance for an incident
   */
  verifyCompliance: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
        workspaceId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { incidentId, workspaceId } = input;

      try {
        // Get incident context
        const incident = await ctx.prisma.incidentData.findUnique({
          where: { threadId: incidentId },
          include: {
            thread: {
              include: {
                channel: true,
                messages: {
                  take: 5,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
          },
        });

        if (!incident) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Incident not found',
          });
        }

        // Create context for CMDP planning
        const context = {
          incident: {
            id: incidentId,
            severity: incident.severity,
            status: incident.status,
            impact: incident.impact,
          },
          metrics: [],
          query: `Verify compliance for incident: ${incident.thread?.title || 'Untitled'}`,
        };

        // Step 1: Generate plan
        const plan = await planChain({
          context,
          modelId: 'gpt-4o-mini',
        });

        // Step 2: Execute CMDP chain (includes compliance checking)
        const executionLog = await executeCMDPChain({
          plan,
          context,
          workspaceId,
          incidentId,
        });

        // Calculate overall compliance score
        const complianceChecks = executionLog
          .filter((log) => log.complianceCheck)
          .map((log) => log.complianceCheck!);

        const overallScore =
          complianceChecks.length > 0
            ? complianceChecks.reduce((sum, check) => sum + check.score, 0) /
              complianceChecks.length
            : 1.0;

        const allCompliant = complianceChecks.every((check) => check.isCompliant);

        return {
          status: allCompliant ? 'passed' : 'failed',
          score: overallScore,
          verified_steps: executionLog,
          allCompliant,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to verify compliance',
        });
      }
    }),

  /**
   * Generate compliance certificate
   */
  generateCertificate: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
        workspaceId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const certificate = await generateCertificate({
          incidentId: input.incidentId,
          workspaceId: input.workspaceId,
        });

        return certificate;
      } catch (error: any) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: error.message || 'Compliance log not found. Run verification first.',
        });
      }
    }),

  /**
   * Check compliance for proposed actions (pre-flight check)
   */
  checkCompliance: protectedProcedure
    .input(
      z.object({
        incidentId: z.string(),
        proposedActions: z.array(
          z.object({
            type: z.string(),
            target: z.string(),
            params: z.any(),
          })
        ),
        workspaceId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await checkCompliance({
          input: {
            incidentId: input.incidentId,
            proposedActions: input.proposedActions,
          },
          workspaceId: input.workspaceId,
        });

        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to check compliance',
        });
      }
    }),
});
