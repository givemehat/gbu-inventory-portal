#!/usr/bin/env bash
# ============================================================
# Gautam Buddha University (GBU) Inventory Management Portal
# 1-Click Zero-Config Local / Cloud Demo Launcher
# ============================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "============================================================"
echo " Starting GBU Stores & Purchase Inventory Portal "
echo "============================================================"

# Ensure ports are clean
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 1. Setup & Launch Backend
echo "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ..."
cd "$DIR/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
.venv/bin/python -m app.seed --reset > /dev/null 2>&1 || true
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# 2. Setup & Launch Frontend
echo "[2/2] Launching React Vite Frontend on http://127.0.0.1:5173 ..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install
fi
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "============================================================"
echo " Portal is LIVE and Ready for Evaluation! "
echo " Frontend URL: http://127.0.0.1:5173 "
echo " Backend Docs: http://127.0.0.1:8000/docs "
echo " Demo Logins:  store@gbu.demo / demo123 "
echo "============================================================"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT TERM
wait
