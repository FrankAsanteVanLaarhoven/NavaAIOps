# 🚀 NavaFlow - Running Application

## ✅ Application Status

**Server**: Running at **http://localhost:3000**

---

## 🎯 Quick Access

### Main Application
- **Home**: http://localhost:3000
- **Onboarding**: http://localhost:3000 (first visit)
- **Main Chat**: http://localhost:3000 (after onboarding)

### API Endpoints

#### Search
- **Universal Search**: `GET /api/search/universal?q=query&type=all`
- **Hybrid Search**: `GET /api/search?q=query`

#### AI Features
- **Thread Summarization**: `POST /api/ai/summarize`
- **Compose Assistant**: `POST /api/ai/compose`
- **RAG Assistant**: `POST /api/rag/assistant`
- **Smart Ops Agent**: `POST /api/ops/smart-agent`

#### Repositories
- **Index Repository**: `POST /api/repo/index`
- **Search Code**: `GET /api/search/universal?q=query&type=code`

#### Workflows
- **List Workflows**: `GET /api/automations`
- **Create Workflow**: `POST /api/automations`

#### Incidents
- **Get Incident**: `GET /api/incidents/[threadId]`
- **Update Incident**: `POST /api/incidents/[threadId]`

#### Status
- **Status Board**: http://localhost:3000/status/[workspaceId]
- **Performance Dashboard**: http://localhost:3000/dashboard/performance

#### tRPC
- **tRPC Endpoint**: http://localhost:3000/api/trpc
- **Search**: `/api/trpc/search.search`
- **Workflows**: `/api/trpc/workflows.create`
- **Audit**: `/api/trpc/audit.query`

---

## 🧪 Test the Application

### 1. Seed Demo Data
```bash
curl -X POST http://localhost:3000/api/seed
```

### 2. Test Universal Search
```bash
curl "http://localhost:3000/api/search/universal?q=test&type=all"
```

### 3. Test Smart Ops Agent
```bash
# First, create an incident, then:
curl -X POST http://localhost:3000/api/ops/smart-agent \
  -H "Content-Type: application/json" \
  -d '{"incidentId": "thread-id"}'
```

### 4. Index a Repository
```bash
curl -X POST http://localhost:3000/api/repo/index \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/owner/repo",
    "filePaths": ["README.md"]
  }'
```

---

## 🎨 Features Available

### ✅ Core Features
- Real-time messaging (WebSocket)
- Threads and channels
- AI summarization
- AI compose assistant
- Hybrid search (keyword + semantic)
- Dynamic sidebars (context modules)
- Incident management
- Canvas mode (collaborative editor)
- RAG assistant
- Workflow automation

### ✅ Cloud-Native Features
- Vercel KV (serverless state)
- Vercel AI SDK (unified AI)
- Vercel Blob (storage)
- Universal search
- Smart Ops Agent
- Performance dashboard

---

## 🔧 Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Database operations
bun run db:push      # Push schema changes
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Run migrations
```

---

## 📝 Notes

- **Database**: Currently using SQLite (local dev)
- **WebSocket**: Running on same port (3000)
- **AI**: Requires `OPENAI_API_KEY` for full functionality
- **Vercel Services**: Configure in production (KV, Blob)

---

## 🚀 Next Steps

1. **Open Browser**: http://localhost:3000
2. **Seed Data**: `POST /api/seed` (optional)
3. **Explore Features**: Try search, AI, incidents, workflows
4. **Test Cloud Features**: Universal search, Smart Ops Agent

---

**Status**: ✅ Running  
**URL**: http://localhost:3000  
**Last Updated**: 2024
