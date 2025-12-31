"""
Model Quantization for NavaFlow-VL-JEPA

Optimize the model for production deployment to achieve 0.15ms latency goal.
Uses Post-Training Quantization (PTQ) to convert FP32 to INT8.
"""

import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional

# Model configuration
VISION_DIM = 768
TEXT_DIM = 2048
EMBEDDING_DIM = 1536
NUM_AGENT_ACTIONS = 5

def quantize_model(
    checkpoint_path: str = "navajepa_sota.pth",
    output_path: str = "navajepa_int8_quantized.pth",
    calibration_samples: int = 100
):
    """
    Quantize NavaFlow-VL-JEPA model to INT8 for production deployment.
    
    Args:
        checkpoint_path: Path to trained model checkpoint
        output_path: Path to save quantized model
        calibration_samples: Number of samples for calibration
    """
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🔍 Starting Dynamic Quantization on {device}...")
    
    # Load model (simplified - in production, import from model module)
    try:
        from model import NavaFlowVLJEPA
        model = NavaFlowVLJEPA(device)
        
        if Path(checkpoint_path).exists():
            checkpoint = torch.load(checkpoint_path, map_location=device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                model.load_state_dict(checkpoint['model_state_dict'])
            else:
                model.load_state_dict(checkpoint)
            print(f"✅ Loaded model from {checkpoint_path}")
        else:
            print(f"⚠️  Checkpoint not found: {checkpoint_path}")
            print("   Using untrained model for quantization demo")
    except ImportError:
        print("⚠️  Model module not found. Using mock model for demo.")
        # Create mock model structure
        class MockModel(nn.Module):
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
        model = MockModel().to(device)
    
    model.eval()
    model.float()  # Ensure FP32 for quantization
    
    # --- DYNAMIC QUANTIZATION (PTQ) ---
    # PyTorch's built-in quantization
    print("📊 Applying Dynamic Quantization...")
    
    # Quantize the predictor (main compute)
    if hasattr(model, 'predictor'):
        # Quantize predictor layers
        model.predictor = torch.quantization.quantize_dynamic(
            model.predictor,
            {nn.Linear},  # Quantize Linear layers
            dtype=torch.qint8
        )
        print("✅ Predictor quantized")
    
    # Quantize world head
    if hasattr(model, 'world_head'):
        model.world_head = torch.quantization.quantize_dynamic(
            model.world_head,
            {nn.Linear},
            dtype=torch.qint8
        )
        print("✅ World head quantized")
    
    # Quantize agent head
    if hasattr(model, 'agent_head'):
        model.agent_head = torch.quantization.quantize_dynamic(
            model.agent_head,
            {nn.Linear},
            dtype=torch.qint8
        )
        print("✅ Agent head quantized")
    
    # --- SAVE QUANTIZED MODEL ---
    torch.save({
        'model_state_dict': model.state_dict(),
        'quantized': True,
        'dtype': 'int8',
        'config': {
            'VISION_DIM': VISION_DIM,
            'TEXT_DIM': TEXT_DIM,
            'EMBEDDING_DIM': EMBEDDING_DIM,
            'NUM_AGENT_ACTIONS': NUM_AGENT_ACTIONS
        }
    }, output_path)
    
    print(f"✅ Quantization Complete!")
    print(f"📦 Model saved as '{output_path}'")
    
    # --- BENCHMARK QUANTIZED MODEL ---
    print("\\n📊 Benchmarking quantized model...")
    model.eval()
    
    dummy_vision = torch.randn(1, 768).to(device)
    dummy_text = torch.randn(1, 768).to(device)
    
    # Warmup
    with torch.no_grad():
        for _ in range(10):
            if hasattr(model, 'forward'):
                _ = model(dummy_vision, dummy_text)
            else:
                _ = model.predictor(torch.cat([dummy_vision, dummy_text], dim=-1))
    
    # Benchmark
    import time
    times = []
    with torch.no_grad():
        for _ in range(100):
            start = time.time()
            if hasattr(model, 'forward'):
                _ = model(dummy_vision, dummy_text)
            else:
                _ = model.predictor(torch.cat([dummy_vision, dummy_text], dim=-1))
            if device == "cuda":
                torch.cuda.synchronize()
            times.append((time.time() - start) * 1000)
    
    avg_latency = sum(times) / len(times)
    print(f"   Average Latency: {avg_latency:.4f} ms")
    print(f"   Target: 0.15 ms")
    print(f"   Status: {'✅ MET' if avg_latency <= 0.15 else '⚠️  OPTIMIZATION NEEDED'}")
    
    return model

if __name__ == "__main__":
    print("=" * 60)
    print("NavaFlow-VL-JEPA Model Quantization")
    print("=" * 60)
    
    quantize_model()
    
    print("\\n" + "=" * 60)
    print("✅ Quantization process complete!")
    print("=" * 60)
