import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a test incident for testing the AI SRE Agent
 */
async function createTestIncident() {
  console.log('🔧 Creating test incident...');

  // Find or create an incident channel
  let incidentChannel = await prisma.channel.findFirst({
    where: { type: 'incident' },
  });

  if (!incidentChannel) {
    incidentChannel = await prisma.channel.create({
      data: {
        name: 'Incidents',
        type: 'incident',
      },
    });
    console.log('✅ Created incident channel');
  }

  // Find or create a test user
  let testUser = await prisma.user.findFirst({
    where: { email: 'test@navaflow.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@navaflow.com',
        name: 'Test User',
      },
    });
    console.log('✅ Created test user');
  }

  // Create a test incident thread
  const incidentThread = await prisma.thread.create({
    data: {
      channelId: incidentChannel.id,
      title: 'Test: Database Latency Spike (P99)',
    },
  });

  console.log('✅ Created incident thread:', incidentThread.id);

  // Create incident data
  const incidentData = await prisma.incidentData.create({
    data: {
      threadId: incidentThread.id,
      status: 'investigating',
      severity: 'sev-1',
      impact: 'Database query latency spike detected: P99 latency at 2450ms (threshold: 100ms). Affecting 15% of user requests.',
      rootCause: 'Under investigation - AI SRE Agent will analyze and propose remediation.',
    },
  });

  console.log('✅ Created incident data');

  // Create an initial message
  await prisma.message.create({
    data: {
      threadId: incidentThread.id,
      userId: testUser.id,
      content: JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '🚨 Incident Detected: Database Latency Spike',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'P99 latency: 2450ms (threshold: 100ms)',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Impact: 15% of user requests affected',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Status: Investigating - AI SRE Agent will analyze and propose remediation.',
              },
            ],
          },
        ],
      }),
      type: 'text',
    },
  });

  console.log('✅ Created initial message');

  console.log('\n🎉 Test incident created successfully!');
  console.log('\n📋 Incident Details:');
  console.log(`   Thread ID: ${incidentThread.id}`);
  console.log(`   Channel: ${incidentChannel.name} (${incidentChannel.id})`);
  console.log(`   Severity: ${incidentData.severity.toUpperCase()}`);
  console.log(`   Status: ${incidentData.status}`);
  console.log(`   Impact: ${incidentData.impact}`);
  console.log('\n🚀 Next Steps:');
  console.log('   1. Navigate to the incident thread in the UI');
  console.log('   2. Scroll to the "AI SRE Agent" section');
  console.log('   3. Click "Start Agent"');
  console.log('   4. Watch the job tail stream');
  console.log('   5. Approve/reject actions at gates');
  console.log('\n✅ Ready to test the AI SRE Agent!');
}

createTestIncident()
  .catch((e) => {
    console.error('❌ Failed to create test incident:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
