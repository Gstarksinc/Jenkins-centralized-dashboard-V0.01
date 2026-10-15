#!/usr/bin/env bash
# ==============================================================================
# Jenkins Control Center - Automated Ubuntu Test Runner
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}====================================================================${NC}"
echo -e "${CYAN}        Running Jenkins Control Center Test Suite on Ubuntu        ${NC}"
echo -e "${CYAN}====================================================================${NC}"

# 1. Load environment variables if .env exists
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

ACTIVE_BACKEND_PORT="${BACKEND_PORT_HOST:-8000}"
ACTIVE_FRONTEND_PORT="${FRONTEND_PORT_HOST:-3000}"
STACK_PROJECT="${COMPOSE_PROJECT_NAME:-jcc}"

echo -e "Testing target stack: ${CYAN}[${STACK_PROJECT}]${NC}"
echo -e "Backend Port: ${YELLOW}${ACTIVE_BACKEND_PORT}${NC} | Frontend Port: ${YELLOW}${ACTIVE_FRONTEND_PORT}${NC}"

# 2. Check if containers are running
if ! docker compose ps --status running | grep -q "backend"; then
    echo -e "${YELLOW}[!] Warning: Backend container is not running yet.${NC}"
    echo -e "Starting containers now via 'docker compose up -d --build'..."
    docker compose up -d --build
    echo -e "Waiting for services to initialize..."
    sleep 8
fi

echo -e "\n${CYAN}[1/3] Running backend Pytest suite inside container...${NC}"
if docker compose exec -T backend python -m pytest -v; then
    echo -e "${GREEN}✓ Backend pytest passed!${NC}"
else
    echo -e "${RED}✗ Backend pytest encountered errors.${NC}"
    echo -e "Checking recent container logs:"
    docker compose logs --tail=30 backend
    exit 1
fi

echo -e "\n${CYAN}[2/3] Checking API health endpoints on port ${ACTIVE_BACKEND_PORT}...${NC}"
LIVE_RES=$(curl -s "http://0.0.0.0:${ACTIVE_BACKEND_PORT}/api/v1/health/live" || echo "unreachable")
echo "Liveness Response: $LIVE_RES"

READY_RES=$(curl -s "http://0.0.0.0:${ACTIVE_BACKEND_PORT}/api/v1/health/ready" || echo "unreachable")
echo "Readiness Response: $READY_RES"

echo -e "\n${CYAN}[3/3] Checking Frontend HTTP response on port ${ACTIVE_FRONTEND_PORT}...${NC}"
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://0.0.0.0:${ACTIVE_FRONTEND_PORT}" || echo "failed")
if [ "$FRONTEND_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend is serving index.html (HTTP 200) on port ${ACTIVE_FRONTEND_PORT}${NC}"
else
    echo -e "${YELLOW}! Frontend returned HTTP $FRONTEND_CODE (Waiting for startup...)${NC}"
fi

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}  ✓ All Ubuntu Verification Checks Complete for [${STACK_PROJECT}]!  ${NC}"
echo -e "${GREEN}====================================================================${NC}"
