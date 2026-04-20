#!/bin/bash
# grok-agent/scripts/start-gateway.sh

# Start the Grok Agent local gateway

# Ensure gateway directory exists
cd "$(dirname "$0")"/.. || exit 1

# Start the gateway server in background
node gateway/server.js > gateway.log 2>&1 &

# Save PID
echo $! > gateway.pid

# Wait a moment for server to start
sleep 2

# Check if server is running
if curl -s http://127.0.0.1:3002/v1/grok-completions >/dev/null 2>&1; then
    echo "✅ Grok Agent Gateway started successfully on http://127.0.0.1:3002/v1/grok-completions"
else
    echo "❌ Failed to start Grok Agent Gateway. Check gateway.log for details."
    exit 1
fi