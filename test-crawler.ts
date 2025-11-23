/**
 * Test script for PlaywrightCrawler
 *
 * Usage: npx ts-node test-crawler.ts
 */

import { PlaywrightCrawler } from './src/lib/playwright-crawler'

async function testCrawler() {
  console.log('🧪 Testing PlaywrightCrawler...\n')

  const crawler = new PlaywrightCrawler({
    timeout: 30000,
    captureScreenshot: false,
    evaluateJavaScript: true,
  })

  // Test URLs
  const testUrls = [
    'https://example.com',
    'https://chat.openai.com',
    // 'https://claude.ai',
  ]

  for (const url of testUrls) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${url}`)
    console.log('='.repeat(60))

    try {
      const result = await crawler.crawl(url)

      console.log('\n📊 Results:')
      console.log(`  Success: ${result.success}`)
      console.log(`  Status Code: ${result.statusCode}`)
      console.log(`  Final URL: ${result.finalUrl}`)
      console.log(`  Load Time: ${result.loadTime}ms`)
      console.log(`  Requests: ${result.requests?.length || 0}`)
      console.log(`  Responses: ${result.responses?.length || 0}`)
      console.log(`  Cookies: ${result.cookies?.length || 0}`)
      console.log(`  HTML Length: ${result.html?.length || 0} characters`)

      // Show AI provider detection
      const aiProviders = result.responses?.filter((r) =>
        r.url.match(/openai\.com|anthropic\.com|azure\.com|bedrock/)
      ) || []
      if (aiProviders.length > 0) {
        console.log(`\n🤖 AI Providers Detected:`)
        aiProviders.forEach((r) => {
          console.log(`  - ${r.url} (${r.statusCode})`)
        })
      }

      // Show JS evaluation
      if (result.jsEvaluation) {
        console.log(`\n📜 JavaScript Evaluation:`)
        console.log(`  LangChain: ${result.jsEvaluation.hasLangChain}`)
        console.log(`  OpenAI SDK: ${result.jsEvaluation.hasOpenAI}`)
        console.log(`  Vercel AI: ${result.jsEvaluation.hasVercelAI}`)
        if (result.jsEvaluation.jQueryVersion) {
          console.log(`  jQuery: ${result.jsEvaluation.jQueryVersion}`)
        }
        if (result.jsEvaluation.reactVersion) {
          console.log(`  React: ${result.jsEvaluation.reactVersion}`)
        }
      }

      // Show cookies summary
      if (result.cookies && result.cookies.length > 0) {
        console.log(`\n🍪 Cookies:`)
        result.cookies.slice(0, 5).forEach((cookie) => {
          console.log(
            `  - ${cookie.name}: secure=${cookie.secure}, httpOnly=${cookie.httpOnly}, sameSite=${cookie.sameSite}`
          )
        })
        if (result.cookies.length > 5) {
          console.log(`  ... and ${result.cookies.length - 5} more`)
        }
      }

      if (result.error) {
        console.log(`\n❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error(`\n❌ Test failed:`, error)
    }
  }

  console.log('\n\n✅ Crawler test complete!')
}

// Run tests
testCrawler().catch(console.error)
