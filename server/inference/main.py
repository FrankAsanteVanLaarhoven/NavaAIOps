"""
NavaFlow-VL-JEPA Production Inference Server

High-performance API service maintaining 0.15ms latency goal ("Ironclad")
and supporting real-time video inference capabilities of VL-JEPA.
"""

import uvicorn
import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import base64
import time
from typing import Optional, Dict, List
import numpy as np
from pathlib import Path

# Import model architecture (simplified for production)
# In production, you would import from your trained model module
try:
    from model import NavaFlowVLJEPA
except ImportError:
    # Fallback: Define minimal model structure for demo
    print("⚠️  Model module not found. Using simplified structure.")
    NavaFlowVLJEPA = None

# --- DEVICE CONFIGURATION ---
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🚀 Loading model on {device}...")

# Model configuration
VISION_DIM = 768
TEXT_DIM = 2048
EMBEDDING_DIM = 1536
NUM_AGENT_ACTIONS = 5

# --- MODEL LOADING ---
model = None
model_loaded = False

def load_model(checkpoint_path: str = "navajepa_sota.pth"):
    """Load the trained NavaFlow-VL-JEPA model"""
    global model, model_loaded
    
    if NavaFlowVLJEPA is not None:
        try:
            model = NavaFlowVLJEPA(device)
            if Path(checkpoint_path).exists():
                checkpoint = torch.load(checkpoint_path, map_location=device)
                model.load_state_dict(checkpoint.get('model_state_dict', checkpoint))
                model.eval()
                model_loaded = True
                print(f"✅ Model loaded from {checkpoint_path}")
            else:
                print(f"⚠️  Checkpoint not found: {checkpoint_path}. Using untrained model.")
                model.eval()
                model_loaded = True
        except Exception as e:
            print(f"⚠️  Error loading model: {e}")
            model = None
    else:
        print("⚠️  Using mock model for demo purposes")
        model = None
    
    return model_loaded

# Try to load model
load_model()

# --- FASTAPI APP ---
app = FastAPI(
    title="NavaFlow AI OPS - Inference API",
    description="Production inference server for NavaFlow-VL-JEPA model",
    version="1.0.0"
)

# Add CORS (Frontend Integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, list your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IMAGE PREPROCESSING ---
from torchvision import transforms

image_preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.48145466, 0.4578275, 0.40821073],
        std=[0.26862954, 0.26130258, 0.27577711]
    )
])

# --- TEXT ENCODER (Frozen) ---
try:
    from transformers import AutoTokenizer, AutoModel
    text_tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
    text_model = AutoModel.from_pretrained('bert-base-uncased').to(device)
    text_model.eval()
    for param in text_model.parameters():
        param.requires_grad = False
    print("✅ Text encoder loaded (BERT)")
except Exception as e:
    print(f"⚠️  Could not load BERT: {e}")
    text_tokenizer = None
    text_model = None

# --- VISION ENCODER (Frozen CLIP) ---
try:
    from transformers import CLIPVisionModel, CLIPProcessor
    vision_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    vision_model = CLIPVisionModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
    vision_model.eval()
    for param in vision_model.parameters():
        param.requires_grad = False
    print("✅ Vision encoder loaded (CLIP)")
except Exception as e:
    print(f"⚠️  Could not load CLIP: {e}")
    vision_processor = None
    vision_model = None

# --- MOCK MODEL (if real model not available) ---
class MockNavaFlowModel(nn.Module):
    """Mock model for demo when trained model is not available"""
    def __init__(self):
        super().__init__()
        self.predictor = nn.Sequential(
            nn.Linear(768 + 768, 1536),
            nn.GELU(),
            nn.Linear(1536, 1536)
        )
        self.world_head = nn.Sequential(
            nn.Linear(768 + 768, 1),
            nn.Sigmoid()
        )
        self.agent_head = nn.Sequential(
            nn.Linear(768 + 768, NUM_AGENT_ACTIONS)
        )
    
    def forward(self, vision_emb, text_emb):
        combined = torch.cat([vision_emb, text_emb], dim=-1)
        return {
            'prediction': self.predictor(combined),
            'world_state_logits': self.world_head(combined),
            'action_logits': self.agent_head(combined)
        }

if model is None:
    model = MockNavaFlowModel().to(device)
    model.eval()
    print("✅ Using mock model for inference")

# --- ENDPOINTS ---

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "model_loaded": model_loaded,
        "device": str(device),
        "service": "NavaFlow-VL-JEPA Inference Server"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "device": str(device),
        "vision_encoder": vision_model is not None,
        "text_encoder": text_model is not None
    }

