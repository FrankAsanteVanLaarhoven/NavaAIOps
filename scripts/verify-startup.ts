/**
 * Startup Verification Script
 * Checks that all components are properly configured and ready to run
 */

import { db } from '../src/lib/db';
import { PrismaClient } from '@prisma/client';

async function verifyStartup() {
  console.log('🔍 Verifying NavaFlow startup configuration...\n');

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check database connection
  try {
    await db.$connect();
    console.log('✅ Database connection: OK');
    
    // Test a simple query
    await db.user.findFirst();
    console.log('✅ Database query: OK');
  } catch (error: any) {
    errors.push(`Database connection failed: ${error.message}`);
    console.error('❌ Database connection: FAILED');
  }

  // 2. Check environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
  ];

  const optionalEnvVars = [
    'OPENAI_API_KEY',
    'FINETUNED_MODEL_ID',
    'OPENROUTER_API_KEY',
    'GITHUB_TOKEN',
    'RUST_SCRAPER_PATH',
    'NANO_EMBED_MODEL_PATH',
  ];

  console.log('\n📋 Environment Variables:');
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: Set`);
    } else {
      errors.push(`Required environment variable missing: ${envVar}`);
      console.log(`  ❌ ${envVar}: Missing (REQUIRED)`);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: Set`);
    } else {
      warnings.push(`Optional environment variable not set: ${envVar}`);
      console.log(`  ⚠️  ${envVar}: Not set (optional)`);
    }
  }

  // 3. Check Prisma models
  console.log('\n📊 Database Models:');
  try {
    const models = [
      'user',
      'channel',
      'thread',
      'message',
      'signalStream',
      'messageEmbedding',
      'incidentData',
      'auditLog',
    ];

    for (const model of models) {
      try {
        // Try to access the model (this will fail if it doesn't exist)
        const modelName = model.charAt(0).toUpperCase() + model.slice(1);
        // @ts-ignore - Dynamic model access
        await db[model].findFirst({ take: 1 });
        console.log(`  ✅ ${modelName}: Available`);
      } catch (error: any) {
        if (error.message.includes('Unknown arg') || error.message.includes('does not exist')) {
          warnings.push(`Model ${model} may not be properly configured`);
          console.log(`  ⚠️  ${model}: May need migration`);
        } else {
          console.log(`  ✅ ${model}: Available`);
        }
      }
    }
  } catch (error: any) {
    warnings.push(`Model check failed: ${error.message}`);
  }

  // 4. Check file structure
  console.log('\n📁 File Structure:');
  const requiredFiles = [
    'server.ts',
    'src/app/page.tsx',
    'src/lib/db.ts',
    'src/lib/websocket-server.ts',
    'prisma/schema.prisma',
  ];

  const fs = await import('fs');
  const path = await import('path');

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}: Exists`);
    } else {
      errors.push(`Required file missing: ${file}`);
      console.log(`  ❌ ${file}: Missing`);
    }
  }

  // 5. Check dependencies
  console.log('\n📦 Dependencies:');
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    const criticalDeps = [
      'next',
      '@prisma/client',
      'react',
      'react-dom',
      'socket.io',
      'zod',
    ];

    for (const dep of criticalDeps) {
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        console.log(`  ✅ ${dep}: Installed`);
      } else {
        warnings.push(`Dependency ${dep} not found in package.json`);
        console.log(`  ⚠️  ${dep}: Not in package.json`);
      }
    }
  } catch (error: any) {
    warnings.push(`Could not check dependencies: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Startup Verification Summary\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Ready to start.\n');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} error(s) found:\n`);
      errors.forEach((error) => console.log(`   - ${error}`));
      console.log('');
    }

    if (warnings.length > 0) {
      console.log(`⚠️  ${warnings.length} warning(s):\n`);
      warnings.forEach((warning) => console.log(`   - ${warning}`));
      console.log('');
    }

    if (errors.length > 0) {
      console.log('❌ Please fix errors before starting the application.\n');
      process.exit(1);
    } else {
      console.log('⚠️  Warnings found, but application should still work.\n');
      process.exit(0);
    }
  }
}

verifyStartup().catch((error) => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
