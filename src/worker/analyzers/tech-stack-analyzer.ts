import { CrawlResult } from '../crawler-mock'
import { TECH_DETECTION_RULES, TechPattern } from '../config/tech-detection-rules'

export interface DetectedTech {
  name: string
  category: 'cms' | 'analytics' | 'ads' | 'cdn' | 'social' | 'ecommerce' | 'framework' | 'hosting'
  confidence: 'low' | 'medium' | 'high'
  version?: string
  description?: string
  website?: string
}

export interface TechStackResult {
  detected: DetectedTech[]
  categories: {
    cms: DetectedTech[]
    analytics: DetectedTech[]
    ads: DetectedTech[]
    cdn: DetectedTech[]
    social: DetectedTech[]
    ecommerce: DetectedTech[]
    framework: DetectedTech[]
    hosting: DetectedTech[]
  }
  totalCount: number
}

/**
 * Tech Stack Analyzer
 *
 * Detects technologies used on a website similar to Wappalyzer.
 * Uses configurable rules from tech-detection-rules.ts
 */
export function analyzeTechStack(crawlResult: CrawlResult): TechStackResult {
  const detected: DetectedTech[] = []
  const html = crawlResult.html || ''
  const scripts = crawlResult.scripts || []
  const headers = crawlResult.responseHeaders || {}

  // Extract all <link> URLs from HTML
  const links: string[] = []
  const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi
  let linkMatch
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    links.push(linkMatch[1])
  }

  // Check each tech pattern
  for (const tech of TECH_DETECTION_RULES) {
    let matchCount = 0
    let extractedVersion: string | undefined

    for (const pattern of tech.patterns) {
      const regex = typeof pattern.match === 'string' ? new RegExp(pattern.match, 'i') : pattern.match

      switch (pattern.type) {
        case 'html':
        case 'dom':
          if (regex.test(html)) {
            matchCount++
            // Try to extract version
            if (pattern.version) {
              const versionMatch = html.match(pattern.version)
              if (versionMatch && versionMatch[1]) {
                extractedVersion = versionMatch[1]
              }
            }
          }
          break

        case 'script':
          for (const scriptUrl of scripts) {
            if (regex.test(scriptUrl)) {
              matchCount++
              break
            }
          }
          break

        case 'link':
          for (const linkUrl of links) {
            if (regex.test(linkUrl)) {
              matchCount++
              break
            }
          }
          break

        case 'header':
          for (const [headerName, headerValue] of Object.entries(headers)) {
            if (regex.test(headerName) || regex.test(headerValue)) {
              matchCount++
              break
            }
          }
          break

        case 'meta':
          // Meta tags are in HTML
          if (regex.test(html)) {
            matchCount++
            // Try to extract version
            if (pattern.version) {
              const versionMatch = html.match(pattern.version)
              if (versionMatch && versionMatch[1]) {
                extractedVersion = versionMatch[1]
              }
            }
          }
          break

        case 'js-global':
          // Check for JavaScript global variables in HTML content
          if (regex.test(html)) {
            matchCount++
          }
          break
      }
    }

    // If at least one pattern matched, consider tech detected
    if (matchCount > 0) {
      detected.push({
        name: tech.name,
        category: tech.category,
        confidence: tech.confidence,
        version: extractedVersion,
        description: tech.description,
        website: tech.website,
      })
    }
  }

  // Group by category
  const categories = {
    cms: detected.filter((t) => t.category === 'cms'),
    analytics: detected.filter((t) => t.category === 'analytics'),
    ads: detected.filter((t) => t.category === 'ads'),
    cdn: detected.filter((t) => t.category === 'cdn'),
    social: detected.filter((t) => t.category === 'social'),
    ecommerce: detected.filter((t) => t.category === 'ecommerce'),
    framework: detected.filter((t) => t.category === 'framework'),
    hosting: detected.filter((t) => t.category === 'hosting'),
  }

  return {
    detected,
    categories,
    totalCount: detected.length,
  }
}
