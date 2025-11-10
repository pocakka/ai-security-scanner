/**
 * AI Endpoint Security Analyzer
 *
 * Detects CORS misconfigurations and missing rate limiting on AI API endpoints.
 * AI endpoints are expensive and should be protected against abuse.
 *
 * Security Risk: MEDIUM-HIGH
 * Detection Method: Network request monitoring + HTTP header analysis
 */

import type { Page, Request, Response } from 'playwright'

export interface AIEndpointFinding {
  type: 'cors_misconfiguration_ai_endpoint' | 'missing_rate_limiting'
  severity: 'critical' | 'high' | 'medium'
  title: string
  description: string
  evidence: {
    endpoint: string
    method: string
    allowOrigin?: string
    allowCredentials?: string
    allowMethods?: string
    rateLimitHeaders?: string[]
    vulnerability?: string
  }
  recommendation: string
  impact: string
}

// Common AI API endpoint patterns
const AI_ENDPOINT_PATTERNS = [
  '/api/chat',
  '/api/completion',
  '/api/completions',
  '/api/generate',
  '/api/ai',
  '/api/openai',
  '/api/anthropic',
  '/api/claude',
  '/api/gpt',
  '/v1/chat/completions',
  '/v1/completions',
  '/v1/embeddings',
]

// Standard rate limit header names
const RATE_LIMIT_HEADERS = [
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'retry-after',
  'x-rate-limit-limit', // Alternative naming
  'x-rate-limit-remaining',
  'x-rate-limit-reset',
]

interface DetectedEndpoint {
  url: string
  method: string
  response: Response | null
}

/**
 * Check if URL matches AI endpoint patterns
 */
function isAIEndpoint(url: string): boolean {
  return AI_ENDPOINT_PATTERNS.some(pattern => url.includes(pattern))
}

/**
 * Analyze CORS headers for misconfigurations
 */
function analyzeCORS(response: Response, endpoint: string): AIEndpointFinding | null {
  try {
    const headers = response.headers()

    const allowOrigin = headers['access-control-allow-origin']
    const allowCredentials = headers['access-control-allow-credentials']
    const allowMethods = headers['access-control-allow-methods']

    // No CORS headers = no issue (endpoint not exposed to cross-origin)
    if (!allowOrigin) {
      return null
    }

    // Check for dangerous wildcard with credentials
    if (allowOrigin === '*' && allowCredentials === 'true') {
      return {
        type: 'cors_misconfiguration_ai_endpoint',
        severity: 'critical',
        title: 'Critical CORS Misconfiguration on AI Endpoint',
        description: `AI endpoint ${endpoint} allows requests from ANY origin with credentials enabled. This is a critical security vulnerability.`,
        evidence: {
          endpoint: endpoint,
          method: response.request().method(),
          allowOrigin: allowOrigin,
          allowCredentials: allowCredentials,
          allowMethods: allowMethods || 'not specified',
          vulnerability: 'Wildcard origin with credentials',
        },
        recommendation: 'URGENT: Remove wildcard (*) CORS policy or disable credentials. Specify exact allowed origins in your CORS configuration. This is a critical vulnerability that allows any website to make authenticated API requests on behalf of your users.',
        impact: 'Any malicious website can make API requests with user credentials, potentially leading to unauthorized API usage, data theft, and significant cost abuse. Attackers can drain your AI API budget by making requests from their own websites.',
      }
    }

    // Check for dangerous wildcard (without credentials is still bad for AI endpoints)
    if (allowOrigin === '*') {
      return {
        type: 'cors_misconfiguration_ai_endpoint',
        severity: 'high',
        title: 'Permissive CORS Policy on AI Endpoint',
        description: `AI endpoint ${endpoint} allows requests from ANY origin. This enables API abuse from any website.`,
        evidence: {
          endpoint: endpoint,
          method: response.request().method(),
          allowOrigin: allowOrigin,
          allowCredentials: allowCredentials || 'false',
          allowMethods: allowMethods || 'not specified',
          vulnerability: 'Wildcard origin',
        },
        recommendation: 'Restrict CORS to specific trusted origins. AI endpoints are expensive and should not be accessible from arbitrary websites. Use a whitelist of allowed domains.',
        impact: 'Attackers can abuse your AI API from their own websites, leading to unexpected costs and potential service degradation. Even without credentials, this allows API quota abuse.',
      }
    }

    // Check for origin reflection (echoing back the origin)
    // This would require making a request from a different origin, which we can't do in this context
    // But we can check if the origin looks suspicious (e.g., not your domain)

    return null
  } catch (error) {
    console.error('[CORS Analysis] Error:', error)
    return null
  }
}

/**
 * Check for rate limiting headers
 */
