#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Starting Jenkins Control Center Backend "
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for database connection..."
python -c "
import time, sys, psycopg
for i in range(30):
    try:
        conn = psycopg.connect('$DATABASE_URL')
        conn.close()
        print('Database is ready!')
        sys.exit(0)
    except Exception as e:
        time.sleep(1)
sys.exit(1)
"

# Run Alembic migrations
echo "Applying database migrations..."
alembic upgrade head

echo "Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
