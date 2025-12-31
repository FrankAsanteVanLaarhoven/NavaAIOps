# Dockerfile for NavaFlow-VL-JEPA Inference Server
# Production-grade container for scalable deployment

# Use Python 3.10 slim for smaller image size
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    build-essential \\
    libgl1-mesa-glx \\
    libglib2.0-0 \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY quantize.py .

# Copy model checkpoint (if available)
# In production, you might want to download this from S3/GCS
COPY navajepa_sota.pth* . || true
COPY navajepa_int8_quantized.pth* . || true

# Create non-root user (Security Best Practice)
RUN useradd -m -u 1000 appuser && \\
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port 8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Command to run the server
# Use uvicorn with multiple workers for production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
