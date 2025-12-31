#!/bin/bash

# NavaFlow-VL-JEPA Deployment Script

set -e

echo "🚀 NavaFlow-VL-JEPA Deployment Script"
echo "======================================"

# 1. Build Docker Image
echo ""
echo "📦 Step 1: Building Docker image..."
docker build -t navajepa-inference:latest .

# 2. Run Container
echo ""
echo "🐳 Step 2: Starting container..."
echo "   Server will be available at http://localhost:8000"
echo "   Press Ctrl+C to stop"

# Check for GPU
if command -v nvidia-smi &> /dev/null; then
    echo "   ✅ GPU detected - using GPU acceleration"
    docker run -p 8000:8000 --gpus all navajepa-inference:latest
else
    echo "   ⚠️  No GPU detected - using CPU"
    docker run -p 8000:8000 navajepa-inference:latest
fi
