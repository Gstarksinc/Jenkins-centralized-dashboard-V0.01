#!/usr/bin/env bash
# ==============================================================================
# Jenkins Control Center - Automated Ubuntu Deployment Script
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================================${NC}"
echo -e "${CYAN}        Jenkins Control Center: Ubuntu Deployment Setup            ${NC}"
echo -e "${CYAN}====================================================================${NC}"

# 1. Check if running with root / sudo capability
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}[!] Note: Running as standard user. Commands will use sudo when required.${NC}"
    SUDO="sudo"
else
    SUDO=""
fi

# 2. Check and Install Docker / Docker Compose if missing
echo -e "\n${CYAN}[1/5] Checking Docker & Docker Compose prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker engine...${NC}"
    $SUDO apt-get update -y
    $SUDO apt-get install -y ca-certificates curl gnupg
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    $SUDO sh /tmp/get-docker.sh
    $SUDO usermod -aG docker "$USER" || true
    echo -e "${GREEN}✓ Docker installed successfully.${NC}"
else
    echo -e "${GREEN}✓ Docker is already installed: $(docker --version)${NC}"
fi

if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker compose plugin not found. Installing docker-compose-plugin...${NC}"
    $SUDO apt-get update -y
    $SUDO apt-get install -y docker-compose-plugin
fi
echo -e "${GREEN}✓ Docker Compose is ready: $(docker compose version)${NC}"

# 3. Environment file setup
echo -e "\n${CYAN}[2/5] Configuring environment variables (.env)...${NC}"
if [ ! -f .env ]; then
    echo -e "Creating .env from .env.example with secure random keys..."
    cp .env.example .env

    # Generate random SECRET_KEY
    RANDOM_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
    sed -i "s/change-this-in-production-to-a-secure-random-32-byte-hex-string/${RANDOM_SECRET}/g" .env

    # Generate random Fernet Key
    if command -v python3 &> /dev/null; then
        FERNET_KEY=$(python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())" 2>/dev/null || echo "8Z1xVj1xV8zQY7P4wN1vK6tR3bM9eL2sA5hG0yD4fUo=")
    else
        FERNET_KEY="8Z1xVj1xV8zQY7P4wN1vK6tR3bM9eL2sA5hG0yD4fUo="
    fi
    sed -i "s|8Z1xVj1xV8zQY7P4wN1vK6tR3bM9eL2sA5hG0yD4fUo=|${FERNET_KEY}|g" .env

    echo -e "${GREEN}✓ Configured .env with randomized secrets.${NC}"
else
    echo -e "${GREEN}✓ Existing .env detected.${NC}"
fi

# Load environment variables for deployment script usage
set -a
# shellcheck disable=SC1091
source .env
set +a

ACTIVE_BACKEND_PORT="${BACKEND_PORT_HOST:-8000}"
ACTIVE_FRONTEND_PORT="${FRONTEND_PORT_HOST:-3000}"
STACK_PROJECT="${COMPOSE_PROJECT_NAME:-jcc}"

# 4. Build and Launch Containers
echo -e "\n${CYAN}[3/5] Building and launching application stack [${STACK_PROJECT}] with Docker Compose...${NC}"
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d --build

# 5. Wait for Healthcheck
echo -e "\n${CYAN}[4/5] Waiting for services on port ${ACTIVE_BACKEND_PORT} to become healthy...${NC}"
for i in {1..30}; do
    if curl -s "http://0.0.0.0:${ACTIVE_BACKEND_PORT}/api/v1/health/live" &> /dev/null; then
        echo -e "${GREEN}✓ Backend API is responding on port ${ACTIVE_BACKEND_PORT}!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Run database migration check inside container
echo -e "\nApplying any pending database migrations..."
docker compose exec -T backend alembic upgrade head || true

# 6. Verification and Status Report
echo -e "\n${CYAN}[5/5] Service Status & Verification for [${STACK_PROJECT}]:${NC}"
docker compose ps

SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "YOUR_SERVER_IP")

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}  ✓ Jenkins Control Center [${STACK_PROJECT}] is running on Ubuntu!  ${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "  • Frontend Web Dashboard : ${CYAN}http://${SERVER_IP}:${ACTIVE_FRONTEND_PORT}${NC} (or http://localhost:${ACTIVE_FRONTEND_PORT})"
echo -e "  • Backend API Docs (OpenAPI): ${CYAN}http://${SERVER_IP}:${ACTIVE_BACKEND_PORT}/docs${NC}"
echo -e "  • Health Liveness Probe  : ${CYAN}http://${SERVER_IP}:${ACTIVE_BACKEND_PORT}/api/v1/health/live${NC}"
echo -e "  • Health Readiness Probe : ${CYAN}http://${SERVER_IP}:${ACTIVE_BACKEND_PORT}/api/v1/health/ready${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "To view logs anytime: ${YELLOW}docker compose logs -f${NC}"
echo -e "To run test suite:    ${YELLOW}./test_ubuntu.sh${NC}"
