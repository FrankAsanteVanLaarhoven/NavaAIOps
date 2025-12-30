import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { createHash } from 'crypto';
import type { ExecutionLogEntry } from '../ai/cmdp-loop';

/**
 * Certificate Generator
 * Creates tamper-proof PDF certificates for verified executions
 */

export const ExecutionLogSchema = z.object({
  step: z.number(),
  action: z.object({ type: z.string(), params: z.any() }),
  validationRuleBased: z.object({
    allowed: z.boolean(),
    violations: z.array(z.string()),
  }),
  verificationAgent: z.object({
    approved: z.boolean(),
    reason: z.string().optional(),
    warning: z.string().optional(),
  }),
  executionStatus: z.enum(['SUCCESS', 'FAILED', 'SKIPPED']).optional(),
  timestamp: z.date(),
});

/**
 * Generate hash for certificate integrity
 */
async function generateHash(executionLogs: ExecutionLogEntry[]): Promise<string> {
  const data = JSON.stringify(executionLogs);
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Generate PDF certificate for execution
 */
export async function generateCertificate({
  executionLogs,
  planId,
  workspaceId,
}: {
  executionLogs: ExecutionLogEntry[];
  planId: string;
  workspaceId: string;
}): Promise<{ pdfBuffer: Buffer; pdfHash: string }> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const pdfHash = await generateHash(executionLogs);
        resolve({ pdfBuffer, pdfHash });
      });
      doc.on('error', reject);

      const now = new Date();

      // Header
      doc.fontSize(16).text('NavaFlow Autonomous SRE Certificate', 50, 50, {
        align: 'center',
      });
      doc.fontSize(10).text(`Generated: ${now.toISOString()}`, 50, 75, {
        align: 'center',
      });

      // Metadata
      doc.fontSize(10).text(`Workspace ID: ${workspaceId}`, 50, 100);
      doc.text(`Plan ID: ${planId}`, 50, 115);
      doc.text(`Steps Executed: ${executionLogs.length}`, 50, 130);

      let yPosition = 160;

      // Execution Logs
      executionLogs.forEach((log, i) => {
        // Section Header
        doc.fontSize(12).text(`STEP ${i + 1}: ${log.action.type}`, 50, yPosition);
        yPosition += 20;

        // Action Details
        doc.fontSize(10).text(`Target: ${log.action.params?.target || 'N/A'}`, 70, yPosition);
        yPosition += 15;
        doc.fontSize(9).text(`Params: ${JSON.stringify(log.action.params)}`, 70, yPosition, {
          width: 500,
        });
        yPosition += 20;

        // Rule-Based Validation
        doc.fontSize(10).text('Rule-Based Validation:', 70, yPosition);
        yPosition += 15;
        doc.fontSize(9).text(
          `Allowed: ${log.validationRuleBased.allowed ? 'YES' : 'NO'}`,
          80,
          yPosition,
          { color: log.validationRuleBased.allowed ? '#16a34a' : '#dc2626' }
        );
        yPosition += 15;

        if (!log.validationRuleBased.allowed && log.validationRuleBased.violations.length > 0) {
          doc.fontSize(9).text('Violations:', 80, yPosition, { color: '#dc2626' });
          yPosition += 15;
          log.validationRuleBased.violations.forEach((v) => {
            doc.fontSize(8).text(`- ${v}`, 90, yPosition, { color: '#dc2626' });
            yPosition += 12;
          });
        }

        // Verification Agent
        yPosition += 10;
        doc.fontSize(10).text('Verification Agent (LLM):', 70, yPosition);
        yPosition += 15;
        doc.fontSize(9).text(
          `Status: ${log.verificationAgent.approved ? 'APPROVED' : 'REJECTED'}`,
          80,
          yPosition,
          { color: log.verificationAgent.approved ? '#16a34a' : '#dc2626' }
        );
        yPosition += 15;

        if (log.verificationAgent.warning) {
          doc.fontSize(9).text(`Warning: ${log.verificationAgent.warning}`, 80, yPosition, {
            color: '#d97706',
          });
          yPosition += 15;
        } else if (!log.verificationAgent.approved && log.verificationAgent.reason) {
          doc.fontSize(9).text(`Reason: ${log.verificationAgent.reason}`, 80, yPosition, {
            color: '#dc2626',
          });
          yPosition += 15;
        }

        // Execution Status
        if (log.executionStatus) {
          yPosition += 10;
          doc.fontSize(9).text(`Execution: ${log.executionStatus}`, 80, yPosition, {
            color:
              log.executionStatus === 'SUCCESS'
                ? '#16a34a'
                : log.executionStatus === 'FAILED'
                ? '#dc2626'
                : '#6b7280',
          });
          yPosition += 15;
        }

        yPosition += 20; // Step padding
      });

      // Footer / Hash
      yPosition += 20;
      const hash = await generateHash(executionLogs);
      doc.fontSize(8).text(`Certificate Hash: ${hash}`, 50, yPosition, { color: '#9ca3af' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
