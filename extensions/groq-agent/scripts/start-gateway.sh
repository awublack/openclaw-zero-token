#!/bin/bash
# groq-agent/scripts/start-gateway.sh

# Start the Groq Agent local gateway

# Ensure gateway directory exists
cd "$(dirname "$0")"/.. || exit 1

# Start the gateway server in background
node gateway/server.js > gateway.log 2>&1 &

# Save PID
echo $! > gateway.pid

# Wait a moment for server to start
sleep 2

# Check if server is running
if curl -s http://127.0.0.1:3002/v1/groq-completions >/dev/null 2>&1; then
    echo "✅ Groq Agent Gateway started successfully on http://127.0.0.1:3002/v1/groq-completions"
else
    echo "❌ Failed to start Groq Agent Gateway. Check gateway.log for details."
    exit 1
fi