#!/bin/bash
# ==============================================================================
# VISION AI — Unified Launcher Script
# Starts both FastAPI Backend (port 8000) and Vite Frontend (port 5173)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "======================================================================"
echo "          VISION AI — DEEP LEARNING RESTORATION PLATFORM"
echo "======================================================================"

# 1. Kill any existing processes on ports 8000 and 5173
echo "[1/3] Checking ports 8000 & 5173..."
PID_BACKEND=$(lsof -ti :8000)
if [ -n "$PID_BACKEND" ]; then
    echo "      Stopping stale backend process (PID $PID_BACKEND)..."
    kill -9 $PID_BACKEND 2>/dev/null
fi

PID_FRONTEND=$(lsof -ti :5173)
if [ -n "$PID_FRONTEND" ]; then
    echo "      Stopping stale frontend process (PID $PID_FRONTEND)..."
    kill -9 $PID_FRONTEND 2>/dev/null
fi

# 2. Start FastAPI Backend Server
echo "[2/3] Starting FastAPI backend on http://0.0.0.0:8000..."
"$PROJECT_DIR/.venv/bin/uvicorn" backend.main:app --host 0.0.0.0 --port 8000 > /tmp/vision_ai_backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be online
for i in {1..15}; do
    if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
        echo "      ✓ Backend API is ONLINE (PID: $BACKEND_PID)"
        break
    fi
    sleep 0.5
done

# 3. Start Vite Frontend Server
echo "[3/3] Starting Vite frontend on http://localhost:5173..."
(cd "$PROJECT_DIR/frontend" && npx vite --host :: --port 5173 > /tmp/vision_ai_frontend.log 2>&1) &
FRONTEND_PID=$!

sleep 1.5
echo "      ✓ Frontend is ONLINE (PID: $FRONTEND_PID)"

echo "======================================================================"
echo "  VISION AI is now active and ready:"
echo "  ➜ Web Application:      http://localhost:5173/"
echo "  ➜ Backend API:          http://localhost:8000/"
echo "  ➜ Swagger API Docs:     http://localhost:8000/docs"
echo "======================================================================"
echo "  Logs: /tmp/vision_ai_backend.log  |  /tmp/vision_ai_frontend.log"
echo "  To stop servers, run: kill $BACKEND_PID $FRONTEND_PID"
echo "======================================================================"

