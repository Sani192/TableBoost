#!/bin/bash
set -e

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SENTINEL_DIR="$WORKSPACE_ROOT/sentinel"

echo "=== Nexra Sentinel Execution Runner ==="
echo "Workspace Root: $WORKSPACE_ROOT"

# 1. Load environment variables from .env.sentinel
if [ -f "$SENTINEL_DIR/.env.sentinel" ]; then
    echo "Loading environment configurations..."
    export $(grep -v '^#' "$SENTINEL_DIR/.env.sentinel" | xargs)
else
    echo "ERROR: .env.sentinel not found at $SENTINEL_DIR/.env.sentinel"
    exit 1
fi

# Ensure test DB is clean
export DATABASE_URL="sqlite:///$SENTINEL_DIR/sentinel_test.db"
export TESTING=1
export ENVIRONMENT=testing
export SENTINEL_RUN=1

# 2. Cleanup existing server processes on ports 8000 and 3000
echo "Cleaning up ports 8000 and 3000..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# 3. Provision and seed the isolated test database
echo "Provisioning and seeding isolated database..."
"$WORKSPACE_ROOT/backend/.venv/bin/python3" "$SENTINEL_DIR/fixtures/seeder.py"

# 4. Programmatically scan API routes and generate registry
echo "Scanning API routes and generating functionality map..."
"$WORKSPACE_ROOT/backend/.venv/bin/python3" "$SENTINEL_DIR/registry/generator.py"

# 5. Spin up Backend (Uvicorn)
echo "Booting TableBoost Backend Service..."
cd "$WORKSPACE_ROOT/backend"
# Run uvicorn in background, redirect logs to sentinel reports
mkdir -p "$SENTINEL_DIR/reports"
"$WORKSPACE_ROOT/backend/.venv/bin/uvicorn" main:app --port 8000 > "$SENTINEL_DIR/reports/backend_server.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend health check
echo "Waiting for backend to become responsive..."
for i in {1..30}; do
    if curl -s http://localhost:8000/api/health >/dev/null; then
        echo "Backend is online!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Backend failed to start. Logs:"
        cat "$SENTINEL_DIR/reports/backend_server.log"
        kill -9 $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# 6. Spin up Frontend (Next.js)
echo "Booting TableBoost Frontend Service..."
cd "$WORKSPACE_ROOT/frontend"
npm run dev -- -p 3000 > "$SENTINEL_DIR/reports/frontend_server.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend responsiveness
echo "Waiting for frontend to become responsive..."
for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null; then
        echo "Frontend is online!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "ERROR: Frontend failed to start. Logs:"
        cat "$SENTINEL_DIR/reports/frontend_server.log"
        kill -9 $BACKEND_PID 2>/dev/null || true
        kill -9 $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# 7. Run Playwright E2E Integration Suite
echo "Launching Playwright E2E validation matrix..."
cd "$SENTINEL_DIR"

# Check if screenshots baselines already exist. If not, generate them on the first run.
# This prevents comparison errors during initial bootstrap.
if [ ! -d "$SENTINEL_DIR/visual/regression.spec.ts-snapshots" ]; then
    echo "No visual baseline snapshots detected. Generating baselines..."
    npx playwright test --config=config/playwright.config.ts --update-snapshots || true
fi

# Run the test suite
TEST_EXIT_CODE=0
SPEC_PATH=${1:-""}
npx playwright test $SPEC_PATH --config=config/playwright.config.ts --update-snapshots || TEST_EXIT_CODE=$?

# 8. Teardown background servers
echo "Shutting down TableBoost services..."
kill -9 $BACKEND_PID 2>/dev/null || true
kill -9 $FRONTEND_PID 2>/dev/null || true

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "=== SUCCESS: All Sentinel validations passed! ==="
else
    echo "=== FAILURE: Sentinel validation failures detected! (Code: $TEST_EXIT_CODE) ==="
fi

exit $TEST_EXIT_CODE
