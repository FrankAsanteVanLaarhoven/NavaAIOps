# NavaFlow-VL-JEPA Production Inference Server

High-performance API service for NavaFlow-VL-JEPA model deployment.

## Features

- **FastAPI** production server
- **0.15ms latency target** (Ironclad requirement)
- **Model quantization** for edge deployment
- **Docker containerization** for scalable deployment
- **Batch inference** support
- **Health checks** and metrics

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Server

```bash
python main.py
```

Server will start on `http://localhost:8000`

### 3. Test Inference

```bash
# Health check
curl http://localhost:8000/health

# Inference (with image file)
curl -X POST "http://localhost:8000/predict/vision" \\
  -F "image=@your_image.jpg" \\
  -F "text_query=What is in this image?"
```

## Docker Deployment

### Build Image

```bash
docker build -t navajepa-inference .
```

### Run Container

```bash
# CPU only
docker run -p 8000:8000 navajepa-inference

# With GPU support
docker run -p 8000:8000 --gpus all navajepa-inference
```

## Model Quantization

To optimize for production:

```bash
python quantize.py
```

This will create `navajepa_int8_quantized.pth` with INT8 quantization.

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /predict/vision` - Single image inference
- `POST /predict/batch` - Batch inference
- `GET /metrics` - Model metrics

## Integration

Connect from your Next.js frontend:

```typescript
const response = await fetch('http://localhost:8000/predict/vision', {
  method: 'POST',
  body: formData  // Contains image and text_query
});

const result = await response.json();
// result.prediction, result.world_state, result.action
```

## Performance

- **Target Latency**: 0.15ms
- **Model Size**: ~2B parameters (quantized)
- **Throughput**: 1000+ requests/second (with GPU)
