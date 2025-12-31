# 🏗️ NavaFlow Architecture - Quick Reference

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NavaFlow Ecosystem                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Frontend       │  │  Inference       │  │   Blockchain      │
│   (Next.js SPA)  │  │  Server (Ollama) │  │   (Ethereum)      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Cloud Services       │
                    │  (Vercel KV/Blob/DB)   │
                    └────────────────────────┘
```

## Core Components

### 1. Frontend (Next.js)
- **Splash Page** - Biometric authentication
- **Main Chat** - Real-time messaging
- **Dashboard** - Performance & analytics
- **Holographic View** - 3D visualization

### 2. Backend (Next.js API)
- **WebSocket Server** - Real-time communication
- **AI Services** - Summarization, composition
- **SRE Agent** - Autonomous incident response
- **CMDP Loop** - Constrained decision making

### 3. Inference Server (FastAPI + Ollama)
- **Model Serving** - VL-JEPA models
- **Text Generation** - Streaming responses
- **Vision-Language** - Image + text inference
- **Quantization** - INT8 optimization

### 4. Security
- **Zero-Trust** - Continuous verification
- **Biometrics** - Face & palm scanning
- **Blockchain** - Audit ledger
- **Certificates** - PDF execution reports

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4 |
| **Backend** | Next.js API Routes, Socket.IO |
| **Database** | SQLite (Dev) / PostgreSQL (Prod) |
| **AI/ML** | Ollama, PyTorch, VL-JEPA |
| **Cloud** | Vercel KV/Blob, Neon PostgreSQL |
| **Blockchain** | Ethereum (Solidity) |
| **Security** | MediaPipe, Zero-Trust |

## Key Features

✅ **Real-Time** - WebSocket messaging  
✅ **AI-Powered** - VL-JEPA, CMDP, SRE Agent  
✅ **Secure** - Zero-trust, biometrics, blockchain  
✅ **Scalable** - Cloud-native, microservices  
✅ **Fast** - 0.15ms latency target (Ironclad)  

## API Endpoints

### Core
- `GET /api/channels` - List channels
- `GET /api/threads/[id]/messages` - Get messages
- `POST /api/threads/[id]/messages` - Create message

### AI
- `POST /api/ai/summarize` - Summarize thread
- `POST /api/ai/compose` - Improve text
- `POST /api/ai/sre/remediate` - SRE remediation

### Inference
- `GET /health` - Health check
- `POST /v1/generate` - Text generation
- `POST /v1/vision` - Vision-language inference

## File Locations

| Component | Location |
|-----------|----------|
| **Frontend** | `src/app/` |
| **Components** | `src/components/` |
| **API Routes** | `src/app/api/` |
| **Inference Server** | `server/inference/` |
| **Database** | `prisma/` |
| **Smart Contracts** | `nava-contracts/` |
| **VL-JEPA Model** | `navaflow_v2_version1a.ipynb` |

## Quick Start

```bash
# Frontend
bun install
bun run dev

# Inference Server
cd server/inference
pip install -r requirements_ollama.txt
python main_ollama.py

# Or Docker
docker-compose up -d
```

## Performance Targets

- **Latency**: 0.15ms (Ironclad)
- **Throughput**: 1000+ req/s
- **Database**: <10ms queries
- **WebSocket**: <50ms delivery

---

**For complete details, see [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)**
