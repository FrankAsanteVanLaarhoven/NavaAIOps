# 🏗️ NavaFlow - Complete Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [Real-Time System](#real-time-system)
8. [AI Integration](#ai-integration)
9. [UI Component Structure](#ui-component-structure)
10. [Data Flow](#data-flow)
11. [Deployment Architecture](#deployment-architecture)

---

## 🎯 System Overview

NavaFlow is a **Single-Page Application (SPA)** built with Next.js 15, featuring:
- Real-time communication via WebSocket
- AI-powered features (context-aware summarization and compose assistance)
- Mobile-first responsive design
- Optimized performance with code splitting

### Architecture Pattern
- **Frontend**: React SPA with Context API for state management
- **Backend**: Next.js API Routes + Custom WebSocket Server
- **Database**: SQLite with Prisma ORM
- **Real-Time**: Socket.IO WebSocket server
- **AI**: Zhip-AI SDK via OpenRouter

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.3.5 (App Router)
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 4
- **Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API + Zustand (ready)
- **Data Fetching**: TanStack Query (React Query)
- **Rich Text Editor**: TipTap
- **Real-Time**: Socket.IO Client
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js (via Bun)
- **Framework**: Next.js API Routes
- **WebSocket**: Socket.IO Server
- **Database**: SQLite
- **ORM**: Prisma 6.19.1
- **AI SDK**: z-ai-web-dev-sdk
- **Validation**: Zod

### Development Tools
- **Package Manager**: Bun
- **TypeScript**: 5.9.3
- **Linting**: ESLint
- **Build Tool**: Next.js (Turbopack)

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SPA Entry Point                        │    │
│  │            (/app/page.tsx)                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                        │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         State Management Layer                       │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │ ViewContext  │  │ UserContext  │                │    │
│  │  └──────────────┘  └──────────────┘                │    │
│  └─────────────────────────────────────────────────────┘    │
│                        │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              View Components                         │    │
│  │  ┌──────────────┐  ┌──────────────┐                │    │
│  │  │ Onboarding  │  │  Main Chat   │                │    │
│  │  └──────────────┘  └──────────────┘                │    │
│  └─────────────────────────────────────────────────────┘    │
│                        │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         UI Components & Hooks                        │    │
│  │  • MessageList    • MessageEditor                    │    │
│  │  • ChannelsSidebar • ThreadsSidebar                  │    │
│  │  • AI Components  • WebSocket Hook                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        │
┌───────────────────────┴─────────────────────────────────────┐
│                    SERVER (Node.js)                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Custom Server (server.ts)                    │    │
│  │  • Next.js HTTP Server                               │    │
│  │  • Socket.IO WebSocket Server                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                        │                                      │
│        ┌───────────────┴───────────────┐                    │
│        ▼                               ▼                    │
│  ┌──────────────┐            ┌──────────────────┐          │
│  │ API Routes   │            │ WebSocket Events │          │
│  │ /api/*       │            │ • join-channel    │          │
│  │              │            │ • new-message     │          │
│  │ • channels   │            │ • typing          │          │
│  │ • threads    │            │ • presence        │          │
│  │ • messages   │            └──────────────────┘          │
│  │ • ai/*       │                                          │
│  └──────────────┘                                          │
│        │                                                    │
│        ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Business Logic Layer                         │    │
│  │  • AI Services (ai.ts, ai-context.ts)                │    │
│  │  • WebSocket Server (websocket-server.ts)            │    │
│  │  • Database Access (via Prisma)                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                        │                                      │
│                        ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Database (SQLite)                        │    │
│  │  • Users    • Channels  • Threads  • Messages        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Frontend Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # SPA Entry Point
│   ├── layout.tsx                 # Root Layout
│   ├── globals.css                # Global Styles
│   │
│   ├── state/                     # Global State Management
│   │   ├── view-context.tsx       # View routing state
│   │   └── user-context.tsx       # User state
│   │
│   ├── views/                     # View Components (Lazy Loaded)
│   │   ├── onboarding/
│   │   │   └── index.tsx          # Landing/Onboarding View
│   │   └── main-chat/             # Main Workspace View
│   │       ├── index.tsx           # Main Chat Container
│   │       ├── channels-sidebar.tsx # Channels List
│   │       ├── threads-sidebar.tsx  # Threads List
│   │       ├── message-view.tsx     # Messages Display
│   │       └── thread-overlay.tsx   # Thread Overlay (Mobile)
│   │
│   ├── hooks/                     # Custom React Hooks
│   │   ├── use-websocket.ts       # WebSocket connection
│   │   ├── use-ai-command.tsx     # AI Command Palette (Cmd+K)
│   │   └── use-mobile-gestures.ts # Touch gesture detection
│   │
│   └── api/                       # API Routes (Backend)
│       ├── channels/
│       │   ├── route.ts            # GET/POST channels
│       │   └── [channelId]/
│       │       └── threads/
│       │           └── route.ts    # GET/POST threads
│       ├── threads/
│       │   └── [threadId]/
│       │       └── messages/
│       │           └── route.ts    # GET/POST messages
│       ├── ai/
│       │   ├── summarize/
│       │   │   └── route.ts        # AI Thread Summarization
│       │   └── compose/
│       │       └── route.ts        # AI Text Improvement
│       ├── user/
│       │   └── route.ts            # User management
│       └── seed/
│           └── route.ts            # Demo data seeding
│
├── components/                    # Reusable Components
│   ├── ui/                        # shadcn/ui Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (40+ components)
│   │
│   ├── chat/                      # Chat-Specific Components
│   │   ├── MessageList.tsx         # Messages display
│   │   ├── MessageEditor.tsx       # TipTap editor + send
│   │   ├── SummarizeThread.tsx    # AI thread summary
│   │   ├── ComposeAssistant.tsx    # AI text improvement
│   │   └── TypingIndicator.tsx     # Real-time typing display
│   │
│   └── ai/                        # AI Components
│       └── floating-ai-panel.tsx  # Floating AI panel wrapper
│
└── lib/                           # Utilities & Services
    ├── db.ts                      # Prisma client
    ├── utils.ts                   # Utility functions
    ├── ai.ts                      # AI service functions
    ├── ai-context.ts              # Context-aware AI logic
    ├── markdown.ts                # Markdown utilities
    └── websocket-server.ts        # WebSocket server logic
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    ViewContext                          │
│  Manages: view, channelId, threadId, isThreadOpen       │
│  Actions: setView, setChannel, setThread, navigate      │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    UserContext                          │
│  Manages: user, isLoading                               │
│  Actions: setUser                                       │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              TanStack Query (React Query)                │
│  Manages: Server state, caching, refetching             │
│  Queries: channels, threads, messages                  │
└─────────────────────────────────────────────────────────┘
```

### View Routing System

The app uses a **view-based routing system** (not URL-based):

```typescript
// View Types
type ViewType = 'onboarding' | 'main-chat' | 'settings' | 'profile';

// View State
interface ViewState {
  view: ViewType;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
  isThreadOpen?: boolean;
}
```

**Navigation Flow:**
1. User clicks channel → `setChannel(channelId)` → Updates `viewState.channelId`
2. User clicks thread → `setThread(threadId)` → Updates `viewState.threadId`
3. All components react to state changes → No page reloads

---

## ⚙️ Backend Architecture

### API Routes Structure

```
/api
├── channels/
│   ├── GET    → List all channels
│   └── POST   → Create new channel
│
├── channels/[channelId]/threads/
│   ├── GET    → List threads in channel
│   └── POST   → Create new thread
│
├── threads/[threadId]/messages/
│   ├── GET    → List messages in thread
│   └── POST   → Create new message
│
├── ai/
│   ├── summarize/
│   │   └── POST → Generate thread summary (streaming)
│   └── compose/
│       └── POST → Improve text (streaming)
│
├── user/
│   ├── GET    → Get current user
│   └── POST   → Create user
│
└── seed/
    └── POST   → Seed demo data
```

### Request Flow Example: Creating a Message

```
1. User types message → MessageEditor component
2. User clicks Send → handleSend()
3. POST /api/threads/[threadId]/messages
   │
   ├─→ Validate request (Zod)
   ├─→ Get/Create user
   ├─→ Create message in DB (Prisma)
   ├─→ Update thread updatedAt
   └─→ Return message with user data
4. Invalidate React Query cache
5. WebSocket broadcasts to all clients in thread
6. All clients receive message-received event
7. UI updates automatically
```

### WebSocket Event Flow

```
Client                    Server                    Other Clients
  │                         │                            │
  │── join-thread ──────────>│                            │
  │                         │── user-joined-thread ─────>│
  │<── thread-joined ───────│                            │
  │                         │                            │
  │── typing ──────────────>│                            │
  │                         │── user-typing ────────────>│
  │                         │                            │
  │── new-message ─────────>│                            │
  │                         │── message-received ────────>│
  │<── message-received ────│                            │
```

---

## 🗄️ Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Channel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  threads   Thread[]
}

model Thread {
  id        String   @id @default(cuid())
  channelId String
  channel   Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  title     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  threadId  String
  thread    Thread   @relation(fields: [threadId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  content   String   // JSON string from TipTap editor
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Relationships
- **Channel** → has many **Threads**
- **Thread** → belongs to **Channel**, has many **Messages**
- **Message** → belongs to **Thread** and **User**

---

## 🔄 Real-Time System

### WebSocket Server (`server.ts`)

The custom server integrates Next.js HTTP server with Socket.IO:

```typescript
// server.ts structure
1. Create HTTP server
2. Initialize Next.js app
3. Initialize WebSocket server
4. Handle HTTP requests → Next.js
5. Handle WebSocket connections → Socket.IO
```

### WebSocket Rooms

- **Channel Room**: `channel:{channelId}` - All users in a channel
- **Thread Room**: `thread:{threadId}` - All users viewing a thread

### Real-Time Features

1. **Message Broadcasting**
   - When message created → Broadcast to thread room
   - All clients in thread receive update instantly

2. **Typing Indicators**
   - User types → Emit `typing` event
   - Server broadcasts to thread room
   - Other users see typing indicator
   - Auto-stop after 3 seconds

3. **Presence System**
   - User connects → Update presence
   - Broadcast to all connections
   - Track online/away/offline

---

## 🤖 AI Integration

### AI Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│              AI Request Flow                              │
└─────────────────────────────────────────────────────────┘

User Action
    │
    ▼
Component (SummarizeThread/ComposeAssistant)
    │
    ▼
POST /api/ai/summarize or /api/ai/compose
    │
    ├─→ Get channel context (if channelId provided)
    │   └─→ ai-context.ts: getChannelContext()
    │       ├─→ Detect channel type
    │       └─→ Extract recent topics
    │
    ├─→ Generate context-aware prompt
    │   └─→ ai-context.ts: generateContextAwarePrompt()
    │
    ├─→ Call AI service
    │   └─→ ai.ts: summarizeThread() or improveCompose()
    │       └─→ Zhip-AI SDK (OpenRouter)
    │
    └─→ Stream response back to client
        └─→ Client renders streaming text
```

### Context-Aware AI

The AI adapts based on:

1. **Channel Type Detection**
   - Engineering → Technical terminology
   - Sales → Professional, persuasive
   - Support → Helpful, solution-oriented

2. **Recent Topics**
   - Extracts from thread titles
   - Informs AI about channel context

3. **System Prompts**
   - Generated dynamically
   - Include channel context
   - Adapt to task (summarize vs compose)

---

## 🎨 UI Component Structure

### Main Chat View Layout

```
MainChatView (index.tsx)
│
├─→ ResizablePanelGroup (Desktop) / Single Panel (Mobile)
│   │
│   ├─→ Panel 1: ChannelsSidebar
│   │   ├─→ Channel List
│   │   └─→ Channel Selection
│   │
│   ├─→ Panel 2: ThreadsSidebar
│   │   ├─→ Thread List (filtered by channel)
│   │   └─→ Thread Selection
│   │
│   └─→ Panel 3: MessageView
│       ├─→ MessageList
│       │   ├─→ Message Items
│       │   └─→ TypingIndicator
│       │
│       └─→ MessageEditor
│           ├─→ TipTap Editor
│           ├─→ ComposeAssistant Button
│           └─→ Send Button
│
└─→ FloatingAIPanel (Top Right)
    └─→ SummarizeThread Component
```

### Component Hierarchy

```
App (page.tsx)
│
├─→ QueryClientProvider
│   │
│   ├─→ UserProvider
│   │   │
│   │   └─→ ViewProvider
│   │       │
│   │       └─→ AppContent
│   │           │
│   │           ├─→ MainChatView (lazy)
│   │           │   │
│   │           │   ├─→ ChannelsSidebar
│   │           │   │   └─→ useQuery(['channels'])
│   │           │   │
│   │           │   ├─→ ThreadsSidebar
│   │           │   │   └─→ useQuery(['threads', channelId])
│   │           │   │
│   │           │   └─→ MessageView
│   │           │       │
│   │           │       ├─→ MessageList
│   │           │       │   ├─→ useQuery(['messages', threadId])
│   │           │       │   ├─→ useWebSocket()
│   │           │       │   └─→ TypingIndicator
│   │           │       │
│   │           │       └─→ MessageEditor
│   │           │           ├─→ TipTap Editor
│   │           │           ├─→ useWebSocket() (typing)
│   │           │           └─→ ComposeAssistant
│   │           │
│   │           └─→ AICommandPalette (Cmd+K)
│   │
│   └─→ OnboardingView (lazy)
```

### Key UI Components

#### 1. ChannelsSidebar
- **Purpose**: Display and select channels
- **State**: Uses `useView()` to get/update `channelId`
- **Data**: Fetches via `useQuery(['channels'])`
- **Features**: 
  - Loading skeletons
  - Active state highlighting
  - Click to switch channels

#### 2. ThreadsSidebar
- **Purpose**: Display threads in selected channel
- **State**: Uses `useView()` to get/update `threadId`
- **Data**: Fetches via `useQuery(['threads', channelId])`
- **Features**:
  - Thread count display
  - Active thread highlighting
  - Create thread button

#### 3. MessageList
- **Purpose**: Display messages in thread
- **State**: Uses `useView()` to get `threadId`
- **Data**: 
  - Fetches via `useQuery(['messages', threadId])`
  - Real-time updates via `useWebSocket()`
- **Features**:
  - Message rendering with TipTap
  - Typing indicators
  - Auto-scroll to bottom
  - AI Summary button

#### 4. MessageEditor
- **Purpose**: Compose and send messages
- **Editor**: TipTap rich text editor
- **Features**:
  - Real-time typing indicators
  - Compose Assistant integration
  - Send button (disabled when empty)

#### 5. AI Components

**SummarizeThread**
- **Trigger**: Floating button or command palette
- **Flow**: 
  1. Click → Fetch thread messages
  2. Convert to markdown
  3. Get channel context
  4. Stream AI response
  5. Display markdown-rendered summary

**ComposeAssistant**
- **Trigger**: Button in message editor
- **Flow**:
  1. Get current draft
  2. Convert to markdown
  3. Get channel context
  4. Stream improved text
  5. Convert back to TipTap JSON
  6. User accepts → Updates editor

---

## 📊 Data Flow

### Complete Message Creation Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER INTERACTION                                      │
│    User types in MessageEditor                          │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. TYPING INDICATOR                                      │
│    useWebSocket().sendTyping()                           │
│    → WebSocket: 'typing' event                           │
│    → Other users see typing indicator                    │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. MESSAGE SEND                                          │
│    handleSend() → POST /api/threads/[id]/messages        │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 4. SERVER PROCESSING                                     │
│    ├─→ Validate request                                  │
│    ├─→ Get/Create user                                   │
│    ├─→ Create message in DB (Prisma)                     │
│    ├─→ Update thread.updatedAt                            │
│    └─→ Return message with user data                     │
└─────────────────────────────────────────────────────────┘
                    │
                    ├──────────────────┐
                    ▼                  ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ 5a. HTTP RESPONSE        │  │ 5b. WEBSOCKET BROADCAST  │
│    → React Query cache   │  │    → Socket.IO emit      │
│    → Invalidate query   │  │    → 'message-received'   │
│    → Refetch messages    │  │    → All clients update  │
└──────────────────────────┘  └──────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 6. UI UPDATE                                             │
│    ├─→ MessageList re-renders                            │
│    ├─→ New message appears                              │
│    ├─→ Typing indicator stops                           │
│    └─→ Editor clears                                    │
└─────────────────────────────────────────────────────────┘
```

### AI Request Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER TRIGGERS AI                                      │
│    Click "AI Summary" or "Compose Assistant"             │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CLIENT PREPARATION                                    │
│    ├─→ Get threadId/channelId                           │
│    ├─→ Prepare request body                              │
│    └─→ Create AbortController for cancellation          │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 3. API REQUEST                                           │
│    POST /api/ai/summarize or /api/ai/compose            │
│    Body: { threadId, channelId?, draft? }               │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 4. SERVER PROCESSING                                     │
│    ├─→ Get channel context (if channelId)               │
│    │   └─→ Detect channel type & topics                 │
│    ├─→ Generate context-aware prompt                    │
│    ├─→ Fetch thread messages (for summarize)            │
│    ├─→ Convert TipTap JSON to markdown                  │
│    └─→ Call Zhip-AI SDK                                  │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 5. STREAMING RESPONSE                                    │
│    Server-Sent Events (SSE)                              │
│    Format: "data: { content: '...' }\n\n"              │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ 6. CLIENT STREAMING                                      │
│    ├─→ Read stream chunks                               │
│    ├─→ Parse JSON                                       │
│    ├─→ Update UI incrementally                          │
│    └─→ Render markdown (for summary)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

### Development

```
┌─────────────────────────────────────────────────────────┐
│                    Development Server                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Custom Server (server.ts)                        │  │
│  │  • Next.js Dev Server (Turbopack)                 │  │
│  │  • Socket.IO WebSocket                            │  │
│  │  • Hot Module Replacement                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Port: 3000                                              │
│  Database: SQLite (./db/custom.db)                      │
└─────────────────────────────────────────────────────────┘
```

### Production

```
┌─────────────────────────────────────────────────────────┐
│                  Production Server                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Custom Server (server.ts)                        │  │
│  │  • Next.js Standalone Server                     │  │
│  │  • Socket.IO WebSocket                           │  │
│  │  • Optimized Build                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Reverse Proxy (Caddy/Nginx)                      │  │
│  │  • SSL/TLS Termination                            │  │
│  │  • Load Balancing (if multiple instances)          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Database: SQLite (or PostgreSQL for scale)              │
│  Static Assets: CDN (optional)                          │
└─────────────────────────────────────────────────────────┘
```

### Environment Variables

```env
# Database
DATABASE_URL="file:./db/custom.db"

# WebSocket (optional, defaults to same origin)
NEXT_PUBLIC_WS_URL="http://localhost:3000"

# Node Environment
NODE_ENV="production"

# Port
PORT=3000
```

---

## 📝 Key Design Decisions

### 1. Why SPA Instead of Multi-Page?

- **Instant Navigation**: No page reloads, feels like native app
- **State Persistence**: Context state survives navigation
- **Better UX**: Smooth transitions, loading states
- **Real-Time**: WebSocket connection persists across views

### 2. Why Context API Instead of Redux?

- **Simplicity**: Less boilerplate, easier to understand
- **Built-in**: No external dependencies
- **Sufficient**: App state is relatively simple
- **Future-ready**: Can migrate to Zustand if needed

### 3. Why Custom Server?

- **WebSocket Integration**: Socket.IO needs HTTP server
- **Unified Port**: Same port for HTTP and WebSocket
- **Production Ready**: Works in both dev and prod

### 4. Why SQLite?

- **Simplicity**: No separate database server
- **Development**: Easy to set up and reset
- **Production**: Can migrate to PostgreSQL easily
- **Prisma**: ORM abstracts database differences

### 5. Why Lazy Loading?

- **Performance**: Smaller initial bundle
- **Code Splitting**: Only load what's needed
- **Better UX**: Faster initial page load
- **Scalability**: Easy to add more views

---

## 🔧 Development Workflow

### Starting the App

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

### File Organization Principles

1. **Views** (`app/views/`): Top-level screens, lazy-loaded
2. **Components** (`components/`): Reusable UI components
3. **Hooks** (`app/hooks/`): Custom React hooks
4. **State** (`app/state/`): Global state management
5. **API** (`app/api/`): Backend API routes
6. **Lib** (`lib/`): Utilities and services

### Code Splitting Strategy

- **Views**: Lazy loaded with `React.lazy()`
- **Heavy Components**: Can be lazy loaded if needed
- **Routes**: Not used (SPA), but structure supports it

---

## 🎯 Performance Optimizations

1. **Code Splitting**: Views loaded on demand
2. **Lazy Loading**: Components loaded when needed
3. **Query Caching**: TanStack Query caches API responses
4. **WebSocket**: Eliminates polling overhead
5. **Content Visibility**: CSS optimizations for off-screen content
6. **Suspense**: Loading states prevent layout shifts

---

## 🔐 Security Considerations

1. **Input Validation**: Zod schemas validate all API inputs
2. **SQL Injection**: Prisma ORM prevents SQL injection
3. **XSS Protection**: React escapes by default, DOMPurify for markdown
4. **CORS**: Configured for WebSocket connections
5. **Rate Limiting**: Can be added via middleware (Arcjet ready)

---

## 📚 Additional Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Socket.IO Docs**: https://socket.io/docs
- **TipTap Docs**: https://tiptap.dev/docs
- **TanStack Query**: https://tanstack.com/query

---

## 🎉 Summary

NavaFlow is a **modern, production-ready SPA** with:

✅ **Real-time communication** via WebSocket  
✅ **AI-powered features** with context awareness  
✅ **Mobile-optimized** with touch gestures  
✅ **Performance-optimized** with code splitting  
✅ **Scalable architecture** ready for growth  

The architecture is designed to be:
- **Maintainable**: Clear separation of concerns
- **Scalable**: Can handle growth
- **Performant**: Optimized for speed
- **Developer-friendly**: Easy to understand and extend

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Architecture**: SPA with Real-Time + AI
