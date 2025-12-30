# 🚀 NavaFlow - Production Setup Guide

## Overview

This guide covers the production-ready infrastructure setup for NavaFlow, including Neon PostgreSQL, tRPC, ArcJet security, and all advanced features.

---

## 📋 Prerequisites

1. **Neon PostgreSQL Account** (free tier available)
   - Sign up at https://neon.tech
   - Create a new project
   - Copy the connection string

2. **OpenAI API Key** (for embeddings)
   - Sign up at https://platform.openai.com
   - Create an API key

3. **ArcJet Account** (free tier available)
   - Sign up at https://arcjet.com
   - Get your API key

4. **GitHub Token** (optional, for context modules)
   - Create a personal access token at https://github.com/settings/tokens

---

## 🔧 Environment Variables

Create or update your `.env` file:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require&options=connection_limit=10"

# OpenAI (for embeddings)
OPENAI_API_KEY="sk-..."

# ArcJet (for security)
ARCJET_KEY="ajkey_..."

# GitHub (optional, for context modules)
GITHUB_TOKEN="ghp_..."

# WebSocket (optional)
NEXT_PUBLIC_WS_URL="http://localhost:3000"

# Node Environment
NODE_ENV="production"
```

---

## 🗄️ Database Migration

### Step 1: Update Prisma Schema

The schema has been updated to use PostgreSQL. Make sure your `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 2: Push Schema to Neon

```bash
# Generate Prisma client
bun run db:generate

# Push schema to Neon database
bun run db:push
```

### Step 3: Verify Migration

Check that all tables are created:
- `User`
- `Channel`
- `Thread`
- `Message`
- `MessageEmbedding` (new)
- `WorkflowTrigger` (new)
- `AuditLog` (new)
- `IncidentData`
- `ThreadModule`
- `CodeIndex`
- `GitHubIntegration`

---

## 🔐 ArcJet Security Setup

### Step 1: Install ArcJet

Already installed via `bun add @arcjet/next @arcjet/core`

### Step 2: Configure Middleware

The middleware is already set up in `src/middleware.ts`. It will:
- Detect and block automated bots
- Rate limit API requests (10 per minute)
- Protect against spam

### Step 3: Test Protection

Try making rapid API requests to verify rate limiting works.

---

## 🔌 tRPC Setup

### Step 1: Verify Installation

tRPC is already installed. Check `package.json` for:
- `@trpc/server`
- `@trpc/client`
- `@trpc/react-query`
- `@trpc/next`

### Step 2: API Route

The tRPC API route is at `/api/trpc/[trpc]/route.ts`

### Step 3: Client Setup (Frontend)

Create a tRPC client hook:

```typescript
// src/lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './root';

export const trpc = createTRPCReact<AppRouter>();
```

---

## 🎯 Features Enabled

### ✅ Hybrid Search
- Keyword search (SQL)
- Semantic search (vector embeddings)
- Combined results

### ✅ Audit Trails
- Immutable change logs
- Query by table, record, or user
- Automatic logging on create/update/delete

### ✅ Workflow Automation
- Create workflows via tRPC
- Trigger on keywords, channel type, user role
- Actions: Create Incident, Ping Channel, Send Message, etc.

### ✅ GitHub Integration
- Fetch repository content
- Parse GitHub URLs
- Get file trees

### ✅ Live Status Board
- Public status page at `/status/[workspaceId]`
- Real-time incident monitoring
- Severity-based color coding

---

## 🧪 Testing

### Test Hybrid Search

```bash
# Via tRPC
curl -X POST http://localhost:3000/api/trpc/search.search \
  -H "Content-Type: application/json" \
  -d '{"query": {"query": "test", "semantic": true}}'
```

### Test Workflow Creation

```bash
# Via tRPC
curl -X POST http://localhost:3000/api/trpc/workflows.create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto Incident",
    "triggerType": "KEYWORD",
    "triggerValue": "deploy failed",
    "channelId": "...",
    "actions": [{"type": "CREATE_INCIDENT", "target": "..."}]
  }'
```

### Test Audit Trail

```bash
# Query audit logs
curl http://localhost:3000/api/trpc/audit.query?input={"tableName":"Message"}
```

---

## 🚀 Deployment Checklist

- [ ] Update `DATABASE_URL` to Neon PostgreSQL
- [ ] Set `OPENAI_API_KEY` for embeddings
- [ ] Set `ARCJET_KEY` for security
- [ ] Run `bun run db:push` to migrate schema
- [ ] Test tRPC endpoints
- [ ] Verify ArcJet protection
- [ ] Test workflow automation
- [ ] Verify audit logging
- [ ] Test status board at `/status/[workspaceId]`

---

## 📊 Monitoring

### Database
- Monitor Neon dashboard for connection pool usage
- Check query performance

### Security
- Monitor ArcJet dashboard for blocked requests
- Review rate limit hits

### Embeddings
- Monitor OpenAI API usage
- Track embedding generation costs

---

## 🔄 Migration from SQLite

If you're migrating from SQLite:

1. **Export Data** (if needed):
   ```bash
   # Export SQLite data
   sqlite3 db/custom.db .dump > backup.sql
   ```

2. **Update DATABASE_URL**:
   ```bash
   DATABASE_URL="postgresql://..."
   ```

3. **Push Schema**:
   ```bash
   bun run db:push
   ```

4. **Import Data** (if needed):
   - Use Prisma migrations or manual SQL import

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check Neon project is active
- Verify SSL mode is set

### Embedding Generation Fails
- Check `OPENAI_API_KEY` is set
- Verify API key has credits
- Check rate limits

### ArcJet Not Working
- Verify `ARCJET_KEY` is set
- Check middleware is enabled
- Review ArcJet dashboard

### tRPC Errors
- Check API route is accessible
- Verify context creation
- Check authentication

---

## 📚 Next Steps

1. **Implement Authentication**
   - Add proper session management
   - Update tRPC context to use real auth

2. **Add More Workflow Actions**
   - GitHub issue creation
   - Linear ticket creation
   - Webhook calls

3. **Enhance RAG Assistant**
   - Index more code files
   - Add code search UI
   - Improve context retrieval

4. **Build Ephemeral UI**
   - Intent detection
   - Widget system
   - Zero-navigation interface

---

**Last Updated**: 2024  
**Status**: Production-Ready Infrastructure ✅
