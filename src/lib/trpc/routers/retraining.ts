import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../../_app';
import { db } from '@/lib/db';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const retrainingRouter = router({
  triggerJob: publicProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        modelId: z.string(), // e.g., "ft:gpt-4o-mini-navaflow-devops-v1"
      })
    )
    .mutation(async ({ input }) => {
      // 1. Fetch new success data (last 24h)
      const newLogs = await db.auditLog.findMany({
        where: {
          tableName: 'CMDP_Execution',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        take: 100,
        orderBy: { timestamp: 'desc' },
      });

      // Filter for successful resolutions
      const successfulLogs = newLogs.filter((log) => {
        try {
          const metadata = typeof log.metadata === 'string' 
            ? JSON.parse(log.metadata) 
            : log.metadata;
          return metadata?.finalStatus === 'SUCCESS' || metadata?.status === 'passed';
        } catch {
          return false;
        }
      });

      if (successfulLogs.length < 50) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Not enough new data for re-training. Found ${successfulLogs.length} successful resolutions, need at least 50.`,
        });
      }

      // 2. Format for JSONL (Fine-tuning)
      const data = successfulLogs.map((log) => {
        const metadata = typeof log.metadata === 'string' 
          ? JSON.parse(log.metadata) 
          : log.metadata;

        return {
          messages: [
            {
              role: 'system',
              content: 'You are a Site Reliability Engineer (SRE). Analyze this resolution and provide insights.',
            },
            {
              role: 'user',
              content: metadata?.content || JSON.stringify(metadata) || 'No content',
            },
            {
              role: 'assistant',
              content: metadata?.outcome || metadata?.finalStatus || 'Resolution completed successfully.',
            },
          ],
        };
      });

      // 3. Write to a file in `tmp/` or upload to R2/S3 (Production)
      const tmpDir = path.join(process.cwd(), 'tmp');
      await mkdir(tmpDir, { recursive: true });

      const filename = `retraining-data-${Date.now()}.jsonl`;
      const filepath = path.join(tmpDir, filename);

      // Write JSONL file (one JSON object per line)
      const jsonlContent = data.map((item) => JSON.stringify(item)).join('\n');
      fs.writeFileSync(filepath, jsonlContent, 'utf-8');

      // 4. Create OpenAI File (if using OpenAI for fine-tuning)
      const file = await openai.files.create({
        file: fs.createReadStream(filepath),
        purpose: 'fine-tune',
      });

      // 5. Start Fine-Tuning Job
      const job = await openai.fineTuning.jobs.create({
        training_file: file.id,
        model: input.modelId.startsWith('ft:') 
          ? input.modelId 
          : `ft:${input.modelId}`,
        suffix: `continuous-${Date.now()}`,
      });

      return {
        success: true,
        jobId: job.id,
        recordsUsed: successfulLogs.length,
        fileId: file.id,
        message: `Fine-tuning job ${job.id} started with ${successfulLogs.length} records.`,
      };
    }),

  getJobStatus: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      try {
        const job = await openai.fineTuning.jobs.retrieve(input.jobId);
        return {
          id: job.id,
          status: job.status,
          model: job.fine_tuned_model,
          createdAt: job.created_at,
          finishedAt: job.finished_at,
          trainedTokens: job.trained_tokens,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to retrieve job status',
        });
      }
    }),
});
