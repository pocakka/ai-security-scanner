/**
 * AI System Prompt Exposure Analyzer
 *
 * Detects exposed AI system prompts in client-side JavaScript code.
 * System prompts reveal AI behavior, instructions, and business logic.
 *
 * Security Risk: CRITICAL
 * Detection Method: Regex pattern matching + keyword validation
 */

import type { Page } from 'playwright'

export interface SystemPromptFinding {
  type: 'system_prompt_exposure'
  severity: 'critical'
  title: string
  description: string
  evidence: {
    prompt: string // First 200 chars
    file: string | null
    context: string
    confidence: 'high' | 'medium' | 'low'
  }
  recommendation: string
  impact: string
}

// Patterns that match common AI system prompt formats
export const SYSTEM_PROMPT_PATTERNS = [
  // OpenAI API format
  /role:\s*["']system["']\s*,\s*content:\s*["']([^"']{50,})["']/gi,

  // Anthropic Claude format
  /system:\s*["']([^"']{50,})["']/gi,

  // Variable assignments
  /(?:const|let|var)\s+(?:SYSTEM_)?PROMPT\s*=\s*["'`]([^"'`]{50,})["'`]/gi,
  /(?:const|let|var)\s+(?:system|assistant)Instructions\s*=\s*["'`]([^"'`]{50,})["'`]/gi,

  // Configuration objects
  /systemMessage:\s*["'`]([^"'`]{50,})["'`]/gi,
  /instructions:\s*["'`]([^"'`]{50,})["'`]/gi,

  // Template literals (with multi-line support)
  /`You are (?:a|an)\s+([^`]{20,})`/gi,
  /`Your role is to\s+([^`]{20,})`/gi,
  /`You must\s+([^`]{20,})`/gi,
  /`Follow these instructions[:\s]+([^`]{20,})`/gi,
]

// Keywords that indicate AI instructions (not code comments)
export const AI_INSTRUCTION_KEYWORDS = [
  'You are a helpful assistant',
  'Your task is to',
  'Follow these instructions',
  'You must never',
  'Always respond with',
  'Do not reveal',
  'Ignore previous instructions',
  'System:',
  'Assistant:',
  'act as a',
  'behave as',
  'You should always',
  'Your job is to',
  'respond as if you are',
]

/**
 * Check if a match is likely a false positive
 */
function isLikelyFalsePositive(match: string, context: string): boolean {
  // Exclude comments
  if (context.match(/\/\/.*|\/\*.*\*\//)) {
    // Check if the match is inside a comment
    const commentStart = context.lastIndexOf('/*', context.indexOf(match))
    const commentEnd = context.indexOf('*/', context.indexOf(match))
    const lineCommentStart = context.lastIndexOf('//', context.indexOf(match))
    const newlineBeforeMatch = context.lastIndexOf('\n', context.indexOf(match))

    if ((commentStart !== -1 && (commentEnd === -1 || commentEnd > context.indexOf(match))) ||
        (lineCommentStart !== -1 && lineCommentStart > newlineBeforeMatch)) {
      return true
    }
  }

  // Exclude demo/example code
  if (context.match(/example|demo|test|mock|sample|placeholder/i)) {
    return true
  }

  // Exclude very short matches (< 50 chars)
  if (match.length < 50) {
    return true
  }

  // Exclude configuration files
  if (context.includes('package.json') || context.includes('tsconfig')) {
    return true
  }

  // Exclude generic placeholder text
  const genericPlaceholders = [
    'lorem ipsum',
    'foo bar',
    'this is a test',
    'hello world',
    'example text',
  ]
  const matchLower = match.toLowerCase()
  if (genericPlaceholders.some(placeholder => matchLower.includes(placeholder))) {
    return true
  }

  return false
}

/**
 * Calculate confidence score based on pattern match and keywords
 */
function calculateConfidence(match: string, context: string): 'high' | 'medium' | 'low' {
  let score = 0

  // Check for AI instruction keywords
  const keywordMatches = AI_INSTRUCTION_KEYWORDS.filter(keyword =>
    match.toLowerCase().includes(keyword.toLowerCase())
  ).length

  if (keywordMatches >= 2) score += 3
  else if (keywordMatches === 1) score += 2

  // Check for strong pattern indicators
  if (match.includes('role:') && match.includes('system')) score += 2
  if (match.match(/You (are|must|should|will)/i)) score += 2
  if (match.match(/assistant|chatbot|bot|AI/i)) score += 1

  // Longer prompts are more likely to be real
  if (match.length > 200) score += 2
  else if (match.length > 100) score += 1

  // Check context for API calls or configuration
  if (context.match(/openai|anthropic|claude|gpt|completion/i)) score += 2

  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

/**
 * Extract context around a match (±200 characters)
 */
function extractContext(source: string, matchIndex: number, contextLength: number = 200): string {
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(source.length, matchIndex + contextLength)

  let context = source.substring(start, end)

  // Add ellipsis if truncated
  if (start > 0) context = '...' + context
  if (end < source.length) context = context + '...'

  return context
}

/**
 * Analyze page for exposed system prompts
 */
export async function analyzePromptExposure(page: Page): Promise<SystemPromptFinding[]> {
  const findings: SystemPromptFinding[] = []

  try {
    // Extract all script contents from the page
    const scripts = await page.evaluate(() => {
      const scriptElements = Array.from(document.querySelectorAll('script'))
      return scriptElements.map(script => ({
        content: script.textContent || '',
        src: script.src || null,
      }))
    })

    // Combine all scripts into one searchable text
    const allScripts = scripts.map(s => s.content).join('\n')

    // Also check inline scripts and event handlers
    const inlineScripts = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'))
      const inline: string[] = []

      elements.forEach(el => {
        // Check for onclick, onload, etc.
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('on')) {
            inline.push(attr.value)
          }
        })
      })

      return inline.join('\n')
    })

    const combinedSource = allScripts + '\n' + inlineScripts

    // Search for each pattern
    for (const pattern of SYSTEM_PROMPT_PATTERNS) {
      const matches = combinedSource.matchAll(pattern)

      for (const match of matches) {
        const fullMatch = match[0]
        const capturedPrompt = match[1] || fullMatch
        const matchIndex = match.index || 0

        // Extract context
        const context = extractContext(combinedSource, matchIndex, 200)

        // Check for false positives
        if (isLikelyFalsePositive(capturedPrompt, context)) {
          continue
        }

        // Calculate confidence
        const confidence = calculateConfidence(capturedPrompt, context)

        // Skip low confidence matches (too many false positives)
        if (confidence === 'low') {
          continue
        }

        // Try to identify the source file
        let sourceFile: string | null = null
        const scriptWithMatch = scripts.find(s => s.content.includes(fullMatch))
        if (scriptWithMatch && scriptWithMatch.src) {
          sourceFile = scriptWithMatch.src
        }

        // Truncate prompt for display (first 200 chars)
        const displayPrompt = capturedPrompt.length > 200
          ? capturedPrompt.substring(0, 200) + '...'
          : capturedPrompt

        findings.push({
          type: 'system_prompt_exposure',
          severity: 'critical',
          title: 'AI System Prompt Exposed in Client-Side Code',
          description: `Found AI system instructions in JavaScript code that reveal your AI's behavior and constraints. The exposed prompt is ${capturedPrompt.length} characters long.`,
          evidence: {
            prompt: displayPrompt,
            file: sourceFile,
            context: context,
            confidence: confidence,
          },
          recommendation: 'Move system prompts to server-side code. System instructions should never be visible in client-side JavaScript. Use environment variables and API endpoints to configure AI behavior on the server.',
          impact: confidence === 'high'
            ? "Your AI's instructions, business logic, and constraints are visible to anyone inspecting your website. Attackers can use this information to craft targeted prompt injection attacks that exploit known constraints and behaviors."
            : "Potential AI system prompt detected. If this is legitimate system configuration, consider moving it server-side to prevent reverse engineering of your AI's behavior.",
        })
      }
    }

    // Deduplicate findings (same prompt found multiple times)
    const uniqueFindings = findings.reduce((acc, finding) => {
      const duplicate = acc.find(f => f.evidence.prompt === finding.evidence.prompt)
      if (!duplicate) {
        acc.push(finding)
      }
      return acc
    }, [] as SystemPromptFinding[])

    return uniqueFindings

  } catch (error) {
    console.error('[AI Prompt Exposure] Analysis failed:', error)
    return [] // Return empty array on error (fail gracefully)
  }
}

/**
 * Helper: Check if a string looks like an AI system prompt
 * Can be used for additional validation
 */
export function looksLikeSystemPrompt(text: string): boolean {
  // Must be long enough
  if (text.length < 50) return false

  // Check for AI instruction patterns
  const instructionPatterns = [
    /you are (?:a|an)/i,
    /your (role|task|job) is/i,
    /you (must|should|will|cannot)/i,
    /always (respond|reply|answer)/i,
    /never (reveal|disclose|share)/i,
    /assistant|chatbot|bot|AI model/i,
  ]

  const matches = instructionPatterns.filter(pattern => pattern.test(text)).length
  return matches >= 2
}
