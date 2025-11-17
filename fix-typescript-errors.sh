#!/bin/bash
# Fix TypeScript "possibly undefined" errors across all analyzer files

echo "Fixing TypeScript errors..."

# Fix client-risks.ts
sed -i '' 's/for (let i = 0; i < crawlResult.scripts.length; i++) {/for (let i = 0; i < (crawlResult.scripts || []).length; i++) {/g' src/worker/analyzers/client-risks.ts
sed -i '' 's/const script = crawlResult.scripts\[i\]/const script = (crawlResult.scripts || [])[i]/g' src/worker/analyzers/client-risks.ts

# Fix cors-analyzer.ts
sed -i '' 's/const headers = normalizeHeaders(crawlResult.responseHeaders)/const headers = normalizeHeaders(crawlResult.responseHeaders || {})/g' src/worker/analyzers/cors-analyzer.ts

# Fix js-libraries-analyzer.ts
sed -i '' 's/for (const script of crawlResult.scripts) {/for (const script of crawlResult.scripts || []) {/g' src/worker/analyzers/js-libraries-analyzer.ts

# Fix llm-api-detector.ts
sed -i '' 's/for (const request of crawlResult.networkRequests) {/for (const request of crawlResult.networkRequests || []) {/g' src/worker/analyzers/llm-api-detector.ts
sed -i '' 's/const allContent = crawlResult.html + '"'"' '"'"' + crawlResult.scripts.join('"'"' '"'"')/const allContent = crawlResult.html + '"'"' '"'"' + (crawlResult.scripts || []).join('"'"' '"'"')/g' src/worker/analyzers/llm-api-detector.ts
sed -i '' 's/for (const script of crawlResult.scripts) {/for (const script of crawlResult.scripts || []) {/g' src/worker/analyzers/llm-api-detector.ts

# Fix security-headers.ts
sed -i '' 's/for (const \[key, value\] of Object.entries(crawlResult.responseHeaders)) {/for (const [key, value] of Object.entries(crawlResult.responseHeaders || {})) {/g' src/worker/analyzers/security-headers.ts

# Fix ssl-tls-analyzer.ts
sed -i '' 's/for (const request of crawlResult.networkRequests) {/for (const request of crawlResult.networkRequests || []) {/g' src/worker/analyzers/ssl-tls-analyzer.ts
sed -i '' 's/for (const script of crawlResult.scripts) {/for (const script of crawlResult.scripts || []) {/g' src/worker/analyzers/ssl-tls-analyzer.ts
sed -i '' "s/const protocolHeader = headers\['x-tls-version'\] || headers\['x-ssl-version'\]/const protocolHeader = headers?.['x-tls-version'] || headers?.['x-ssl-version']/g" src/worker/analyzers/ssl-tls-analyzer.ts

echo "✅ Fixed all 'possibly undefined' errors in analyzers"
