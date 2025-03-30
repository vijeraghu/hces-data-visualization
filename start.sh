#!/bin/bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port $PORT
