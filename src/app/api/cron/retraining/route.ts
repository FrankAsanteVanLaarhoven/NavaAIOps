import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';

/**
 * Vercel Cron Job for Continuous Learning
 * Runs daily at 2 AM UTC to trigger re-fine-tuning
 */
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Lazy initialize OpenAI to avoid build-time errors
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      success: false,
      message: 'OpenAI API key not configured. Skipping retraining job.',
    }, { status: 200 }); // Return 200 to not fail the build
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    // Verify cron secret (Vercel sets this automatically)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = 'default'; // In production, iterate over all workspaces
    const modelId = process.env.FINETUNED_MODEL_ID || 'ft:gpt-4o-mini-navaflow-devops-v1';

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
      return NextResponse.json({
        success: false,
        message: `Not enough new data for re-training. Found ${successfulLogs.length} successful resolutions, need at least 50.`,
        recordsFound: successfulLogs.length,
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

    // 4. Create OpenAI File
    const file = await openai.files.create({
      file: fs.createReadStream(filepath),
      purpose: 'fine-tune',
    });

    // 5. Start Fine-Tuning Job
    const job = await openai.fineTuning.jobs.create({
      training_file: file.id,
      model: modelId.startsWith('ft:') 
        ? modelId 
        : `ft:${modelId}`,
      suffix: `continuous-${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      recordsUsed: successfulLogs.length,
      fileId: file.id,
      message: `Fine-tuning job ${job.id} started with ${successfulLogs.length} records.`,
    });
  } catch (error: any) {
    console.error('Retraining cron job failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to trigger retraining job' 
      },
      { status: 500 }
    );
  }
}
