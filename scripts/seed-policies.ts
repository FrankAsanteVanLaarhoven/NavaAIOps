import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Policies and Regulations
 * Pre-configured governance rules for compliance checking
 */
async function seedPolicies() {
  console.log('🌱 Seeding policies and regulations...');

  // Policies
  const policies = [
    {
      id: 'policy-data-retention',
      name: 'Data Retention Policy',
      version: 'v1.2',
      category: 'governance',
      content: JSON.stringify({
        minRetentionDays: 30,
        description: 'Channels and threads must be retained for at least 30 days before deletion',
      }),
      isActive: true,
    },
    {
      id: 'policy-sla',
      name: 'SLA Compliance Policy',
      version: 'v1.0',
      category: 'sla',
      content: JSON.stringify({
        maxDowntime: 0.01, // 0.01% max downtime
        responseTime: 100, // 100ms response time
        description: 'Service must maintain 99.99% uptime and <100ms response time',
      }),
      isActive: true,
    },
    {
      id: 'policy-security',
      name: 'Security Policy',
      version: 'v1.1',
      category: 'security',
      content: JSON.stringify({
        noSecretsInLogs: true,
        requireApprovalForCritical: true,
        description: 'No API keys or secrets in logs. Critical actions require approval',
      }),
      isActive: true,
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { id: policy.id },
      update: policy,
      create: policy,
    });
  }

  console.log(`✅ Seeded ${policies.length} policies`);

  // Regulations
  const regulations = [
    {
      id: 'regulation-resource-quota',
      name: 'Max CPU Usage',
      type: 'resource_quota',
      limitValue: 85,
      unit: 'percent',
      isActive: true,
    },
    {
      id: 'regulation-rate-limit',
      name: 'Max Scale Limit',
      type: 'rate_limit',
      limitValue: 10,
      unit: 'count',
      isActive: true,
    },
    {
      id: 'regulation-cost-limit',
      name: 'Max Cost Per Action',
      type: 'cost_limit',
      limitValue: 10000,
      unit: 'dollars',
      isActive: true,
    },
  ];

  for (const regulation of regulations) {
    await prisma.regulation.upsert({
      where: { id: regulation.id },
      update: regulation,
      create: regulation,
    });
  }

  console.log(`✅ Seeded ${regulations.length} regulations`);
  console.log(`\n✅ Policies and regulations seeded successfully!`);
}

seedPolicies()
  .catch((e) => {
    console.error('❌ Failed to seed policies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
