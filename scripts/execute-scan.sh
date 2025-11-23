#!/bin/bash

# Execute a single scan directly
# Usage: ./execute-scan.sh <scan-id>

SCAN_ID=$1

if [ -z "$SCAN_ID" ]; then
    echo "Usage: $0 <scan-id>"
    exit 1
fi

echo "Executing scan: $SCAN_ID"

# Call the API endpoint to trigger scan processing
curl -X POST "http://localhost:3000/api/scan/$SCAN_ID/execute" \
     -H "Content-Type: application/json" \
     -d '{"force": true}'

echo "Done"