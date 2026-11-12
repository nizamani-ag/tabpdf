#!/usr/bin/env bash
# Runs the end-to-end browser test against a headless Chrome.
#
# Usage:
#   ./tests/run_e2e.sh
#
# The app server is started automatically when nothing is listening on the
# app URL. The synthetic fixture PDF and all test output stay in gitignored
# directories; no real documents are required.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

APP_URL="${APP_URL:-http://127.0.0.1:8765/}"
CDP_PORT="${CDP_PORT:-9333}"
CHROME="${CHROME:-google-chrome}"

WEB_PID=""
CHROME_PID=""
PROFILE_DIR="$(mktemp -d)"

cleanup() {
  if [[ -n "$CHROME_PID" ]]; then
    kill "$CHROME_PID" 2>/dev/null || true
    wait "$CHROME_PID" 2>/dev/null || true
  fi
  if [[ -n "$WEB_PID" ]]; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  rm -rf "$PROFILE_DIR" 2>/dev/null || true
}
trap cleanup EXIT

if ! curl -sf "$APP_URL" >/dev/null 2>&1; then
  echo "Starting local app server..."
  ./run_web.py --no-browser >/tmp/tabpdf-web.log 2>&1 &
  WEB_PID=$!
  for _ in $(seq 1 80); do
    curl -sf "$APP_URL" >/dev/null 2>&1 && break
    sleep 0.25
  done
fi

if ! curl -sf "$APP_URL" >/dev/null 2>&1; then
  echo "App server did not start; see /tmp/tabpdf-web.log" >&2
  exit 1
fi

echo "Starting headless Chrome..."
"$CHROME" \
  --headless=new \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --disable-extensions \
  --no-first-run \
  --remote-debugging-port="$CDP_PORT" \
  --user-data-dir="$PROFILE_DIR" \
  about:blank >/tmp/tabpdf-chrome.log 2>&1 &
CHROME_PID=$!

for _ in $(seq 1 80); do
  curl -sf "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1 && break
  sleep 0.25
done

if ! curl -sf "http://127.0.0.1:$CDP_PORT/json/version" >/dev/null 2>&1; then
  echo "Headless Chrome did not start; see /tmp/tabpdf-chrome.log" >&2
  exit 1
fi

APP_URL="$APP_URL" CDP_URL="http://127.0.0.1:$CDP_PORT" node tests/e2e.mjs
