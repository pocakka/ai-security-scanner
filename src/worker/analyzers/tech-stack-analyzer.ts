import { CrawlResult } from '../crawler-mock'
import { TECH_DETECTION_RULES, TechPattern } from '../config/tech-detection-rules'

export interface DetectedTech {
  name: string
  category: 'cms' | 'analytics' | 'ads' | 'cdn' | 'social' | 'ecommerce' | 'framework' | 'hosting'
  confidence: 'low' | 'medium' | 'high'
  version?: string
  description?: string
  website?: string
  evidence?: string // The actual match that was found (plugin name, tracking ID, etc.)
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
 *
 * Lists ALL individual matches (plugins, tracking IDs, etc.)
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
    const matches = new Set<string>() // Store unique matches
    let extractedVersion: string | undefined

    for (const pattern of tech.patterns) {
      const regex = typeof pattern.match === 'string' ? new RegExp(pattern.match, 'gi') : pattern.match

      switch (pattern.type) {
        case 'html':
        case 'dom':
          // Find ALL matches in HTML
          const htmlMatches = html.matchAll(regex)
          for (const match of htmlMatches) {
            // If there's a capture group, use it as the evidence
            const evidence = match[1] || match[0]
            matches.add(evidence)

            // Try to extract version
            if (pattern.version && !extractedVersion) {
              const versionMatch = html.match(pattern.version)
              if (versionMatch && versionMatch[1]) {
                extractedVersion = versionMatch[1]
              }
            }
          }
          break

        case 'script':
          for (const scriptUrl of scripts) {
            // Reset regex for each script
            const scriptRegex = typeof pattern.match === 'string' ? new RegExp(pattern.match, 'gi') : new RegExp(pattern.match.source, pattern.match.flags)
            const scriptMatches = scriptUrl.matchAll(scriptRegex)
            for (const match of scriptMatches) {
              const evidence = match[1] || scriptUrl
              matches.add(evidence)
            }
          }
          break

        case 'link':
          for (const linkUrl of links) {
            const linkRegex = typeof pattern.match === 'string' ? new RegExp(pattern.match, 'gi') : new RegExp(pattern.match.source, pattern.match.flags)
            const linkMatches = linkUrl.matchAll(linkRegex)
            for (const match of linkMatches) {
              const evidence = match[1] || linkUrl
              matches.add(evidence)
            }
          }
          break

        case 'header':
          for (const [headerName, headerValue] of Object.entries(headers)) {
            const headerRegex = typeof pattern.match === 'string' ? new RegExp(pattern.match, 'gi') : new RegExp(pattern.match.source, pattern.match.flags)
            const headerMatches = (headerName + headerValue).matchAll(headerRegex)
            for (const match of headerMatches) {
              const evidence = match[1] || match[0]
              matches.add(evidence)
            }
          }
          break

        case 'meta':
          const metaMatches = html.matchAll(regex)
          for (const match of metaMatches) {
            const evidence = match[1] || match[0]
            matches.add(evidence)

            // Try to extract version
            if (pattern.version && !extractedVersion) {
              const versionMatch = html.match(pattern.version)
              if (versionMatch && versionMatch[1]) {
                extractedVersion = versionMatch[1]
              }
            }
          }
          break

        case 'js-global':
          const jsMatches = html.matchAll(regex)
          for (const match of jsMatches) {
            const evidence = match[1] || match[0]
            matches.add(evidence)
          }
          break
      }
    }

    // Create a detected tech entry for EACH unique match
    if (matches.size > 0) {
      // If no specific evidence captured, just add the tech once
      if (matches.size === 1 && [...matches][0] === tech.name) {
        detected.push({
          name: tech.name,
          category: tech.category,
          confidence: tech.confidence,
          version: extractedVersion,
          description: tech.description,
          website: tech.website,
        })
      } else {
        // Add each unique match as a separate entry
        for (const evidence of matches) {
          detected.push({
            name: tech.name,
            category: tech.category,
            confidence: tech.confidence,
            version: extractedVersion,
            description: tech.description,
            website: tech.website,
            evidence: evidence.length > 200 ? evidence.substring(0, 200) + '...' : evidence, // Truncate long URLs
          })
        }
      }
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
