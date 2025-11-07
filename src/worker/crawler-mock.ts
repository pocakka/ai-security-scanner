// Mock crawler for local development - returns realistic test data

export interface CrawlResult {
  url: string
  domain: string
  networkRequests: NetworkRequest[]
  html: string
  scripts: string[]
  responseHeaders: Record<string, string>
  loadTime: number
  finalUrl: string
}

export interface NetworkRequest {
  url: string
  method: string
  resourceType: string
  status?: number
}

// Mock data generator based on URL
export async function mockCrawl(url: string): Promise<CrawlResult> {
  const urlObj = new URL(url)
  const domain = urlObj.hostname

  console.log(`[MockCrawler] Crawling ${url}...`)

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Generate realistic mock data based on domain
  const isChatBotSite = domain.includes('openai') || domain.includes('anthropic') || domain.includes('chat')
  const hasAPIKey = domain.includes('test') || domain.includes('demo')

  const mockHtml = generateMockHtml(domain, isChatBotSite, hasAPIKey)
  const mockScripts = generateMockScripts(isChatBotSite, hasAPIKey)
  const mockNetworkRequests = generateMockNetworkRequests(isChatBotSite)
  const mockHeaders = generateMockHeaders(domain)

  return {
    url,
    domain,
    networkRequests: mockNetworkRequests,
    html: mockHtml,
    scripts: mockScripts,
    responseHeaders: mockHeaders,
    loadTime: 800 + Math.random() * 400, // 800-1200ms
    finalUrl: url,
  }
}

function generateMockHtml(domain: string, hasChat: boolean, hasAPIKey: boolean): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${domain}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <div id="root">
    <h1>Welcome to ${domain}</h1>
    <p>This is a mock HTML response for testing.</p>
`

  if (hasChat) {
    html += `
    <!-- Chat widget -->
    <div id="intercom-container"></div>
    <script src="https://widget.intercom.io/widget/abc123"></script>
`
  }

  if (hasAPIKey) {
    html += `
    <!-- DANGER: Exposed API key (for testing) -->
    <script>
      const config = {
        apiKey: "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456789012"
      };
    </script>
`
  }

  html += `
  </div>
</body>
</html>`

  return html
}

function generateMockScripts(hasChat: boolean, hasAPIKey: boolean): string[] {
  const scripts = [
    'https://cdn.example.com/bundle.js',
    'https://cdn.example.com/vendor.js',
  ]

  if (hasChat) {
    scripts.push('https://widget.intercom.io/widget/abc123')
    scripts.push('import { ChatBot } from "@anthropic/chat-widget"')
  }

  if (hasAPIKey) {
    scripts.push('const apiKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz123456789012"')
  }

  return scripts
}

function generateMockNetworkRequests(hasChat: boolean): NetworkRequest[] {
  const requests: NetworkRequest[] = [
    { url: 'https://cdn.example.com/bundle.js', method: 'GET', resourceType: 'script', status: 200 },
    { url: 'https://cdn.example.com/styles.css', method: 'GET', resourceType: 'stylesheet', status: 200 },
    { url: 'https://fonts.googleapis.com/css2', method: 'GET', resourceType: 'stylesheet', status: 200 },
  ]

  if (hasChat) {
    requests.push(
      { url: 'https://api.intercom.io/messenger/web/conversations', method: 'GET', resourceType: 'fetch', status: 200 },
      { url: 'https://api.openai.com/v1/chat/completions', method: 'POST', resourceType: 'fetch', status: 200 }
    )
  }

  return requests
}

function generateMockHeaders(domain: string): Record<string, string> {
  const headers: Record<string, string> = {
    'content-type': 'text/html; charset=utf-8',
    'server': 'cloudflare',
  }

  // Simulate some sites having better security
  if (domain.includes('secure') || domain.includes('bank')) {
    headers['strict-transport-security'] = 'max-age=63072000; includeSubDomains; preload'
    headers['content-security-policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'"
    headers['x-frame-options'] = 'DENY'
    headers['x-content-type-options'] = 'nosniff'
  }

  // Most sites don't have good security headers (realistic)
  return headers
}

export class MockCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    return mockCrawl(url)
  }

  async close(): Promise<void> {
    console.log('[MockCrawler] Closed')
  }
}
