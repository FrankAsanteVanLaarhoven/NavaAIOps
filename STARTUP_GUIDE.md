# 🚀 NavaFlow - Enterprise Startup Guide

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push
```

### 3. Verify Configuration

```bash
# Run startup verification
bun run scripts/verify-startup.ts
```

### 4. Start Development Server

```bash
# Start with WebSocket support (recommended)
bun run dev

# Or use Next.js dev server only
bun run dev:next
```

### 5. Open in Browser

Navigate to: **http://localhost:3000**

---

## ✅ Verification Checklist

Before starting, ensure:

- [x] Database connection works (`bun run scripts/verify-startup.ts`)
- [x] All Prisma models are available
- [x] Required files exist
- [x] Critical dependencies installed

### Optional Setup (for full features)

- [ ] `OPENAI_API_KEY` - For AI features and embeddings
- [ ] `FINETUNED_MODEL_ID` - For custom DevOps model
- [ ] `OPENROUTER_API_KEY` - For model routing
- [ ] `GITHUB_TOKEN` - For GitHub integrations
- [ ] `RUST_SCRAPER_PATH` - For Ironclad scraper
- [ ] `NANO_EMBED_MODEL_PATH` - For ultra-fast embeddings

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database (Required)
DATABASE_URL="file:./db/custom.db"

# AI Features (Optional)
OPENAI_API_KEY="sk-..."
FINETUNED_MODEL_ID="ft:gpt-4o-mini-navaflow-devops-v1"
OPENROUTER_API_KEY="sk-or-..."

# Integrations (Optional)
GITHUB_TOKEN="ghp_..."

# Ironclad Features (Optional)
RUST_SCRAPER_PATH="./scraper"
NANO_EMBED_MODEL_PATH="./models/nano-embed.onnx"

# WebSocket (Optional)
NEXT_PUBLIC_WS_URL="http://localhost:3000"

# Port (Optional, defaults to 3000)
PORT=3000
```

---

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 bun run dev
```

### Database Errors

```bash
# Reset database
bun run db:reset

# Regenerate Prisma client
bun run db:generate
bun run db:push
```

### Missing Dependencies

```bash
# Reinstall all dependencies
rm -rf node_modules bun.lock
bun install
```

### Ironclad Loop Errors

The Ironclad loop is optional and will gracefully degrade if:
- Rust scraper is not available
- ONNX model is not found
- SignalStream table doesn't exist

The app will still work without these features.

---

## 📊 Startup Verification

Run the verification script to check everything:

```bash
bun run scripts/verify-startup.ts
```

Expected output:
```
✅ Database connection: OK
✅ Database query: OK
✅ All models available
✅ All files exist
✅ All dependencies installed
```

---

## 🎯 What Works Without Optional Features

Even without optional environment variables, the app provides:

- ✅ Real-time messaging
- ✅ Thread management
- ✅ Channel organization
- ✅ Canvas mode
- ✅ Basic search
- ✅ UI components
- ✅ WebSocket connections

Optional features that require setup:
- AI summarization (needs `OPENAI_API_KEY`)
- Fine-tuned model (needs `FINETUNED_MODEL_ID`)
- GitHub integration (needs `GITHUB_TOKEN`)
- Ironclad scraper (needs Rust toolchain)

---

## 🚀 Production Deployment

For production, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)

---

## 📚 Additional Resources

- [QUICK_START.md](./QUICK_START.md) - Quick reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [IRONCLAD_IMPLEMENTATION.md](./IRONCLAD_IMPLEMENTATION.md) - Ironclad features

---

**Status**: ✅ Ready for local development
**Last Verified**: 2024-12-30
