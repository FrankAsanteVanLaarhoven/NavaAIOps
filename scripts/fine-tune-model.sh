#!/bin/bash

# Fine-tune DevOps-specialized LLM
# This script prepares and runs fine-tuning

set -e

echo "🚀 NavaFlow - DevOps LLM Fine-Tuning"
echo ""

# Check if training data exists
if [ ! -f "data/training-data.jsonl" ]; then
    echo "❌ Training data not found!"
    echo "   Run: bun run prepare-training-data"
    exit 1
fi

# Count training examples
TRAINING_COUNT=$(wc -l < data/training-data.jsonl | tr -d ' ')
echo "📊 Training Data: $TRAINING_COUNT examples"
echo ""

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not set"
    echo "   Set it with: export OPENAI_API_KEY='sk-...'"
    echo ""
    echo "💡 For Llama fine-tuning, use HuggingFace/Unsloth instead"
    echo "   See FINETUNING_GUIDE.md for details"
    exit 1
fi

echo "✅ OpenAI API key found"
echo ""

# Check Python dependencies
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    echo "   Install Python 3 to continue"
    exit 1
fi

# Install OpenAI package if needed
if ! python3 -c "import openai" 2>/dev/null; then
    echo "📦 Installing OpenAI Python package..."
    pip3 install openai
fi

echo "🚀 Starting fine-tuning..."
echo "   This may take 10-30 minutes depending on data size"
echo ""

# Run fine-tuning script
python3 scripts/fine-tune-model.py

echo ""
echo "✅ Fine-tuning complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the Model ID from above"
echo "   2. Add to .env: FINETUNED_MODEL_ID=ft:..."
echo "   3. Restart the application"
echo "   4. Test with: POST /api/ai/incidents/resolve"
