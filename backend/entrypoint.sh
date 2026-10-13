#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo " Starting Jenkins Control Center Backend "
echo "=========================================="

# Wait for PostgreSQL to be ready
echo "Waiting for database connection..."
python -c "
import time, sys, os
from sqlalchemy import create_engine, text

url = os.environ.get('DATABASE_URL', '')
for i in range(30):
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        print('Database is ready!')
        sys.exit(0)
    except Exception as e:
        time.sleep(1)
print('Database connection timed out.')
sys.exit(1)
"

# Run Alembic migrations
echo "Applying database migrations..."
alembic upgrade head

echo "Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
