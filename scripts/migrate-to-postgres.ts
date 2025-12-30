#!/usr/bin/env bun
/**
 * Database Migration Script: SQLite → PostgreSQL (Neon)
 * 
 * This script migrates data from SQLite to PostgreSQL.
 * 
 * Usage:
 *   bun run scripts/migrate-to-postgres.ts
 * 
 * Prerequisites:
 *   1. Set DATABASE_URL_SQLITE (source)
 *   2. Set DATABASE_URL_POSTGRES (destination)
 *   3. Run Prisma migrations on PostgreSQL first
 */

import { PrismaClient } from '@prisma/client';
import { PrismaClient as PrismaClientSQLite } from '@prisma/client';
import { config } from 'dotenv';

config();

const sqliteUrl = process.env.DATABASE_URL_SQLITE || 'file:./db/custom.db';
const postgresUrl = process.env.DATABASE_URL_POSTGRES;

if (!postgresUrl) {
  console.error('❌ DATABASE_URL_POSTGRES is not set');
  console.error('Please set it in your .env file:');
  console.error('DATABASE_URL_POSTGRES="postgresql://user:password@host:5432/database"');
  process.exit(1);
}

// Create separate Prisma clients for SQLite and PostgreSQL
const sqliteClient = new PrismaClientSQLite({
  datasources: {
    db: {
      url: sqliteUrl,
    },
  },
});

const postgresClient = new PrismaClient({
  datasources: {
    db: {
      url: postgresUrl,
    },
  },
});

interface MigrationStats {
  users: number;
  channels: number;
  threads: number;
  messages: number;
  modules: number;
  incidents: number;
  automations: number;
  codeIndexes: number;
  errors: string[];
}

async function migrateTable<T>(
  tableName: string,
  sqliteQuery: () => Promise<T[]>,
  postgresInsert: (data: T[]) => Promise<any>,
  transform?: (data: T) => any
): Promise<number> {
  try {
    console.log(`📦 Migrating ${tableName}...`);
    const data = await sqliteQuery();
    
    if (data.length === 0) {
      console.log(`   ⏭️  No ${tableName} to migrate`);
      return 0;
    }

    const transformedData = transform ? data.map(transform) : data;
    
    // Batch insert (1000 records at a time)
    const batchSize = 1000;
    let migrated = 0;
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);
      await postgresInsert(batch);
      migrated += batch.length;
      console.log(`   ✅ Migrated ${migrated}/${transformedData.length} ${tableName}`);
    }
    
    return migrated;
  } catch (error: any) {
    console.error(`   ❌ Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migration: SQLite → PostgreSQL\n');
  
  const stats: MigrationStats = {
    users: 0,
    channels: 0,
    threads: 0,
    messages: 0,
    modules: 0,
    incidents: 0,
    automations: 0,
    codeIndexes: 0,
    errors: [],
  };

  try {
    // Test connections
    console.log('🔌 Testing database connections...');
    await sqliteClient.$connect();
    console.log('   ✅ SQLite connected');
    
    await postgresClient.$connect();
    console.log('   ✅ PostgreSQL connected\n');

    // Migrate Users
    stats.users = await migrateTable(
      'Users',
      () => sqliteClient.user.findMany(),
      (data) => postgresClient.user.createMany({ data, skipDuplicates: true })
    );

    // Migrate Channels
    stats.channels = await migrateTable(
      'Channels',
      () => sqliteClient.channel.findMany(),
      (data) => postgresClient.channel.createMany({ data, skipDuplicates: true })
    );

    // Migrate Threads
    stats.threads = await migrateTable(
      'Threads',
      () => sqliteClient.thread.findMany(),
      (data) => postgresClient.thread.createMany({ data, skipDuplicates: true })
    );

    // Migrate Messages
    stats.messages = await migrateTable(
      'Messages',
      () => sqliteClient.message.findMany(),
      (data) => postgresClient.message.createMany({ data, skipDuplicates: true })
    );

    // Migrate ThreadModules
    stats.modules = await migrateTable(
      'ThreadModules',
      () => sqliteClient.threadModule.findMany(),
      (data) => postgresClient.threadModule.createMany({ data, skipDuplicates: true })
    );

    // Migrate IncidentData
    stats.incidents = await migrateTable(
      'IncidentData',
      () => sqliteClient.incidentData.findMany(),
      (data) => postgresClient.incidentData.createMany({ data, skipDuplicates: true })
    );

    // Migrate Automations
    stats.automations = await migrateTable(
      'Automations',
      () => sqliteClient.automation.findMany(),
      (data) => postgresClient.automation.createMany({ data, skipDuplicates: true })
    );

    // Migrate CodeIndex
    stats.codeIndexes = await migrateTable(
      'CodeIndex',
      () => sqliteClient.codeIndex.findMany(),
      (data) => postgresClient.codeIndex.createMany({ data, skipDuplicates: true })
    );

    // Migrate other tables
    await migrateTable(
      'PollOptions',
      () => sqliteClient.pollOption.findMany(),
      (data) => postgresClient.pollOption.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'Reactions',
      () => sqliteClient.reaction.findMany(),
      (data) => postgresClient.reaction.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'UserXP',
      () => sqliteClient.userXP.findMany(),
      (data) => postgresClient.userXP.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'Achievements',
      () => sqliteClient.achievement.findMany(),
      (data) => postgresClient.achievement.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'UserAchievements',
      () => sqliteClient.userAchievement.findMany(),
      (data) => postgresClient.userAchievement.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'AuditLogs',
      () => sqliteClient.auditLog.findMany(),
      (data) => postgresClient.auditLog.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'WorkflowTriggers',
      () => sqliteClient.workflowTrigger.findMany(),
      (data) => postgresClient.workflowTrigger.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'MessageEmbeddings',
      () => sqliteClient.messageEmbedding.findMany(),
      (data) => postgresClient.messageEmbedding.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'Integrations',
      () => sqliteClient.integration.findMany(),
      (data) => postgresClient.integration.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'Policies',
      () => sqliteClient.policy.findMany(),
      (data) => postgresClient.policy.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'Regulations',
      () => sqliteClient.regulation.findMany(),
      (data) => postgresClient.regulation.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'SignalStreams',
      () => sqliteClient.signalStream.findMany(),
      (data) => postgresClient.signalStream.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'ComplianceLogs',
      () => sqliteClient.complianceLog.findMany(),
      (data) => postgresClient.complianceLog.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'RemediationScripts',
      () => sqliteClient.remediationScript.findMany(),
      (data) => postgresClient.remediationScript.createMany({ data, skipDuplicates: true })
    );

    await migrateTable(
      'IncidentUpdates',
      () => sqliteClient.incidentUpdate.findMany(),
      (data) => postgresClient.incidentUpdate.createMany({ data, skipDuplicates: true })
    );

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 Migration Statistics:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Channels: ${stats.channels}`);
    console.log(`   Threads: ${stats.threads}`);
    console.log(`   Messages: ${stats.messages}`);
    console.log(`   Modules: ${stats.modules}`);
    console.log(`   Incidents: ${stats.incidents}`);
    console.log(`   Automations: ${stats.automations}`);
    console.log(`   Code Indexes: ${stats.codeIndexes}`);

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error);
    stats.errors.push(error.message);
    process.exit(1);
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

main();