function checkRateLimiting(response: Response, endpoint: string): AIEndpointFinding | null {
  try {
    const headers = response.headers()
    const headerKeys = Object.keys(headers).map(k => k.toLowerCase())

    // Check if any rate limit headers are present
    const hasRateLimitHeaders = RATE_LIMIT_HEADERS.some(rateHeaderName =>
      headerKeys.includes(rateHeaderName.toLowerCase())
    )

    if (hasRateLimitHeaders) {
      // Found rate limiting headers - good!
      return null
    }

    // No rate limiting headers detected
    return {
      type: 'missing_rate_limiting',
      severity: 'medium',
      title: 'Missing Rate Limiting Headers on AI Endpoint',
      description: `AI endpoint ${endpoint} does not indicate rate limiting through standard HTTP headers. AI API calls are expensive and should be rate-limited to prevent abuse.`,
      evidence: {
        endpoint: endpoint,
        method: response.request().method(),
        rateLimitHeaders: [],
      },
      recommendation: 'Implement rate limiting on your AI endpoints and expose rate limit information through standard headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset). This helps prevent API abuse and provides transparency to legitimate clients.',
      impact: 'Without visible rate limiting, attackers can abuse your AI endpoints by sending excessive requests, leading to unexpected costs and potential service outages. Rate limit headers also help legitimate clients implement proper backoff strategies.',
    }
  } catch (error) {
    console.error('[Rate Limiting Check] Error:', error)
    return null
  }
}

/**
 * Analyze AI endpoint security
 */
export async function analyzeAIEndpointSecurity(page: Page): Promise<AIEndpointFinding[]> {
  const findings: AIEndpointFinding[] = []
  const detectedEndpoints = new Map<string, DetectedEndpoint>()

  try {
    // Monitor network requests during page load
    page.on('response', async (response: Response) => {
      const url = response.url()
      const request = response.request()

      // Check if this is an AI endpoint
      if (isAIEndpoint(url)) {
        // Store unique endpoints (by URL and method)
        const key = `${request.method()}:${url}`
        if (!detectedEndpoints.has(key)) {
          detectedEndpoints.set(key, {
            url: url,
            method: request.method(),
            response: response,
          })
        }
      }
    })

    // Wait for network activity to settle
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // Timeout is OK - we'll analyze what we collected
    })

    // Analyze each detected endpoint
    for (const [key, endpoint] of detectedEndpoints.entries()) {
      if (!endpoint.response) continue

      // Check CORS configuration
      const corsIssue = analyzeCORS(endpoint.response, endpoint.url)
      if (corsIssue) {
        findings.push(corsIssue)
      }

      // Check rate limiting
      const rateLimitIssue = checkRateLimiting(endpoint.response, endpoint.url)
      if (rateLimitIssue) {
        findings.push(rateLimitIssue)
      }
    }

    // If no AI endpoints were detected during page load, try to probe common endpoints
    // (only as OPTIONS requests - passive and safe)
    if (detectedEndpoints.size === 0) {
      await probeCommonAIEndpoints(page, findings)
    }

    return findings

  } catch (error) {
    console.error('[AI Endpoint Security] Analysis failed:', error)
    return []
  }
}

/**
 * Probe common AI endpoint paths (OPTIONS only - safe and passive)
 */
async function probeCommonAIEndpoints(page: Page, findings: AIEndpointFinding[]): Promise<void> {
  try {
    const baseUrl = new URL(page.url())
    const commonPaths = ['/api/chat', '/api/completion', '/api/ai']

    for (const path of commonPaths) {
      try {
        const endpointUrl = `${baseUrl.origin}${path}`

        // Send OPTIONS request (CORS preflight) - this is passive and safe
        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url, {
              method: 'OPTIONS',
              headers: {
                'Origin': window.location.origin,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type',
              },
            })

            return {
              ok: res.ok,
              status: res.status,
              headers: Object.fromEntries(res.headers.entries()),
            }
          } catch (err) {
            return null
          }
        }, endpointUrl)

        if (response && response.ok) {
          // Endpoint exists and responds to OPTIONS
          const headers = response.headers

          // Check CORS
          const allowOrigin = headers['access-control-allow-origin']
          if (allowOrigin === '*') {
            findings.push({
              type: 'cors_misconfiguration_ai_endpoint',
              severity: 'high',
              title: 'Permissive CORS Policy on AI Endpoint',
              description: `AI endpoint ${endpointUrl} allows requests from ANY origin.`,
              evidence: {
                endpoint: endpointUrl,
                method: 'OPTIONS',
                allowOrigin: allowOrigin,
                vulnerability: 'Wildcard origin',
              },
              recommendation: 'Restrict CORS to specific trusted origins.',
              impact: 'API abuse from any website is possible, leading to cost overruns.',
            })
          }

          // Check rate limiting
          const hasRateLimit = RATE_LIMIT_HEADERS.some(header =>
            headers[header.toLowerCase()]
          )

          if (!hasRateLimit) {
            findings.push({
              type: 'missing_rate_limiting',
              severity: 'medium',
              title: 'Missing Rate Limiting Headers on AI Endpoint',
              description: `AI endpoint ${endpointUrl} does not indicate rate limiting.`,
              evidence: {
                endpoint: endpointUrl,
                method: 'OPTIONS',
                rateLimitHeaders: [],
              },
              recommendation: 'Implement rate limiting with standard headers.',
              impact: 'Potential API abuse leading to unexpected costs.',
            })
          }
        }
      } catch {
        // Endpoint doesn't exist or error - skip
        continue
      }
    }
  } catch (error) {
    console.error('[Probe AI Endpoints] Error:', error)
  }
}

/**
 * Helper: Extract AI endpoints from page (for testing/debugging)
 */
export async function detectAIEndpoints(page: Page): Promise<string[]> {
  const endpoints: string[] = []

  page.on('response', async (response: Response) => {
    const url = response.url()
    if (isAIEndpoint(url)) {
      endpoints.push(url)
    }
  })

  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})

  return [...new Set(endpoints)]
}
