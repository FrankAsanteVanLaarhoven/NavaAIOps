#!/usr/bin/env python3
"""
Fine-tune Llama 3.1 4.7B (or similar) for DevOps specialization
Uses OpenAI-compatible format for training data
"""

import os
import json
import time
from openai import OpenAI

# Load training data
training_file_path = "data/training-data.jsonl"

if not os.path.exists(training_file_path):
    print(f"❌ Training data file not found: {training_file_path}")
    print("   Run: bun run scripts/prepare-training-data.ts first")
    exit(1)

print(f"📁 Loading training data from {training_file_path}...")

# Count lines
with open(training_file_path, "r", encoding="utf-8") as f:
    lines = [line for line in f if line.strip()]
    training_count = len(lines)

print(f"✅ Loaded {training_count} training examples")

# Initialize OpenAI client
api_key = os.environ.get("OPENAI_API_KEY")
if not api_key:
    print("❌ OPENAI_API_KEY environment variable not set")
    exit(1)

client = OpenAI(api_key=api_key)

# Upload training file
print("\n📤 Uploading training file to OpenAI...")
training_file = client.files.create(
    file=open(training_file_path, "rb"),
    purpose="fine-tune"
)
print(f"✅ File uploaded: {training_file.id}")

# Start fine-tuning job
# Note: For Llama models, you'd typically use HuggingFace/Replicate
# This example uses OpenAI's fine-tuning API (which uses GPT models)
# For actual Llama fine-tuning, use HuggingFace Transformers or Unsloth

print("\n🚀 Starting fine-tuning job...")
print("   Note: For Llama models, use HuggingFace Transformers or Unsloth instead")
print("   This example uses OpenAI's API for demonstration")

# For OpenAI fine-tuning (uses GPT models, not Llama)
# To fine-tune Llama, you'd need to:
# 1. Use HuggingFace Transformers
# 2. Use Unsloth (faster training)
# 3. Use Replicate or other Llama hosting services

try:
    fine_tune_job = client.fine_tuning.jobs.create(
        training_file=training_file.id,
        model="gpt-3.5-turbo",  # Base model (replace with Llama via HuggingFace)
        hyperparameters={
            "n_epochs": 3,
            "batch_size": 1,
            "learning_rate_multiplier": 2,
        },
        suffix="navaflow-devops-v1"
    )

    print(f"✅ Started fine-tuning job: {fine_tune_job.id}")
    print(f"   Status: {fine_tune_job.status}")

    # Poll for completion
    print("\n⏳ Waiting for fine-tuning to complete...")
    while True:
        status = client.fine_tuning.jobs.retrieve(fine_tune_job.id)
        
        if status.status == "succeeded":
            print(f"\n✅ Fine-tuning job {status.id} completed successfully!")
            print(f"   Model ID: {status.fine_tuned_model}")
            print(f"   Trained Tokens: {status.trained_tokens}")
            print(f"\n📝 Add to .env:")
            print(f"   FINETUNED_MODEL_ID={status.fine_tuned_model}")
            break
        elif status.status == "failed":
            print(f"\n❌ Fine-tuning job {status.id} failed")
            if hasattr(status, 'error'):
                print(f"   Error: {status.error}")
            break
        else:
            print(f"   Status: {status.status} - {getattr(status, 'trained_tokens', 0)} tokens trained...")
            time.sleep(30)

except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\n💡 For Llama fine-tuning, use:")
    print("   - HuggingFace Transformers: https://huggingface.co/docs/transformers")
    print("   - Unsloth: https://github.com/unslothai/unsloth")
    print("   - Replicate: https://replicate.com")
