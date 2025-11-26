#!/bin/bash

# 50-DOMAIN BATCH MODE with TIMEOUT PROTECTION
# Iparági standard: Max wait time per batch
# - Worker timeout: 180s (3 min) per scan
# - Batch timeout: 300s (5 min) per batch
# - Ha batch 5 perc után nem kész, továbblép (stragglers eldobása)

DOMAIN_FILE="/home/aiq/Asztal/10_M_USD/ai-security-scanner/domains.txt"
API_URL="http://localhost:3000/api/scan"
BATCH_SIZE=50
MAX_DOMAINS=1000
MAX_BATCH_WAIT=300  # 5 perc maximum batch várakozás (300 seconds)

echo "=========================================="
echo "⏱️  50-DOMAIN BATCH MODE + TIMEOUT"
echo "=========================================="
echo ""
echo "📦 Batch size: $BATCH_SIZE domains"
echo "👷 Workers: 50 PM2 instances"
echo "⏱️  API delay: 50ms (balanced)"
echo "🎯 Target: $MAX_DOMAINS domains"
echo "⏱️  Worker timeout: 180s (3 min) per scan"
echo "⏱️  Batch timeout: ${MAX_BATCH_WAIT}s (5 min) per batch"
echo ""

# Extract first 1000 domains
TEMP_FILE="/tmp/batch-50-timeout-1000-domains.txt"
head -1000 "$DOMAIN_FILE" > "$TEMP_FILE"

TOTAL=$(wc -l < "$TEMP_FILE")
TOTAL_BATCHES=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Total domains: $TOTAL"
echo "Total batches: $TOTAL_BATCHES (x$BATCH_SIZE domains)"
echo ""

ALL_SCAN_IDS=()
TOTAL_TIMEOUTS=0
START_TIME=$(date +%s)
BATCH_NUM=0
BATCH_DOMAINS=()

