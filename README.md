# 🚀 NavaFlow - Developer's Operating System

**NavaFlow** is a SOTA competitor to X and Slack, built as a **Developer-Centric** real-time collaboration platform with AI-powered features.

## ✨ What is NavaFlow?

NavaFlow is a **Single-Page Application (SPA)** that combines:
- Real-time messaging and collaboration
- AI-powered features (context-aware, code-aware)
- Incident management for DevOps teams
- Workflow automation
- Code-aware AI assistant (RAG)
- Collaborative canvas mode

## 🎯 Key Features

### Real-Time Communication
- ✅ WebSocket-based messaging
- ✅ Typing indicators
- ✅ Presence system
- ✅ Instant message delivery

### AI Features
- ✅ **Thread Summarization** - AI-powered thread summaries
- ✅ **Compose Assistant** - AI text improvement
- ✅ **RAG Assistant** - AI that reads your code
- ✅ **Context-Aware AI** - Adapts to channel type

### Developer Tools
- ✅ **Hybrid Search** - Keyword + semantic search
- ✅ **Dynamic Sidebars** - Attach GitHub, Linear, Notion
- ✅ **Incident Management** - Built-in incident tracking
- ✅ **Canvas Mode** - Collaborative rich text editor
- ✅ **Automations** - Workflow automation system

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.5 (App Router)
- **UI**: React 19, Tailwind CSS 4, shadcn/ui
- **Database**: SQLite with Prisma ORM
- **Real-Time**: Socket.IO WebSocket
- **AI**: Zhip-AI SDK (via OpenRouter)
- **Editor**: TipTap (rich text)

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push database schema
bun run db:push

# Seed demo data (optional)
curl -X POST http://localhost:3000/api/seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see NavaFlow running.

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture
- **[ROADMAP.md](./ROADMAP.md)** - Product roadmap and features
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference guide
- **[FEATURES.md](./FEATURES.md)** - Feature documentation
- **[P0_FEATURES.md](./P0_FEATURES.md)** - P0 features (Hybrid Search, Dynamic Sidebars, Incidents)
- **[P1_FEATURES.md](./P1_FEATURES.md)** - P1 features (Canvas Mode, RAG Assistant, Automations)

## 🎯 Why NavaFlow?

### vs. X (Twitter)
- ✅ **Private by default** - Team conversations stay private
- ✅ **Structured workflows** - Not just social, but work-focused
- ✅ **Developer-centric** - Built for technical teams

### vs. Slack
- ✅ **AI-native** - AI is core, not an add-on
- ✅ **Incident management** - Built-in, not a plugin
- ✅ **Code context** - AI understands your codebase
- ✅ **Dynamic context** - Modules keep work in conversation

## 🏗️ Project Structure

```
navaflow/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── state/        # Global state (ViewContext, UserContext)
│   │   ├── views/        # View components (lazy loaded)
│   │   ├── hooks/        # Custom hooks
│   │   └── api/          # Backend API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── chat/         # Chat components
│   │   ├── canvas/       # Canvas mode
│   │   ├── rag/          # RAG assistant
│   │   ├── automations/  # Automation builder
│   │   ├── incidents/    # Incident management
│   │   └── search/       # Search components
│   └── lib/              # Utilities & services
├── prisma/               # Database schema
└── server.ts             # Custom server (WebSocket + Next.js)
```

## 🎉 Features Overview

### P0 Features (Complete)
- **Hybrid Search** - Keyword + semantic search
- **Dynamic Sidebars** - Context modules (GitHub, Linear, Notion)
- **Incidents** - Specialized incident management

### P1 Features (Complete)
- **Canvas Mode** - Collaborative rich text editor
- **RAG Assistant** - AI that reads your code
- **Automations** - Workflow automation system

## 📖 Learn More

- Read the [ARCHITECTURE.md](./ARCHITECTURE.md) for complete system design
- Check [ROADMAP.md](./ROADMAP.md) for upcoming features
- See [QUICK_START.md](./QUICK_START.md) for usage guide

---

**NavaFlow** - The Developer's Operating System 🚀

Built with ❤️ for developers who need more than just chat.
