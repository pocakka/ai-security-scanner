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
 * Formats a plugin/tech name from slug to title case
 * Example: "insert-headers-and-footers" -> "Insert Headers And Footers"
 */
function formatPluginName(slug: string): string {
  // Common WordPress plugin slug patterns
  slug = slug.replace(/^wp-/, '') // Remove wp- prefix
  slug = slug.replace(/-pro$/i, ' Pro') // Handle -pro suffix
  slug = slug.replace(/-lite$/i, ' Lite') // Handle -lite suffix

  // Split by hyphens and capitalize each word
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Clean evidence string for display
 * Removes HTML tags, limits length, and prettifies the output
 */
function cleanEvidence(evidence: string, maxLength: number = 100): string {
  if (!evidence) return ''

  // Remove HTML tags
  let cleaned = evidence.replace(/<[^>]+>/g, '')

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Truncate if too long
  if (cleaned.length > maxLength) {
    // Try to cut at a word boundary
    cleaned = cleaned.substring(0, maxLength)
    const lastSpace = cleaned.lastIndexOf(' ')
    if (lastSpace > maxLength * 0.7) {
      // Only cut at space if it's not too far back
      cleaned = cleaned.substring(0, lastSpace)
    }
    cleaned += '...'
  }

  return cleaned
}

/**
 * Extract meaningful information from evidence based on tech type
 * For "Social Login (OAuth)" → extract provider name (Facebook, Google, Twitter)
 * For most other tech → return empty string (don't show code snippets)
 */
function extractMeaningfulEvidence(techName: string, evidence: string, pattern: string): string | null {
  if (!evidence) return null

  // Special handling for Social Login (OAuth)
  if (techName === 'Social Login (OAuth)') {
    const lowerEvidence = evidence.toLowerCase()
    const lowerPattern = pattern.toLowerCase()

    // Extract provider name from pattern or evidence
    if (lowerPattern.includes('facebook') || lowerEvidence.includes('facebook')) {
      return 'Facebook'
    }
    if (lowerPattern.includes('google') || lowerEvidence.includes('google')) {
      return 'Google'
    }
    if (lowerPattern.includes('twitter') || lowerEvidence.includes('twitter')) {
      return 'Twitter'
    }
    if (lowerPattern.includes('github') || lowerEvidence.includes('github')) {
      return 'GitHub'
    }
    if (lowerPattern.includes('linkedin') || lowerEvidence.includes('linkedin')) {
      return 'LinkedIn'
    }
    if (lowerPattern.includes('apple') || lowerEvidence.includes('apple')) {
      return 'Apple'
    }
    if (lowerPattern.includes('microsoft') || lowerEvidence.includes('microsoft')) {
      return 'Microsoft'
    }
  }

  // For tracking IDs (Google Analytics, Facebook Pixel, etc.) - show the ID
  if (techName.includes('Analytics') || techName.includes('Pixel') || techName.includes('Tag Manager')) {
    // Extract tracking ID patterns
    const trackingIdMatch = evidence.match(/(?:UA|G|GTM|AW)-[A-Z0-9-]+/i)
    if (trackingIdMatch) {
      return trackingIdMatch[0]
    }
  }

  // For most frameworks/libraries (Next.js, React, Bulma, etc.) - don't show evidence
  // Just show the confidence level
  const noEvidenceCategories = ['framework', 'cdn', 'hosting']
  const noEvidenceTech = [
    'Next.js',
    'React',
    'Vue.js',
    'Angular',
    'Bulma',
    'Bootstrap',
    'Tailwind CSS',
    'jQuery',
    'Webpack',
    'Vite',
  ]

  if (noEvidenceTech.includes(techName)) {
    return null // Don't show evidence for these
  }

  // For URLs (CDN, scripts) - don't show full URLs
  if (evidence.includes('http://') || evidence.includes('https://') || evidence.includes('//')) {
    return null // URLs are not meaningful to end users
  }

  // For CSS class names, variable names, etc - don't show
  if (evidence.includes('class=') || evidence.includes('var(') || evidence.includes('{') || evidence.includes('}')) {
    return null
  }

  // Default: clean and show if it's short enough
  const cleaned = cleanEvidence(evidence, 50)
  if (cleaned.length < 10) {
    return null // Too short to be meaningful
  }

  return cleaned
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
    let foundMatch = false // Track if we found at least one match

    for (const pattern of tech.patterns) {
      // For WordPress, collect ALL plugin matches
      // For other tech, break after first match
      if (foundMatch && tech.name !== 'WordPress') {
        break // Early exit - we already found this tech
      }

      // Ensure regex has 'g' flag for matchAll
      let regex: RegExp
      if (typeof pattern.match === 'string') {
        regex = new RegExp(pattern.match, 'gi')
      } else {
        // If RegExp, ensure it has global flag
        const flags = pattern.match.flags.includes('g') ? pattern.match.flags : pattern.match.flags + 'g'
        regex = new RegExp(pattern.match.source, flags)
      }

      switch (pattern.type) {
        case 'html':
        case 'dom':
          // Find ALL matches in HTML
          const htmlMatches = html.matchAll(regex)
          for (const match of htmlMatches) {
            // If there's a capture group, use it as the evidence
            const evidence = match[1] || match[0]
            matches.add(evidence)
            foundMatch = true

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
          // Debug: Log script count for WordPress
          if (tech.name === 'WordPress') {
            console.log(`[TechAnalyzer] Checking ${scripts.length} script/stylesheet URLs for WordPress plugins`)
          }

          // Use matchAll to find ALL matches with capture groups
          for (const scriptUrl of scripts) {
            // Reset regex lastIndex for test
            regex.lastIndex = 0
            const allMatches = scriptUrl.matchAll(regex)

            for (const match of allMatches) {
              // match[1] is the capture group (plugin name)
              const evidence = match[1] || match[0]
              matches.add(evidence)
              foundMatch = true
              if (tech.name === 'WordPress') {
                console.log(`[TechAnalyzer]   ✓ Match found: ${evidence} (from ${scriptUrl.substring(0, 80)}...)`)
              }
            }
          }
          break

        case 'link':
          for (const linkUrl of links) {
            if (regex.test(linkUrl)) {
              const match = linkUrl.match(regex)
              const evidence = match && match[1] ? match[1] : linkUrl
              matches.add(evidence)
              foundMatch = true
            }
          }
          break

        case 'header':
          for (const [headerName, headerValue] of Object.entries(headers)) {
            const combined = headerName + headerValue
            if (regex.test(combined)) {
              const match = combined.match(regex)
              const evidence = match && match[1] ? match[1] : match ? match[0] : combined
              matches.add(evidence)
              foundMatch = true
            }
          }
          break

        case 'meta':
          const metaMatches = html.matchAll(regex)
          for (const match of metaMatches) {
            const evidence = match[1] || match[0]
            matches.add(evidence)
            foundMatch = true

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
            foundMatch = true
          }
          break
      }
    }

    // Create a detected tech entry for EACH unique match
    if (matches.size > 0) {
      // Special handling for WordPress plugins - use plugin name as the tech name
      if (tech.name === 'WordPress') {
        const pluginNames = new Set<string>()

        for (const evidence of matches) {
          const lowerEvidence = evidence.toLowerCase()
          // Check if this is a plugin slug
          // Skip: dots (.js, .css), wp-content/wp-includes folder names, and single-word WordPress folders
          if (
            !evidence.includes('.') &&
            lowerEvidence !== 'wp-content' &&
            lowerEvidence !== 'wp-includes' &&
            lowerEvidence !== 'content' &&
            lowerEvidence !== 'includes' &&
            evidence.length > 2
          ) {
            // This is a plugin slug, format it nicely
            const formattedName = formatPluginName(evidence)
            pluginNames.add(formattedName)
          }
        }

        // Add each unique plugin as a separate WordPress entry
        if (pluginNames.size > 0) {
          for (const pluginName of pluginNames) {
            detected.push({
              name: pluginName,
              category: tech.category,
              confidence: tech.confidence,
              version: extractedVersion,
              description: 'WordPress Plugin',
              website: tech.website,
            })
          }
        } else {
          // No plugins found, just add WordPress itself
          detected.push({
            name: tech.name,
            category: tech.category,
            confidence: tech.confidence,
            version: extractedVersion,
            description: tech.description,
            website: tech.website,
          })
        }
      } else {
        // For non-WordPress tech, use original logic
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
          // Special handling for Social Login (OAuth) - aggregate providers
          if (tech.name === 'Social Login (OAuth)') {
            const providers = new Set<string>()
            for (const evidence of matches) {
              const meaningful = extractMeaningfulEvidence(tech.name, evidence, '')
              if (meaningful) {
                providers.add(meaningful)
              }
            }

            // Add single entry with all providers
            if (providers.size > 0) {
              detected.push({
                name: tech.name,
                category: tech.category,
                confidence: tech.confidence,
                version: extractedVersion,
                description: tech.description,
                website: tech.website,
                evidence: Array.from(providers).join(', '), // "Facebook, Google, Twitter"
              })
            }
          } else {
            // Add each unique match as a separate entry
            for (const evidence of matches) {
              const meaningful = extractMeaningfulEvidence(tech.name, evidence, '')

              detected.push({
                name: tech.name,
                category: tech.category,
                confidence: tech.confidence,
                version: extractedVersion,
                description: tech.description,
                website: tech.website,
                evidence: meaningful || undefined, // Only set if meaningful, otherwise undefined
              })
            }
          }
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
