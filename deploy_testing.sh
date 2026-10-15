#!/usr/bin/env bash
# ==============================================================================
# Jenkins Control Center - Quick Testing Environment Deployer
# ==============================================================================
# Deploys the testing stack on dedicated ports (Frontend: 3001, Backend: 8001)
# side-by-side with the main production stack.
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}====================================================================${NC}"
echo -e "${CYAN}  Setting up Jenkins Control Center [Testing Environment Stack]      ${NC}"
echo -e "${CYAN}====================================================================${NC}"

if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env found. Initializing .env from .env.testing.example...${NC}"
    cp .env.testing.example .env

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

    echo -e "${GREEN}✓ Created testing .env with separate ports (3001, 8001, 5433, 6380) and randomized secrets.${NC}"
fi

# Run the standard deployment script
chmod +x ./deploy_ubuntu.sh ./test_ubuntu.sh 2>/dev/null || true
./deploy_ubuntu.sh