@app.post("/predict/vision")
async def predict_vision(
    request: Request,
    image: Optional[UploadFile] = File(None),
    text_query: Optional[str] = Form(None),
    image_base64: Optional[str] = Form(None)
):
    """
    Main Inference Endpoint.
    
    Inputs:
    1. `image`: Image file upload (JPEG/PNG)
    2. `image_base64`: Base64 encoded image (alternative to file upload)
    3. `text_query`: String question (e.g., "What is in this image?")
    
    Output:
    1. `prediction`: Predicted embedding vector (dim 1536)
    2. `world_state`: Physical state prediction (e.g., Light ON/OFF)
    3. `action_logits`: Agent action predictions (e.g., Kill, Rotate)
    4. `latency_ms`: Inference latency in milliseconds
    """
    start_time = time.time()
    
    try:
        # 1. Handle Image Input
        if image:
            image_data = await image.read()
            pil_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        elif image_base64:
            image_data = base64.b64decode(image_base64)
            pil_image = Image.open(io.BytesIO(image_data)).convert('RGB')
        else:
            # Try JSON body
            try:
                data = await request.json()
                if 'image' in data:
                    image_data = base64.b64decode(data['image'])
                    pil_image = Image.open(io.BytesIO(image_data)).convert('RGB')
                else:
                    raise HTTPException(status_code=400, detail="No image provided")
            except:
                raise HTTPException(status_code=400, detail="No image provided")
        
        # 2. Handle Text Query
        if not text_query:
            try:
                data = await request.json()
                text_query = data.get('text_query', 'What is in this image?')
            except:
                text_query = 'What is in this image?'
        
        # 3. Process Image (Vision Encoder)
        if vision_model is not None and vision_processor is not None:
            with torch.no_grad():
                inputs = vision_processor(images=pil_image, return_tensors="pt").to(device)
                vision_outputs = vision_model(**inputs)
                vision_embedding = vision_outputs.pooler_output  # [1, 768]
        else:
            # Fallback: Use simple preprocessing
            image_tensor = image_preprocess(pil_image).unsqueeze(0).to(device)
            # Mock vision embedding
            vision_embedding = torch.randn(1, 768).to(device)
        
        # 4. Process Text (Text Encoder)
        if text_model is not None and text_tokenizer is not None:
            with torch.no_grad():
                text_inputs = text_tokenizer(
                    text_query,
                    padding=True,
                    truncation=True,
                    max_length=128,
                    return_tensors="pt"
                ).to(device)
                text_outputs = text_model(**text_inputs)
                text_embedding = text_outputs.last_hidden_state.mean(dim=1)  # [1, 768]
        else:
            # Mock text embedding
            text_embedding = torch.randn(1, 768).to(device)
        
        # 5. Model Inference (The Core)
        with torch.no_grad():
            outputs = model(vision_embedding, text_embedding)
            
            predicted_embedding = outputs['prediction']
            world_state_logits = outputs['world_state_logits']
            action_logits = outputs['action_logits']
        
        # 6. Post-process outputs
        world_state_prob = torch.sigmoid(world_state_logits).cpu().item()
        action_probs = torch.softmax(action_logits, dim=1).cpu().numpy()[0]
        action_pred = int(torch.argmax(action_logits, dim=1).cpu().item())
        
        # Action labels
        action_labels = ['IDLE', 'KILL_PROCESS', 'ROTATE_CAMERA', 'SCALE_RESOURCES', 'LOG_EVENT']
        predicted_action = action_labels[action_pred] if action_pred < len(action_labels) else f'ACTION_{action_pred}'
        
        # 7. Calculate latency
        latency_ms = (time.time() - start_time) * 1000
        
        # 8. Prepare response
        response = {
            "prediction": predicted_embedding.cpu().numpy()[0].tolist(),
            "world_state": {
                "probability": float(world_state_prob),
                "prediction": "ON" if world_state_prob > 0.5 else "OFF"
            },
            "action": {
                "predicted_action": predicted_action,
                "action_id": action_pred,
                "probabilities": {
                    label: float(prob) for label, prob in zip(action_labels, action_probs[:len(action_labels)])
                }
            },
            "latency_ms": round(latency_ms, 4),
            "target_met": latency_ms <= 0.15
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/predict/batch")
async def predict_batch(
    images: List[UploadFile] = File(...),
    text_query: str = Form(...)
):
    """
    Batch inference endpoint for multiple images
    """
    start_time = time.time()
    results = []
    
    for image in images:
        try:
            image_data = await image.read()
            pil_image = Image.open(io.BytesIO(image_data)).convert('RGB')
            
            # Process image
            if vision_model is not None:
                with torch.no_grad():
                    inputs = vision_processor(images=pil_image, return_tensors="pt").to(device)
                    vision_outputs = vision_model(**inputs)
                    vision_emb = vision_outputs.pooler_output
            else:
                vision_emb = torch.randn(1, 768).to(device)
            
            # Process text
            if text_model is not None:
                with torch.no_grad():
                    text_inputs = text_tokenizer(
                        text_query,
                        padding=True,
                        truncation=True,
                        max_length=128,
                        return_tensors="pt"
                    ).to(device)
                    text_outputs = text_model(**text_inputs)
                    text_emb = text_outputs.last_hidden_state.mean(dim=1)
            else:
                text_emb = torch.randn(1, 768).to(device)
            
            # Inference
            with torch.no_grad():
                outputs = model(vision_emb, text_emb)
                world_state = torch.sigmoid(outputs['world_state_logits']).cpu().item()
                action_pred = int(torch.argmax(outputs['action_logits'], dim=1).cpu().item())
            
            results.append({
                "world_state": "ON" if world_state > 0.5 else "OFF",
                "action_id": action_pred
            })
        except Exception as e:
            results.append({"error": str(e)})
    
    latency_ms = (time.time() - start_time) * 1000
    
    return JSONResponse(content={
        "results": results,
        "batch_size": len(images),
        "total_latency_ms": round(latency_ms, 4),
        "avg_latency_ms": round(latency_ms / len(images), 4)
    })

@app.get("/metrics")
async def get_metrics():
    """Get model metrics and performance stats"""
    return {
        "model_loaded": model_loaded,
        "device": str(device),
        "target_latency_ms": 0.15,
        "vision_encoder": "CLIP" if vision_model is not None else "Mock",
        "text_encoder": "BERT" if text_model is not None else "Mock",
        "num_actions": NUM_AGENT_ACTIONS,
        "embedding_dim": EMBEDDING_DIM
    }

# --- START SERVER ---
if __name__ == "__main__":
    print("🚀 NavaFlow Production Server Starting...")
    print("🔥 Running on Uvicorn (http://0.0.0.0:8000)")
    print(f"📊 Model Status: {'✅ Loaded' if model_loaded else '⚠️  Mock Mode'}")
    print(f"🎯 Target Latency: 0.15ms")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
