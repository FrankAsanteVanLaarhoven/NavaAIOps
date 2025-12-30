import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Remediation Scripts
 * Pre-configured scripts for common remediation scenarios
 */
async function seedRemediationScripts() {
  console.log('🌱 Seeding remediation scripts...');

  const scripts = [
    {
      name: 'Rollback Deployment v2.4.1',
      type: 'KUBECTL',
      command: 'kubectl rollout undo deployment/app-service --namespace=production',
      description: 'Rollback the app-service deployment to the previous version',
      risk: 'HIGH',
      estimatedDuration: '2m',
    },
    {
      name: 'Restart Database Service',
      type: 'SHELL',
      command: 'systemctl restart postgresql',
      description: 'Restart PostgreSQL database service',
      risk: 'MEDIUM',
      estimatedDuration: '30s',
    },
    {
      name: 'Scale Up API Pods',
      type: 'KUBECTL',
      command: 'kubectl scale deployment/api-service --replicas=5 --namespace=production',
      description: 'Scale up API service pods to handle increased load',
      risk: 'LOW',
      estimatedDuration: '1m',
    },
    {
      name: 'Clear Redis Cache',
      type: 'SHELL',
      command: 'redis-cli FLUSHALL',
      description: 'Clear all Redis cache entries',
      risk: 'MEDIUM',
      estimatedDuration: '10s',
    },
    {
      name: 'Restart Nginx',
      type: 'SHELL',
      command: 'systemctl restart nginx',
      description: 'Restart Nginx web server',
      risk: 'LOW',
      estimatedDuration: '5s',
    },
    {
      name: 'Database Connection Pool Reset',
      type: 'SQL',
      command: 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();',
      description: 'Terminate all database connections except current',
      risk: 'HIGH',
      estimatedDuration: '30s',
    },
    {
      name: 'Clear Application Logs',
      type: 'SHELL',
      command: 'truncate -s 0 /var/log/app/application.log',
      description: 'Clear application log file to free up disk space',
      risk: 'LOW',
      estimatedDuration: '1s',
    },
    {
      name: 'Restart Docker Container',
      type: 'SHELL',
      command: 'docker restart app-container',
      description: 'Restart a specific Docker container',
      risk: 'MEDIUM',
      estimatedDuration: '15s',
    },
  ];

  for (const script of scripts) {
    await prisma.remediationScript.upsert({
      where: {
        id: `script-${script.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: script,
      create: {
        ...script,
        id: `script-${script.name.toLowerCase().replace(/\s+/g, '-')}`,
        enabled: true,
      },
    });
  }

  console.log(`✅ Seeded ${scripts.length} remediation scripts`);
}

seedRemediationScripts()
  .catch((e) => {
    console.error('❌ Failed to seed remediation scripts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
