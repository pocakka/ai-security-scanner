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
 * Check if tech should aggregate multiple matches into single entry
 * For social/sharing features - show once, not 3x for different mailto links
 */
function noEvidenceForMultipleMatches(techName: string): boolean {
  const aggregateTech = [
    'Email Share',
    'Print Friendly',
    'WhatsApp Share',
    'Telegram Share',
    'Viber Share',
    'LinkedIn Share',
    'Twitter Share',
    'Facebook Share',
    'Pinterest Share',
    'Reddit Share',
  ]

  return aggregateTech.includes(techName)
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
 * Extract meaningful information from evidence based on tech type and category
 *
 * WordPress plugins: Show formatted plugin name (kept from evidence)
 * Social Login (OAuth): Extract provider names (Facebook, Google, Twitter)
 * Analytics/Ads/CDN/Hosting/E-commerce/Framework: NO evidence (just confidence)
 *
 * This makes reports professional and user-friendly.
 */
function extractMeaningfulEvidence(
  techName: string,
  category: string,
  evidence: string
): string | null {
  if (!evidence) return null

  // Special handling for Social Login (OAuth) - extract provider names
  if (techName === 'Social Login (OAuth)') {
    const lowerEvidence = evidence.toLowerCase()

    // Extract provider name from evidence
    if (lowerEvidence.includes('facebook')) return 'Facebook'
    if (lowerEvidence.includes('google')) return 'Google'
    if (lowerEvidence.includes('twitter')) return 'Twitter'
    if (lowerEvidence.includes('github')) return 'GitHub'
    if (lowerEvidence.includes('linkedin')) return 'LinkedIn'
    if (lowerEvidence.includes('apple')) return 'Apple'
    if (lowerEvidence.includes('microsoft')) return 'Microsoft'
  }

  // CATEGORY-BASED LOGIC: Hide evidence for these categories
  const noEvidenceCategories = [
    'analytics',   // Google Analytics, Matomo, etc - just show "✓ Confirmed"
    'ads',         // Google Ads, Facebook Pixel, etc - just show "✓ Confirmed"
    'cdn',         // Cloudflare, jsDelivr, etc - just show "✓ Confirmed"
    'hosting',     // Vercel, Netlify, AWS, etc - just show "✓ Confirmed"
    'ecommerce',   // Stripe, PayPal, Shopify, etc - just show "✓ Confirmed"
    'framework',   // Next.js, React, Vue, etc - just show "✓ Confirmed"
  ]

  if (noEvidenceCategories.includes(category)) {
    return null // Don't show code snippets for these categories
  }

  // For WordPress plugins (CMS category) - keep the evidence
  // This is handled separately in the main logic

  // For URLs, CSS, or code snippets - don't show
  if (
    evidence.includes('http://') ||
    evidence.includes('https://') ||
    evidence.includes('//') ||
    evidence.includes('class=') ||
    evidence.includes('var(') ||
    evidence.includes('{') ||
    evidence.includes('}')
  ) {
    return null
  }

  // Default: clean and show if meaningful
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
  for (const linkMatch of html.matchAll(linkRegex)) {
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
          // Special handling for tech with multiple matches - aggregate into single entry
          if (tech.name === 'Social Login (OAuth)') {
            // For OAuth, aggregate provider names
            const providers = new Set<string>()
            for (const evidence of matches) {
              const meaningful = extractMeaningfulEvidence(tech.name, tech.category, evidence)
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
          } else if (matches.size > 1 && noEvidenceForMultipleMatches(tech.name)) {
            // For tech that should show once regardless of multiple matches
            // (Email Share, Print Friendly, Social Share buttons, etc.)
            detected.push({
              name: tech.name,
              category: tech.category,
              confidence: tech.confidence,
              version: extractedVersion,
              description: tech.description,
              website: tech.website,
              // No evidence - just show "✓ Confirmed" once
            })
          } else {
            // Add each unique match as a separate entry (WordPress plugins, etc.)
            for (const evidence of matches) {
              const meaningful = extractMeaningfulEvidence(tech.name, tech.category, evidence)

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

  // Deduplicate detected technologies by name
  // Keep first occurrence with highest confidence and version info
  const seen = new Map<string, DetectedTech>()
  for (const tech of detected) {
    const existing = seen.get(tech.name)

    // If not seen yet, add it
    if (!existing) {
      seen.set(tech.name, tech)
      continue
    }

    // Replace if new entry has better confidence
    if (tech.confidence === 'high' && existing.confidence !== 'high') {
      seen.set(tech.name, tech)
      continue
    }

    // Replace if new entry has version and existing doesn't
    if (tech.version && !existing.version) {
      seen.set(tech.name, tech)
      continue
    }

    // Otherwise keep existing entry (first occurrence)
  }

  // Convert back to array
  const deduplicated = Array.from(seen.values())

  // Group by category
  const categories = {
    cms: deduplicated.filter((t) => t.category === 'cms'),
    analytics: deduplicated.filter((t) => t.category === 'analytics'),
    ads: deduplicated.filter((t) => t.category === 'ads'),
    cdn: deduplicated.filter((t) => t.category === 'cdn'),
    social: deduplicated.filter((t) => t.category === 'social'),
    ecommerce: deduplicated.filter((t) => t.category === 'ecommerce'),
    framework: deduplicated.filter((t) => t.category === 'framework'),
    hosting: deduplicated.filter((t) => t.category === 'hosting'),
  }

  return {
    detected: deduplicated,
    categories,
    totalCount: deduplicated.length,
  }
}