# Process in batches
while IFS= read -r domain; do
  [[ -z "$domain" ]] && continue

  BATCH_DOMAINS+=("$domain")

  if [[ ${#BATCH_DOMAINS[@]} -eq $BATCH_SIZE ]]; then
    BATCH_NUM=$((BATCH_NUM + 1))
    BATCH_START=$(date +%s)

    echo "=========================================="
    echo "📦 BATCH $BATCH_NUM/$TOTAL_BATCHES"
    echo "=========================================="

    # Create all scans in batch
    BATCH_SCAN_IDS=()
    for domain in "${BATCH_DOMAINS[@]}"; do
      if [[ ! "$domain" =~ ^https?:// ]]; then
        URL="https://$domain"
      else
        URL="$domain"
      fi

      RESPONSE=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\"}" 2>&1)

      SCAN_ID=$(echo "$RESPONSE" | jq -r '.scanId' 2>/dev/null)

      if [[ "$SCAN_ID" != "null" && -n "$SCAN_ID" ]]; then
        BATCH_SCAN_IDS+=("$SCAN_ID")
        ALL_SCAN_IDS+=("$SCAN_ID")
      fi

      sleep 0.05
    done

    echo "✅ Batch $BATCH_NUM created: ${#BATCH_SCAN_IDS[@]}/$BATCH_SIZE scans"
    echo "⏳ Waiting for completion (max ${MAX_BATCH_WAIT}s)..."

    # Wait for batch completion with timeout
    BATCH_COMPLETED=0
    BATCH_FAILED=0
    BATCH_TIMEOUT=0

    while [ $BATCH_COMPLETED -lt ${#BATCH_SCAN_IDS[@]} ]; do
      sleep 2

      # Check batch elapsed time
      BATCH_ELAPSED=$(($(date +%s) - BATCH_START))
      
      if [ $BATCH_ELAPSED -ge $MAX_BATCH_WAIT ]; then
        echo ""
        echo "⏱️  BATCH TIMEOUT reached (${MAX_BATCH_WAIT}s)"
        
        # Count stragglers (still scanning)
        STRAGGLERS=0
        for SCAN_ID in "${BATCH_SCAN_IDS[@]}"; do
          STATUS=$(curl -s "http://localhost:3000/api/scan/$SCAN_ID" | jq -r '.status' 2>/dev/null)
          if [[ "$STATUS" == "SCANNING" ]]; then
            STRAGGLERS=$((STRAGGLERS + 1))
          fi
        done
        
        BATCH_TIMEOUT=$STRAGGLERS
        TOTAL_TIMEOUTS=$((TOTAL_TIMEOUTS + STRAGGLERS))
        
        echo "⏭️  Moving to next batch ($STRAGGLERS stragglers left behind)"
        echo ""
        break
      fi

      # Count completed/failed
      BATCH_COMPLETED=0
      BATCH_FAILED=0

      for SCAN_ID in "${BATCH_SCAN_IDS[@]}"; do
        STATUS=$(curl -s "http://localhost:3000/api/scan/$SCAN_ID" | jq -r '.status' 2>/dev/null)

        case "$STATUS" in
          "COMPLETED")
            BATCH_COMPLETED=$((BATCH_COMPLETED + 1))
            ;;
          "FAILED")
            BATCH_FAILED=$((BATCH_FAILED + 1))
            ;;
        esac
      done

      BATCH_DONE=$((BATCH_COMPLETED + BATCH_FAILED))
      BATCH_PROGRESS=$((BATCH_DONE * 100 / ${#BATCH_SCAN_IDS[@]}))

      echo -ne "\r⏱️  ${BATCH_ELAPSED}s | Progress: $BATCH_PROGRESS% | ✅ $BATCH_COMPLETED | ❌ $BATCH_FAILED | ⏳ $((${#BATCH_SCAN_IDS[@]} - BATCH_DONE))     "
    done

    echo ""
    if [ $BATCH_TIMEOUT -gt 0 ]; then
      echo "⏱️  Batch $BATCH_NUM timed out: $BATCH_COMPLETED succeeded, $BATCH_FAILED failed, $BATCH_TIMEOUT timeout"
    else
      echo "✅ Batch $BATCH_NUM complete: $BATCH_COMPLETED succeeded, $BATCH_FAILED failed (${BATCH_ELAPSED}s)"
    fi
    echo ""

    BATCH_DOMAINS=()
  fi
done < "$TEMP_FILE"

# Process remaining domains (final batch)
if [[ ${#BATCH_DOMAINS[@]} -gt 0 ]]; then
  BATCH_NUM=$((BATCH_NUM + 1))
  BATCH_START=$(date +%s)

  echo "=========================================="
  echo "📦 BATCH $BATCH_NUM/$TOTAL_BATCHES (Final)"
  echo "=========================================="

  BATCH_SCAN_IDS=()
  for domain in "${BATCH_DOMAINS[@]}"; do
    if [[ ! "$domain" =~ ^https?:// ]]; then
      URL="https://$domain"
    else
      URL="$domain"
    fi

    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"url\":\"$URL\"}" 2>&1)

    SCAN_ID=$(echo "$RESPONSE" | jq -r '.scanId' 2>/dev/null)

    if [[ "$SCAN_ID" != "null" && -n "$SCAN_ID" ]]; then
      BATCH_SCAN_IDS+=("$SCAN_ID")
      ALL_SCAN_IDS+=("$SCAN_ID")
    fi

    sleep 0.05
  done

  echo "✅ Final batch created: ${#BATCH_SCAN_IDS[@]}/${#BATCH_DOMAINS[@]} scans"
  echo "⏳ Waiting for completion (max ${MAX_BATCH_WAIT}s)..."

  BATCH_COMPLETED=0
  BATCH_FAILED=0
  BATCH_TIMEOUT=0

  while [ $BATCH_COMPLETED -lt ${#BATCH_SCAN_IDS[@]} ]; do
    sleep 2

    BATCH_ELAPSED=$(($(date +%s) - BATCH_START))
    
    if [ $BATCH_ELAPSED -ge $MAX_BATCH_WAIT ]; then
      echo ""
      echo "⏱️  BATCH TIMEOUT reached (${MAX_BATCH_WAIT}s)"
      
      STRAGGLERS=0
      for SCAN_ID in "${BATCH_SCAN_IDS[@]}"; do
        STATUS=$(curl -s "http://localhost:3000/api/scan/$SCAN_ID" | jq -r '.status' 2>/dev/null)
        if [[ "$STATUS" == "SCANNING" ]]; then
          STRAGGLERS=$((STRAGGLERS + 1))
        fi
      done
      
      BATCH_TIMEOUT=$STRAGGLERS
      TOTAL_TIMEOUTS=$((TOTAL_TIMEOUTS + STRAGGLERS))
      
      echo "⏭️  Final batch timeout ($STRAGGLERS stragglers left behind)"
      echo ""
      break
    fi

    BATCH_COMPLETED=0
    BATCH_FAILED=0

    for SCAN_ID in "${BATCH_SCAN_IDS[@]}"; do
      STATUS=$(curl -s "http://localhost:3000/api/scan/$SCAN_ID" | jq -r '.status' 2>/dev/null)

      case "$STATUS" in
        "COMPLETED")
          BATCH_COMPLETED=$((BATCH_COMPLETED + 1))
          ;;
        "FAILED")
          BATCH_FAILED=$((BATCH_FAILED + 1))
          ;;
      esac
    done

    BATCH_DONE=$((BATCH_COMPLETED + BATCH_FAILED))
    BATCH_PROGRESS=$((BATCH_DONE * 100 / ${#BATCH_SCAN_IDS[@]}))

    echo -ne "\r⏱️  ${BATCH_ELAPSED}s | Progress: $BATCH_PROGRESS% | ✅ $BATCH_COMPLETED | ❌ $BATCH_FAILED | ⏳ $((${#BATCH_SCAN_IDS[@]} - BATCH_DONE))     "
  done

  echo ""
  if [ $BATCH_TIMEOUT -gt 0 ]; then
    echo "⏱️  Final batch timed out: $BATCH_COMPLETED succeeded, $BATCH_FAILED failed, $BATCH_TIMEOUT timeout"
  else
    echo "✅ Final batch complete: $BATCH_COMPLETED succeeded, $BATCH_FAILED failed (${BATCH_ELAPSED}s)"
  fi
  echo ""
fi

# Final summary
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
TOTAL_MIN=$((TOTAL_TIME / 60))
TOTAL_SEC=$((TOTAL_TIME % 60))

echo "=========================================="
echo "🏁 50-DOMAIN BATCH (TIMEOUT) COMPLETE"
echo "=========================================="
echo ""

# Final count from database
TOTAL_COMPLETED=0
TOTAL_FAILED=0
TOTAL_SCANNING=0

for SCAN_ID in "${ALL_SCAN_IDS[@]}"; do
  STATUS=$(curl -s "http://localhost:3000/api/scan/$SCAN_ID" | jq -r '.status' 2>/dev/null)

  case "$STATUS" in
    "COMPLETED")
      TOTAL_COMPLETED=$((TOTAL_COMPLETED + 1))
      ;;
    "FAILED")
      TOTAL_FAILED=$((TOTAL_FAILED + 1))
      ;;
    "SCANNING")
      TOTAL_SCANNING=$((TOTAL_SCANNING + 1))
      ;;
  esac
done

echo "✅ Completed: $TOTAL_COMPLETED"
echo "❌ Failed: $TOTAL_FAILED"
echo "⏳ Still scanning: $TOTAL_SCANNING (stragglers)"
echo "⏱️  Batch timeouts: $TOTAL_TIMEOUTS domains left behind"
echo "📊 Success rate: $(( TOTAL_COMPLETED * 100 / ${#ALL_SCAN_IDS[@]} ))%"
echo "⏱️  Total time: ${TOTAL_MIN}m ${TOTAL_SEC}s"
echo "📈 Average: $((TOTAL_TIME / ${#ALL_SCAN_IDS[@]}))s per scan"
echo "⚡ Speed: $((${#ALL_SCAN_IDS[@]} * 60 / TOTAL_TIME)) scans/minute"
echo ""

SCAN_FILE="/tmp/batch-50-timeout-1000-scan-ids.txt"
printf "%s\n" "${ALL_SCAN_IDS[@]}" > "$SCAN_FILE"
echo "📄 Scan IDs saved to: $SCAN_FILE"
echo ""
echo "=========================================="
