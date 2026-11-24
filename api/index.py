"""
Vercel Serverless Function entrypoint for GBU Inventory FastAPI Backend
"""
import sys
import os

# Ensure backend root is on Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
