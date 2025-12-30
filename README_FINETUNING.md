# 🎯 Quick Start: Fine-Tuning DevOps LLM

## ✅ Step 1: Training Data (COMPLETE)

Sample training data has been created:
- **File**: `data/training-data.jsonl`
- **Examples**: 8 (3 incidents, 3 audit logs, 2 code context)
- **Status**: ✅ Ready

---

## 🚀 Step 2: Fine-Tune Model

### Option A: OpenAI (Easiest)

```bash
# 1. Set API key
export OPENAI_API_KEY="sk-..."

# 2. Run fine-tuning
./scripts/fine-tune-model.sh
```

**Output**: Model ID (e.g., `ft:gpt-3.5-turbo-abc123`)

### Option B: Llama (HuggingFace)

See `FINETUNING_GUIDE.md` for Llama fine-tuning instructions.

---

## 🔧 Step 3: Configure

Add to `.env`:
```bash
FINETUNED_MODEL_ID=ft:gpt-3.5-turbo-abc123
```

---

## ✅ Step 4: Test

1. Open an incident in NavaFlow
2. Click "Analyze with DevOps Model"
3. See AI-powered resolution

---

## 📊 Current Status

- ✅ Training data: Ready (8 examples)
- ⏳ Fine-tuning: Pending (requires API key)
- ✅ Integration: Complete
- ✅ Frontend: Ready

**Next**: Run fine-tuning script with your OpenAI API key!
