#!/bin/bash

# CONSERVATIVE MODE - Lassú, biztonságos, kíméletes otthoni nethez
# 10 domain batchenként, 100ms delay az API hívások között

DOMAIN_FILE="/home/aiq/Asztal/10_M_USD/ai-security-scanner/domains.txt"
API_URL="http://localhost:3000/api/scan"
BATCH_SIZE=10
MAX_DOMAINS=1000

echo "=========================================="
echo "🐢 CONSERVATIVE MODE - 1000 Domains"
echo "=========================================="
echo ""
echo "📦 Batch size: $BATCH_SIZE domains"
echo "👷 Workers: 40 PM2 instances"
echo "⏱️  API delay: 100ms (nagyon kíméletes)"
echo "🎯 Target: $MAX_DOMAINS domains"
echo "🏠 Otthoni net: SAFE ✅"
echo ""

# Extract first 1000 domains
TEMP_FILE="/tmp/conservative-1000-domains.txt"
head -1000 "$DOMAIN_FILE" > "$TEMP_FILE"

TOTAL=$(wc -l < "$TEMP_FILE")
TOTAL_BATCHES=$(( (TOTAL + BATCH_SIZE - 1) / BATCH_SIZE ))

echo "Total domains: $TOTAL"
echo "Total batches: $TOTAL_BATCHES (x$BATCH_SIZE domains)"
echo ""

ALL_SCAN_IDS=()
START_TIME=$(date +%s)
BATCH_NUM=0
BATCH_DOMAINS=()

# Process in batches
while IFS= read -r domain; do
  [[ -z "$domain" ]] && continue

  BATCH_DOMAINS+=("$domain")

  if [[ ${#BATCH_DOMAINS[@]} -eq $BATCH_SIZE ]]; then
    BATCH_NUM=$((BATCH_NUM + 1))

    echo "=========================================="
    echo "📦 BATCH $BATCH_NUM/$TOTAL_BATCHES"
    echo "=========================================="

    BATCH_SCAN_IDS=()
    COUNTER=0
    for domain in "${BATCH_DOMAINS[@]}"; do
      COUNTER=$((COUNTER + 1))

      if [[ ! "$domain" =~ ^https?:// ]]; then
        URL="https://$domain"
      else
        URL="$domain"
      fi

      echo -n "  [$COUNTER/$BATCH_SIZE] Creating: $URL... "

      RESPONSE=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\"}" 2>&1)

      SCAN_ID=$(echo "$RESPONSE" | jq -r '.scanId' 2>/dev/null)

      if [[ "$SCAN_ID" != "null" && -n "$SCAN_ID" ]]; then
        echo "✅"
        BATCH_SCAN_IDS+=("$SCAN_ID")
        ALL_SCAN_IDS+=("$SCAN_ID")
      else
        echo "❌"
      fi

      # 100ms delay between API calls (very gentle)
      sleep 0.1
    done

    echo ""
    echo "✅ Batch $BATCH_NUM created: ${#BATCH_SCAN_IDS[@]}/$BATCH_SIZE scans"
    echo "⏳ Waiting for completion..."
    echo ""

    BATCH_COMPLETED=0
    BATCH_FAILED=0

    while [ $BATCH_COMPLETED -lt ${#BATCH_SCAN_IDS[@]} ]; do
      sleep 3

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

      echo -ne "\rProgress: $BATCH_PROGRESS% | ✅ $BATCH_COMPLETED | ❌ $BATCH_FAILED | ⏳ $((${#BATCH_SCAN_IDS[@]} - BATCH_DONE))     "
    done

    echo ""
    echo "✅ Batch $BATCH_NUM complete: $BATCH_COMPLETED succeeded, $BATCH_FAILED failed"
    echo ""

    BATCH_DOMAINS=()
  fi
done < "$TEMP_FILE"

# Process remaining domains
if [[ ${#BATCH_DOMAINS[@]} -gt 0 ]]; then
  BATCH_NUM=$((BATCH_NUM + 1))

  echo "=========================================="
  echo "📦 BATCH $BATCH_NUM/$TOTAL_BATCHES (Final)"
  echo "=========================================="

  BATCH_SCAN_IDS=()
  COUNTER=0
  for domain in "${BATCH_DOMAINS[@]}"; do
    COUNTER=$((COUNTER + 1))

    if [[ ! "$domain" =~ ^https?:// ]]; then
      URL="https://$domain"
    else
      URL="$domain"
    fi

    echo -n "  [$COUNTER/${#BATCH_DOMAINS[@]}] Creating: $URL... "

    RESPONSE=$(curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"url\":\"$URL\"}" 2>&1)

    SCAN_ID=$(echo "$RESPONSE" | jq -r '.scanId' 2>/dev/null)

    if [[ "$SCAN_ID" != "null" && -n "$SCAN_ID" ]]; then
      echo "✅"
      BATCH_SCAN_IDS+=("$SCAN_ID")
      ALL_SCAN_IDS+=("$SCAN_ID")
    else
      echo "❌"
    fi

    sleep 0.1
  done

  echo ""
  echo "✅ Final batch created: ${#BATCH_SCAN_IDS[@]}/${#BATCH_DOMAINS[@]} scans"
  echo "⏳ Waiting for completion..."
  echo ""

  BATCH_COMPLETED=0
  BATCH_FAILED=0

  while [ $BATCH_COMPLETED -lt ${#BATCH_SCAN_IDS[@]} ]; do
    sleep 3

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

    echo -ne "\rProgress: $BATCH_PROGRESS% | ✅ $BATCH_COMPLETED | ❌ $BATCH_FAILED | ⏳ $((${#BATCH_SCAN_IDS[@]} - BATCH_DONE))     "
  done

  echo ""
  echo "✅ Final batch complete: $BATCH_COMPLETED succeeded, $BATCH_FAILED failed"
  echo ""
fi

# Final summary
END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
TOTAL_MIN=$((TOTAL_TIME / 60))
TOTAL_SEC=$((TOTAL_TIME % 60))

echo "=========================================="
echo "🏁 CONSERVATIVE MODE COMPLETE"
echo "=========================================="
echo ""

TOTAL_COMPLETED=0
TOTAL_FAILED=0

for SCAN_ID in "${ALL_SCAN_IDS[@]}"; do
  STATUS=$(curl -s "http://localhost:3000/api/scan/$SCAN_ID" | jq -r '.status' 2>/dev/null)

  case "$STATUS" in
    "COMPLETED")
      TOTAL_COMPLETED=$((TOTAL_COMPLETED + 1))
      ;;
    "FAILED")
      TOTAL_FAILED=$((TOTAL_FAILED + 1))
      ;;
  esac
done

echo "✅ Completed: $TOTAL_COMPLETED"
echo "❌ Failed: $TOTAL_FAILED"
echo "📊 Success rate: $(( TOTAL_COMPLETED * 100 / ${#ALL_SCAN_IDS[@]} ))%"
echo "⏱️  Total time: ${TOTAL_MIN}m ${TOTAL_SEC}s"
echo "📈 Average: $((TOTAL_TIME / ${#ALL_SCAN_IDS[@]}))s per scan"
echo "⚡ Speed: $((${#ALL_SCAN_IDS[@]} * 60 / TOTAL_TIME)) scans/minute"
echo ""

SCAN_FILE="/tmp/conservative-1000-scan-ids.txt"
printf "%s\n" "${ALL_SCAN_IDS[@]}" > "$SCAN_FILE"
echo "📄 Scan IDs saved to: $SCAN_FILE"
echo ""
echo "=========================================="
