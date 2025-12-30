# 🌐 NavaFlow - Cloud-Native Architecture

## Overview

NavaFlow is now a **Cloud AI DevOps OS** built on serverless, cloud-native infrastructure. This document outlines the complete cloud architecture and how to use it.

---

## 🏗️ Cloud Infrastructure Stack

### 1. **Vercel KV** (Serverless Key-Value Store)
- **Use**: Sessions, rate limits, feature flags, cache
- **Why**: Extremely fast (ms), global edge, cheaper than Redis
- **Location**: `src/lib/services/vercel-kv.ts`

### 2. **Vercel AI SDK** (Unified AI Gateway)
- **Use**: All AI operations (text generation, streaming, structured outputs)
- **Why**: Unified interface, streaming built-in, observability, model flexibility
- **Location**: `src/lib/services/vercel-ai.ts`
- **Supports**: OpenAI, Anthropic, and more

### 3. **Vercel Blob** (Serverless Storage)
- **Use**: Message attachments, logs, backups, large files
- **Why**: Cheaper than S3, edge-cached, unlimited
- **Location**: `src/lib/services/vercel-blob.ts`

### 4. **Neon PostgreSQL** (Serverless Database)
- **Use**: Primary transactional database
- **Why**: Scales infinitely, connection pooling, full PostgreSQL features
- **Location**: `prisma/schema.prisma`

### 5. **Vercel Analytics & Speed Insights** (Observability)
- **Use**: Performance monitoring, Web Vitals, real-time metrics
- **Why**: Built-in, no setup, real-time dashboards
- **Location**: `src/app/dashboard/performance/page.tsx`

---

## 🚀 Core Cloud Services

### A. Universal Search (RAG 2.0)

**Endpoint**: `GET /api/search/universal?q=query&type=all`

**Searches Across**:
- Messages (PostgreSQL)
- Incidents (PostgreSQL)
- Code Files (Repo-Context service)

**Example**:
```bash
curl "http://localhost:3000/api/search/universal?q=authentication&type=all"
```

**Response**:
```json
{
  "query": "authentication",
  "type": "all",
  "results": [
    {
      "type": "incident",
      "id": "...",
      "title": "Incident: SEV-1 - investigating",
      "content": "..."
    },
    {
      "type": "message",
      "id": "...",
      "title": "Message in #general",
      "content": "..."
    },
    {
      "type": "code",
      "id": "...",
      "title": "src/lib/auth.ts",
      "filePath": "src/lib/auth.ts",
      "content": "..."
    }
  ],
  "counts": {
    "messages": 5,
    "incidents": 2,
    "code": 3
  },
  "total": 10
}
```

---

### B. Repo-Context Service

**Purpose**: Store GitHub repository files in database for fast RAG queries

**Index Repository**:
```bash
POST /api/repo/index
{
  "repoUrl": "https://github.com/owner/repo",
  "filePaths": ["src/lib/auth.ts", "src/components/Login.tsx"],
  "token": "ghp_..." // Optional
}
```

**Auto-Index All Files**:
```bash
POST /api/repo/index
{
  "repoUrl": "https://github.com/owner/repo",
  "token": "ghp_..."
}
```

**Search Code**:
```bash
GET /api/search/universal?q=authentication&type=code&repoId=owner/repo
```

---

### C. Smart Ops Agent (Agentic AI)

**Purpose**: AI agent that analyzes incidents and proposes root causes

**Endpoint**: `POST /api/ops/smart-agent`

**Request**:
```json
{
  "incidentId": "thread-id"
}
```

**Response**:
```json
{
  "incidentId": "...",
  "analysis": {
    "rootCause": "Recent deployment changed authentication logic",
    "confidence": 0.85,
    "affectedFiles": ["src/lib/auth.ts", "src/components/Login.tsx"],
    "investigationSteps": [
      "Check recent commits in auth.ts",
      "Review authentication logs",
      "Test login flow"
    ],
    "potentialFixes": [
      "Revert recent auth changes",
      "Add authentication logging",
      "Update error handling"
    ]
  },
  "confidence": 0.85
}
```

---

## 📊 Performance Dashboard

**Location**: `/dashboard/performance`

**Shows**:
- Total Messages
- Active Incidents
- Workflows
- Rate Limiting Stats
- Database Performance
- AI Performance

**Access**: Navigate to `http://localhost:3000/dashboard/performance`

---

## 🔧 Environment Variables

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/neondb?sslmode=require"

# Vercel KV
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."

# Vercel Blob
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..." # Optional

# GitHub (for repo indexing)
GITHUB_TOKEN="ghp_..."

# Vercel Analytics (auto-configured on Vercel)
# No env vars needed
```

---

## 🎯 Usage Examples

### 1. Use Vercel KV for Rate Limiting

```typescript
import { VercelKVService } from '@/lib/services/vercel-kv';

// Check rate limit
const limit = await VercelKVService.checkRateLimit(
  userId,
  10, // 10 requests
  60  // per minute
);

if (!limit.allowed) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 2. Use Vercel AI SDK

```typescript
import { generateAIText, streamAIText } from '@/lib/services/vercel-ai';

// Generate text
const text = await generateAIText('Summarize this incident', {
  model: 'gpt-4o-mini',
  temperature: 0.7,
});

// Stream text
for await (const chunk of streamAIText('Explain the error', {
  model: 'claude-3-5-sonnet',
})) {
  console.log(chunk);
}
```

### 3. Upload to Vercel Blob

```typescript
import { VercelBlobService } from '@/lib/services/vercel-blob';

// Upload attachment
const blob = await VercelBlobService.uploadAttachment(
  messageId,
  fileBuffer,
  'image.png',
  'image/png'
);

console.log(blob.url); // Public URL
```

### 4. Index Repository for RAG

```typescript
// Index specific files
await fetch('/api/repo/index', {
  method: 'POST',
  body: JSON.stringify({
    repoUrl: 'https://github.com/owner/repo',
    filePaths: ['src/lib/auth.ts'],
  }),
});

// Search code
const results = await fetch(
  '/api/search/universal?q=authentication&type=code'
);
```

---

## 🚀 Deployment Checklist

- [ ] Set up Neon PostgreSQL database
- [ ] Configure Vercel KV
- [ ] Configure Vercel Blob
- [ ] Add OpenAI API key
- [ ] (Optional) Add Anthropic API key
- [ ] Add GitHub token for repo indexing
- [ ] Deploy to Vercel
- [ ] Enable Vercel Analytics
- [ ] Test Universal Search
- [ ] Test Smart Ops Agent
- [ ] Index repositories
- [ ] Monitor Performance Dashboard

---

## 📈 Architecture Benefits

### Before (Traditional)
- ❌ Self-hosted Redis
- ❌ Direct OpenAI API calls
- ❌ S3 for storage
- ❌ Manual connection pooling
- ❌ No unified search
- ❌ Basic AI (no agentic)

### After (Cloud-Native)
- ✅ Vercel KV (serverless)
- ✅ Vercel AI SDK (unified gateway)
- ✅ Vercel Blob (edge storage)
- ✅ Neon PostgreSQL (auto-scaling)
- ✅ Universal Search (messages + incidents + code)
- ✅ Smart Ops Agent (agentic AI)

---

## 🎯 Next Steps

1. **Set up Vercel KV** - Configure Redis URL
2. **Index Repositories** - Use `/api/repo/index`
3. **Test Smart Ops Agent** - Analyze incidents
4. **Monitor Performance** - Check `/dashboard/performance`
5. **Scale** - Everything auto-scales on Vercel

---

**Status**: Cloud-Native Architecture Complete ✅  
**Last Updated**: 2024
