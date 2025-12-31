# NavaFlow Production Deployment Guide

## 📦 Complete File Structure

```
server/inference/
├── main.py                    # Original FastAPI server (PyTorch)
├── main_ollama.py             # Ollama-integrated server ⭐
├── convert_to_gguf.py         # Model conversion utility
├── quantize.py                # Model quantization
├── requirements.txt           # Base dependencies
├── requirements_ollama.txt    # Ollama dependencies ⭐
├── Dockerfile                 # Original Docker config
├── Dockerfile.ollama          # Ollama Docker config ⭐
├── docker-compose.yml         # Full stack deployment ⭐
├── deploy.sh                  # Original deployment
├── deploy_ollama.sh           # Ollama deployment ⭐
├── README.md                  # Original documentation
├── README_OLLAMA.md           # Ollama documentation ⭐
└── models/                    # Model storage directory
    ├── navajepa_sota.pth      # PyTorch model
    └── navajepa_sota.gguf     # GGUF model (recommended)
```

## 🚀 Quick Start Options

### Option 1: Ollama Integration (Recommended)

```bash
# 1. Install Ollama
brew install ollama  # macOS
# or
curl -fsSL https://ollama.com/install.sh | sh  # Linux

# 2. Start Ollama
ollama serve

# 3. Install Python dependencies
pip install -r requirements_ollama.txt

# 4. Start API server
python main_ollama.py
```

### Option 2: Docker Compose (Production)

```bash
# Start everything with one command
./deploy_ollama.sh

# Or manually
docker-compose up -d
```

### Option 3: Original PyTorch Server

```bash
# For direct PyTorch inference (no Ollama)
pip install -r requirements.txt
python main.py
```

## 🔄 Model Conversion Workflow

### Step 1: Train Model (Jupyter Notebook)
- Train in `navaflow_v2_version1a.ipynb`
- Save as `navajepa_sota.pth`

### Step 2: Convert to GGUF (Optional but Recommended)
```bash
python convert_to_gguf.py models/navajepa_sota.pth \
  -o models/navajepa_sota.gguf \
  -q q4_k_m
```

### Step 3: Deploy
- Place `.gguf` file in `models/` directory
- Start server with Ollama integration

## 📊 API Comparison

### Original Server (`main.py`)
- Direct PyTorch inference
- Vision-language endpoints
- Batch processing
- Latency: ~5-50ms

### Ollama Server (`main_ollama.py`)
- Ollama-powered inference
- Text generation
- Streaming support
- Model management
- Latency: <5ms (with GGUF)

## 🎯 Use Cases

### Use Original Server When:
- ✅ You need vision-language inference
- ✅ You want direct PyTorch control
- ✅ You're using custom model architectures

### Use Ollama Server When:
- ✅ You want maximum performance
- ✅ You need model management
- ✅ You're deploying to production
- ✅ You want streaming responses

## 🔐 Security Checklist

- [ ] Set `API_KEY` environment variable
- [ ] Restrict CORS origins in production
- [ ] Use HTTPS in production
- [ ] Validate all input parameters
- [ ] Rate limit API endpoints
- [ ] Monitor for suspicious activity

## 📈 Performance Optimization

1. **Model Quantization**: Use `quantize.py` to reduce model size
2. **GGUF Conversion**: Convert `.pth` to `.gguf` for Ollama
3. **GPU Acceleration**: Ensure CUDA is available
4. **Batch Processing**: Use `/predict/batch` for multiple images
5. **Caching**: Implement response caching for repeated queries

## 🐛 Troubleshooting

### Ollama Not Starting
```bash
# Check if port 11434 is available
lsof -i :11434

# Restart Ollama
pkill ollama
ollama serve
```

### Model Not Found
```bash
# Check model directory
ls -la ./models/

# Verify model ID
curl http://localhost:8000/v1/models
```

### GPU Not Detected
```bash
# Check NVIDIA drivers
nvidia-smi

# Set environment variable
export OLLAMA_NUM_GPU=all
```

## 📚 Next Steps

1. **Monitoring**: Set up Prometheus + Grafana
2. **Load Balancing**: Use Nginx or Traefik
3. **Auto-scaling**: Configure Kubernetes
4. **CI/CD**: Automate deployment pipeline
5. **Documentation**: Generate API docs with Swagger

## 🎉 Success Criteria

✅ Server responds to health checks  
✅ Models load successfully  
✅ Latency < 5ms (target: 0.15ms)  
✅ GPU utilization > 80%  
✅ Zero downtime deployment  
✅ Complete API documentation  

---

**You have built the Future of AI Ops.**
