import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * Prepare training data for fine-tuning DevOps-specialized LLM
 * Exports: Incidents, Audit Logs, Code Context
 */
async function exportTrainingData() {
  const outputDir = join(process.cwd(), 'data');
  const outputPath = join(outputDir, 'training-data.jsonl');

  // Create data directory if it doesn't exist
  mkdirSync(outputDir, { recursive: true });

  const trainingData: any[] = [];

  try {
    // 1. Export Incidents (Incident Resolution)
    console.log('📊 Exporting incidents...');
    const incidents = await prisma.incidentData.findMany({
      include: {
        thread: {
          include: {
            channel: true,
            messages: {
              take: 5,
              orderBy: { createdAt: 'asc' },
              include: {
                user: true,
              },
            },
          },
        },
      },
      take: 1000,
      orderBy: { createdAt: 'desc' },
    });

    for (const incident of incidents) {
      const input = {
        type: 'incident',
        title: incident.thread?.title || 'Incident',
        description: incident.impact || '',
        severity: incident.severity,
        status: incident.status,
        channel: incident.thread?.channel?.name || 'unknown',
      };

      const output = {
        type: 'resolution',
        status: incident.status,
        root_cause: incident.rootCause || 'Not yet identified',
        fix: incident.fix || 'Pending resolution',
        timeline: incident.timeline ? JSON.parse(incident.timeline) : [],
      };

      trainingData.push({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert Site Reliability Engineer (SRE). Given the following incident data, provide a resolution or next step.',
          },
          {
            role: 'user',
            content: JSON.stringify(input),
          },
          {
            role: 'assistant',
            content: JSON.stringify(output),
          },
        ],
      });
    }

    console.log(`✅ Exported ${incidents.length} incidents`);

    // 2. Export Audit Logs (Change Analysis)
    console.log('📊 Exporting audit logs...');
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      take: 500,
      orderBy: { timestamp: 'desc' },
    });

    for (const log of auditLogs) {
      const metadata = log.metadata ? JSON.parse(log.metadata) : {};

      trainingData.push({
        messages: [
          {
            role: 'system',
            content:
              'You are a DevOps Audit Specialist. Analyze the following change log entry and determine the root cause or impact.',
          },
          {
            role: 'user',
            content: `Action: ${log.action} on table ${log.tableName} by user ${log.userId} at ${log.timestamp}.\nMetadata: ${JSON.stringify(metadata)}`,
          },
          {
            role: 'assistant',
            content: `Root Cause Analysis: ${log.action} on ${log.tableName} likely indicates a ${log.action === 'DELETE' ? 'data deletion or cleanup' : log.action === 'UPDATE' ? 'configuration change or update' : 'new record creation'}. ${log.action === 'DELETE' ? 'Recommend reviewing RBAC policies and ensuring proper authorization.' : 'Verify the change was authorized and follows change management procedures.'}`,
          },
        ],
      });
    }

    console.log(`✅ Exported ${auditLogs.length} audit logs`);

    // 3. Export Code Context (From Context Modules)
    console.log('📊 Exporting code context...');
    const allModules = await prisma.threadModule.findMany({
      where: {
        type: {
          in: ['github', 'linear', 'notion'],
        },
      },
      include: {
        thread: {
          include: {
            channel: true,
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
      take: 300,
    });

    // Filter out modules with null/empty data
    const codeContext = allModules.filter((m) => m.data && m.data.trim() !== '');

    for (const module of codeContext) {
      const config = module.data ? JSON.parse(module.data) : {};
      const messageContent = module.thread?.messages[0]?.content || '';

      trainingData.push({
        messages: [
          {
            role: 'system',
            content:
              'You are a Code Reviewer. Analyze the following code snippet or repository context linked to a conversation.',
          },
          {
            role: 'user',
            content: `Type: ${module.type}\nConfig: ${JSON.stringify(config)}\nContext: ${messageContent.substring(0, 500)}...`,
          },
          {
            role: 'assistant',
            content: `Review of ${module.type} context module: Ensure RBAC permissions are appropriate for the requested operation. No secrets were hardcoded. Code follows best practices for ${module.type === 'github' ? 'version control and CI/CD' : module.type === 'linear' ? 'issue tracking' : 'documentation'}.`,
          },
        ],
      });
    }

    console.log(`✅ Exported ${codeContext.length} code context entries`);

    // Write to JSONL file (one JSON object per line)
    const jsonlContent = trainingData.map((item) => JSON.stringify(item)).join('\n');
    writeFileSync(outputPath, jsonlContent, 'utf-8');

    console.log(`\n✅ Successfully exported ${trainingData.length} training examples`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`\n📊 Breakdown:`);
    console.log(`   - Incidents: ${incidents.length}`);
    console.log(`   - Audit Logs: ${auditLogs.length}`);
    console.log(`   - Code Context: ${codeContext.length}`);
  } catch (error) {
    console.error('❌ Error exporting training data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
exportTrainingData()
  .then(() => {
    console.log('\n✅ Data preparation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to prepare training data:', error);
    process.exit(1);
  });
