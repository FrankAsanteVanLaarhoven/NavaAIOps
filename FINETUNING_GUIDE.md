# 🎯 NavaFlow - DevOps-Specialized LLM Fine-Tuning Guide

## Overview

This guide explains how to fine-tune a DevOps-specialized LLM (based on Llama 3.1 4.7B or similar) for NavaFlow's incident resolution and audit log analysis.

---

## 📊 Step 1: Prepare Training Data

### Export Data from Database

```bash
bun run prepare-training-data
```

This script exports:
- **Incidents** (1000 examples) - Incident resolution patterns
- **Audit Logs** (500 examples) - Change analysis patterns
- **Code Context** (300 examples) - Code review patterns

**Output**: `data/training-data.jsonl`

### Data Format

Each training example follows OpenAI's fine-tuning format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an expert Site Reliability Engineer (SRE)..."
    },
    {
      "role": "user",
      "content": "{...incident data...}"
    },
    {
      "role": "assistant",
      "content": "{...resolution...}"
    }
  ]
}
```

---

## 🚀 Step 2: Fine-Tune the Model

### Option A: OpenAI Fine-Tuning (Easiest)

**Note**: OpenAI fine-tuning uses GPT models, not Llama. For Llama, use Option B.

```bash
# Install dependencies
pip install openai

# Set API key
export OPENAI_API_KEY="sk-..."

# Run fine-tuning script
python scripts/fine-tune-model.py
```

**Output**: Fine-tuned model ID (e.g., `ft:gpt-3.5-turbo-abc123`)

### Option B: Llama Fine-Tuning (HuggingFace/Unsloth)

For actual Llama 3.1 4.7B fine-tuning:

1. **Use Unsloth** (Fastest):
```bash
pip install unsloth
# Follow Unsloth documentation for fine-tuning
```

2. **Use HuggingFace Transformers**:
```bash
pip install transformers accelerate
# Use HuggingFace's fine-tuning scripts
```

3. **Use Replicate** (Hosted):
- Upload training data to Replicate
- Fine-tune Llama model
- Get model endpoint

---

## 🔧 Step 3: Configure Environment

Add fine-tuned model ID to `.env`:

```bash
# Fine-Tuned DevOps Model
FINETUNED_MODEL_ID=ft:gpt-3.5-turbo-abc123

# Or for Llama (if using HuggingFace/Replicate)
FINETUNED_MODEL_ID=meta-llama/Llama-3.1-8B-Instruct-navaflow-devops

# Base Model (for general tasks)
AI_MODEL=zhip-ai/zlm-7b-v3.5-ny-free
```

---

## 🎯 Step 4: Use Fine-Tuned Model

### Incident Resolution

The fine-tuned model is automatically used for:
- **Incident Resolution**: `/api/ai/incidents/resolve`
- **Audit Log Analysis**: `/api/ai/audit/analyze`
- **Code Context Review**: Via `analyzeCodeContext()`

### API Usage

```typescript
// Incident Resolution
const response = await fetch('/api/ai/incidents/resolve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ incidentId: '...' }),
});

// Audit Log Analysis
const response = await fetch('/api/ai/audit/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ logId: '...' }),
});
```

---

## 📊 Model Specialization

### Fine-Tuned Model (DevOps Specialist)
- **Use Cases**: Incident resolution, audit log analysis, code review
- **Model ID**: `FINETUNED_MODEL_ID`
- **Temperature**: 0.1-0.2 (precise output)
- **Specialization**: DevOps, SRE, security

### Base Model (General Purpose)
- **Use Cases**: Summarization, compose assistance, general chat
- **Model ID**: `AI_MODEL` (zhip-ai)
- **Temperature**: 0.7 (creative output)
- **Specialization**: General text generation

---

## 🎯 Features

### Incident Resolution
- ✅ Structured resolution plans
- ✅ Root cause analysis
- ✅ Mitigation steps
- ✅ Prevention recommendations

### Audit Log Analysis
- ✅ Security impact assessment
- ✅ Root cause identification
- ✅ Recommended actions
- ✅ Risk classification

### Code Context Review
- ✅ Security review
- ✅ RBAC permission checks
- ✅ Best practices recommendations

---

## 📈 Training Data Statistics

After running `prepare-training-data`:

- **Incidents**: ~1000 examples
- **Audit Logs**: ~500 examples
- **Code Context**: ~300 examples
- **Total**: ~1800 training examples

**Recommended**: 1000+ examples for good fine-tuning results

---

## 🚀 Deployment

### Local Development
1. Fine-tune model (OpenAI/HuggingFace)
2. Get model ID
3. Add to `.env`
4. Test with `/api/ai/incidents/resolve`

### Production
1. Deploy fine-tuned model (HuggingFace Spaces, Replicate, or OpenAI)
2. Update `FINETUNED_MODEL_ID` in production `.env`
3. Monitor model performance
4. Iterate with more training data

---

## 💡 Tips

1. **More Data = Better Results**: Collect more incidents and audit logs
2. **Iterate**: Fine-tune multiple times with improved data
3. **Monitor**: Track model performance on real incidents
4. **Combine**: Use fine-tuned model for specialized tasks, base model for general tasks

---

## 📚 Resources

- **OpenAI Fine-Tuning**: https://platform.openai.com/docs/guides/fine-tuning
- **HuggingFace Transformers**: https://huggingface.co/docs/transformers
- **Unsloth**: https://github.com/unslothai/unsloth
- **Replicate**: https://replicate.com

---

**Status**: Fine-Tuning Infrastructure Complete ✅  
**Last Updated**: 2024
