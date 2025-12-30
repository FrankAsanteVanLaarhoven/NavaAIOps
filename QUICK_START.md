# 🚀 NavaFlow - Quick Start Guide

## 📋 Overview

NavaFlow is a real-time chat application with AI features, built as a Single-Page Application (SPA).

## 🏃 Quick Start

### 1. Installation

```bash
# Install dependencies
bun install

# Generate Prisma client
bun run db:generate

# Push database schema
bun run db:push

# Seed demo data
curl -X POST http://localhost:3000/api/seed
```

### 2. Start Development Server

```bash
# Start with WebSocket support (recommended)
bun run dev

# Or use Next.js dev server only (no WebSocket)
bun run dev:next
```

### 3. Open in Browser

Navigate to: **http://localhost:3000**

---

## 🎯 Key Features

### Real-Time Communication
- ✅ WebSocket-based messaging
- ✅ Typing indicators
- ✅ Presence system
- ✅ Instant message delivery

### AI Features
- ✅ **Thread Summarization**: Click "AI Summary" button
- ✅ **Compose Assistant**: Click "Compose Assistant" in editor
- ✅ **Context-Aware**: AI adapts to channel type

### UI Features
- ✅ **Cmd+K**: Open AI command palette
- ✅ **Swipe Gestures**: Swipe right to go back (mobile)
- ✅ **Responsive**: Works on desktop, tablet, mobile
- ✅ **Instant Navigation**: No page reloads

---

## 📁 Project Structure

```
navaflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # SPA Entry Point
│   │   ├── state/              # Global State (ViewContext, UserContext)
│   │   ├── views/              # View Components (Lazy Loaded)
│   │   ├── hooks/              # Custom Hooks (WebSocket, AI, Gestures)
│   │   └── api/                # Backend API Routes
│   ├── components/             # React Components
│   │   ├── ui/                 # shadcn/ui Components
│   │   ├── chat/               # Chat Components
│   │   └── ai/                 # AI Components
│   └── lib/                    # Utilities & Services
├── prisma/
│   └── schema.prisma           # Database Schema
├── server.ts                   # Custom Server (WebSocket + Next.js)
└── package.json
```

---

## 🎨 UI Components Guide

### Main Interface

```
┌─────────────────────────────────────────────────────┐
│  Channels Sidebar  │  Threads Sidebar  │  Messages  │
│                     │                  │            │
│  • ASDF            │  • Welcome Thread│  Messages  │
│  • General         │  • Discussion    │  List      │
│  • Engineering     │  • Q&A           │            │
│                     │                  │  [Editor]  │
│                     │                  │  [Send]   │
└─────────────────────────────────────────────────────┘
```

### Navigation Flow

1. **Select Channel** → Click channel in left sidebar
2. **Select Thread** → Click thread in middle sidebar
3. **View Messages** → Messages appear in right panel
4. **Send Message** → Type in editor, click Send

### AI Features

#### Thread Summarization
1. Open a thread with messages
2. Click **"AI Summary"** button (top-right floating button)
3. Click **"Generate"** in the panel
4. Watch AI stream the summary

#### Compose Assistant
1. Type a draft message in the editor
2. Click **"Compose Assistant"** button
3. Click **"Generate"** to improve text
4. Click **"Accept"** to use improved version

#### Command Palette
1. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux)
2. See available AI actions
3. Navigate with arrow keys
4. Press Enter to select

---

## 🔌 Backend API Endpoints

### Channels
- `GET /api/channels` - List all channels
- `POST /api/channels` - Create channel

### Threads
- `GET /api/channels/[channelId]/threads` - List threads
- `POST /api/channels/[channelId]/threads` - Create thread

### Messages
- `GET /api/threads/[threadId]/messages` - List messages
- `POST /api/threads/[threadId]/messages` - Create message

### AI
- `POST /api/ai/summarize` - Summarize thread (streaming)
- `POST /api/ai/compose` - Improve text (streaming)

### User
- `GET /api/user` - Get current user
- `POST /api/user` - Create user

---

## 🔄 WebSocket Events

### Client → Server
- `join-channel` - Join channel room
- `join-thread` - Join thread room
- `typing` - User is typing
- `stop-typing` - User stopped typing
- `new-message` - Broadcast new message

### Server → Client
- `message-received` - New message in thread
- `user-typing` - Someone is typing
- `user-stopped-typing` - Someone stopped typing
- `channel-joined` - Confirmed channel join
- `thread-joined` - Confirmed thread join

---

## 🗄️ Database Models

### User
- `id` - Unique identifier
- `email` - User email (unique)
- `name` - User name (optional)

### Channel
- `id` - Unique identifier
- `name` - Channel name

### Thread
- `id` - Unique identifier
- `channelId` - Parent channel
- `title` - Thread title (optional)

### Message
- `id` - Unique identifier
- `threadId` - Parent thread
- `userId` - Message author
- `content` - TipTap JSON string

---

## 🎯 State Management

### ViewContext
Manages current view and navigation:
- `view` - Current view ('onboarding' | 'main-chat' | 'settings')
- `channelId` - Selected channel
- `threadId` - Selected thread
- `isThreadOpen` - Thread overlay state

### UserContext
Manages user state:
- `user` - Current user object
- `isLoading` - Loading state

### TanStack Query
Manages server state:
- `['channels']` - Channels list
- `['threads', channelId]` - Threads in channel
- `['messages', threadId]` - Messages in thread

---

## 🚀 Development Tips

### Adding a New View
1. Create component in `src/app/views/[view-name]/index.tsx`
2. Add view type to `ViewContext`
3. Lazy load in `src/app/page.tsx`
4. Add navigation logic

### Adding a New API Route
1. Create file in `src/app/api/[route]/route.ts`
2. Export `GET`, `POST`, etc. functions
3. Use Prisma for database access
4. Validate with Zod

### Adding WebSocket Events
1. Add event handler in `src/lib/websocket-server.ts`
2. Use event in `src/app/hooks/use-websocket.ts`
3. Update components to use new events

---

## 🐛 Troubleshooting

### WebSocket Not Connecting
- Check if custom server is running (`bun run dev`)
- Verify WebSocket URL in browser console
- Check CORS settings in `websocket-server.ts`

### Messages Not Appearing
- Check WebSocket connection status
- Verify React Query cache invalidation
- Check browser console for errors

### AI Features Not Working
- Verify Zhip-AI SDK is configured
- Check API route logs
- Verify channel context is being passed

### Database Issues
- Run `bun run db:push` to sync schema
- Check `DATABASE_URL` in `.env`
- Verify Prisma client is generated

---

## 📚 Next Steps

1. **Read Full Architecture**: See `ARCHITECTURE.md`
2. **Explore Features**: See `FEATURES.md`
3. **Customize**: Modify components and styles
4. **Extend**: Add new features and views

---

## 🎉 You're Ready!

Your NavaFlow app is now running with:
- ✅ Real-time messaging
- ✅ AI-powered features
- ✅ Mobile optimization
- ✅ Performance optimizations

Happy coding! 🚀
