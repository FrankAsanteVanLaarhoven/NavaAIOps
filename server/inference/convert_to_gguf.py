"""
Model Conversion: PyTorch (.pth) to GGUF

Converts NavaFlow-VL-JEPA PyTorch models to GGUF format
for optimal performance with Ollama.
"""

import torch
import subprocess
import sys
from pathlib import Path
import argparse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_llama_cpp_available() -> bool:
    """Check if llama.cpp tools are available"""
    try:
        result = subprocess.run(
            ["llama-cpp-convert", "--version"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except:
        return False

def convert_pth_to_gguf(
    input_path: Path,
    output_path: Path,
    quantization: str = "q4_k_m"
) -> bool:
    """
    Convert PyTorch model to GGUF format
    
    Args:
        input_path: Path to .pth file
        output_path: Path to save .gguf file
        quantization: Quantization method (q4_k_m, q8_0, etc.)
    
    Returns:
        True if successful, False otherwise
    """
    if not input_path.exists():
        logger.error(f"Input file not found: {input_path}")
        return False
    
    logger.info(f"Converting {input_path} to {output_path}")
    logger.info(f"Quantization method: {quantization}")
    
    # Method 1: Use llama.cpp convert script (if available)
    if check_llama_cpp_available():
        try:
            cmd = [
                "llama-cpp-convert",
                str(input_path),
                str(output_path),
                "--quantize", quantization
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"✅ Conversion successful using llama-cpp-convert")
                return True
            else:
                logger.warning(f"llama-cpp-convert failed: {result.stderr}")
        except Exception as e:
            logger.warning(f"llama-cpp-convert error: {e}")
    
    # Method 2: Use Ollama's quantize command
    try:
        # First, we need to create a temporary GGUF file
        # Then quantize it
        logger.info("Attempting conversion via Ollama...")
        
        # Note: Ollama's quantize expects a GGUF file
        # So we need to convert PyTorch -> GGUF first, then quantize
        # This is a simplified approach - in production you'd use proper conversion
        
        logger.warning("Direct PyTorch to GGUF conversion requires llama.cpp")
        logger.info("Please install llama.cpp tools:")
        logger.info("  git clone https://github.com/ggerganov/llama.cpp")
        logger.info("  cd llama.cpp && make")
        
        return False
    
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return False

def convert_with_manual_steps(
    input_path: Path,
    output_path: Path,
    quantization: str = "q4_k_m"
):
    """
    Provide manual conversion steps
    """
    logger.info("=" * 60)
    logger.info("Manual Conversion Steps:")
    logger.info("=" * 60)
    logger.info("")
    logger.info("1. Install llama.cpp:")
    logger.info("   git clone https://github.com/ggerganov/llama.cpp")
    logger.info("   cd llama.cpp && make")
    logger.info("")
    logger.info("2. Convert PyTorch to GGUF:")
    logger.info(f"   python convert.py {input_path} --outfile {output_path}")
    logger.info("")
    logger.info("3. Quantize GGUF:")
    logger.info(f"   ./quantize {output_path} {output_path.with_suffix('.q4_k_m.gguf')} {quantization}")
    logger.info("")
    logger.info("4. Use with Ollama:")
    logger.info(f"   ollama create {output_path.stem} -f Modelfile")
    logger.info("=" * 60)

def main():
    parser = argparse.ArgumentParser(
        description="Convert PyTorch models to GGUF format for Ollama"
    )
    parser.add_argument(
        "input",
        type=str,
        help="Path to input .pth file"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Path to output .gguf file (default: input with .gguf extension)"
    )
    parser.add_argument(
        "-q", "--quantization",
        type=str,
        default="q4_k_m",
        choices=["q4_0", "q4_1", "q5_0", "q5_1", "q8_0", "q4_k_m", "q5_k_m"],
        help="Quantization method"
    )
    parser.add_argument(
        "--manual",
        action="store_true",
        help="Show manual conversion steps instead of attempting conversion"
    )
    
    args = parser.parse_args()
    
    input_path = Path(args.input)
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.with_suffix(".gguf")
    
    if not input_path.exists():
        logger.error(f"Input file not found: {input_path}")
        sys.exit(1)
    
    if args.manual:
        convert_with_manual_steps(input_path, output_path, args.quantization)
        return
    
    logger.info("=" * 60)
    logger.info("NavaFlow Model Converter: PyTorch → GGUF")
    logger.info("=" * 60)
    
    success = convert_pth_to_gguf(input_path, output_path, args.quantization)
    
    if success:
        logger.info(f"✅ Conversion complete: {output_path}")
        logger.info(f"📦 File size: {output_path.stat().st_size / (1024**2):.2f} MB")
    else:
        logger.warning("⚠️  Automatic conversion failed")
        logger.info("Showing manual steps...")
        convert_with_manual_steps(input_path, output_path, args.quantization)

if __name__ == "__main__":
    main()
