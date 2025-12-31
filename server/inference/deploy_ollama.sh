#!/bin/bash

# NavaFlow-VL-JEPA Deployment Script with Ollama Integration

set -e

echo "🚀 NavaFlow Production Server with Ollama Integration"
echo "===================================================="

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not found. Installing..."
    echo ""
    echo "Please install Ollama:"
    echo "  macOS: brew install ollama"
    echo "  Linux: curl -fsSL https://ollama.com/install.sh | sh"
    echo ""
    read -p "Press Enter after installing Ollama, or Ctrl+C to exit..."
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama service not running. Starting Ollama..."
    echo ""
    echo "Starting Ollama in background..."
    ollama serve &
    sleep 5
    
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ Failed to start Ollama. Please start it manually:"
        echo "   ollama serve"
        exit 1
    fi
    echo "✅ Ollama started"
fi

echo ""
echo "📦 Step 1: Checking models..."
MODEL_DIR="./models"
mkdir -p "$MODEL_DIR"

if [ ! -f "$MODEL_DIR/navajepa_sota.pth" ] && [ ! -f "$MODEL_DIR/navajepa_sota.gguf" ]; then
    echo "⚠️  No model files found in $MODEL_DIR"
    echo "   Please place your trained models in: $MODEL_DIR/"
    echo "   Recommended: navajepa_sota.gguf (for Ollama)"
fi

echo ""
echo "🐳 Step 2: Building Docker images..."
docker-compose build

echo ""
echo "🚀 Step 3: Starting services..."
echo "   API Server: http://localhost:8000"
echo "   Ollama: http://localhost:11434"
echo "   Press Ctrl+C to stop"
echo ""

docker-compose up
