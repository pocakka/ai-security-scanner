/**
 * AI Embedding Vector Detection Analyzer
 *
 * Detects exposed embedding vectors in client-side JavaScript code.
 * Embedding vectors represent proprietary data and can be inverted to extract
 * original content (trade secrets, confidential documents, etc.).
 *
 * Security Risk: CRITICAL
 * Detection Method: Array pattern matching + dimension validation + entropy check
 */

import type { Page } from 'playwright'

export interface EmbeddingVectorFinding {
  type: 'embedding_vector_exposure'
  severity: 'critical'
  title: string
  description: string
  evidence: {
    vectorCount: number
    dimensions: number
    file: string | null
    sampleVector: string // First 10 values
    estimatedProvider: string
    confidence: 'high' | 'medium' | 'low'
  }
  recommendation: string
  impact: string
}

// Common embedding dimensions from major providers
const COMMON_EMBEDDING_DIMENSIONS = [
  384,  // sentence-transformers/all-MiniLM-L6-v2
  768,  // BERT-base, sentence-transformers/all-mpnet-base-v2
  1024, // OpenAI text-embedding-3-small
  1536, // OpenAI text-embedding-ada-002 (most common)
  3072, // OpenAI text-embedding-3-large
  4096, // Cohere embed-english-v3.0
]

/**
 * Patterns that match embedding vector arrays
 */
export const EMBEDDING_VECTOR_PATTERNS = [
  // Standard format: [-0.0123, 0.0456, -0.0789, ...]
  /\[[\s\n]*-?0\.\d{3,}[\s\n]*,[\s\n]*-?0\.\d{3,}[\s\n]*,[\s\n]*-?0\.\d{3,}/g,

  // Named vector variables
  /(?:embedding|vector|embeddings?)s?[\s\n]*:[\s\n]*\[[\s\n]*-?0\.\d+/gi,

  // With at least 50 consecutive float numbers
  /\[(?:\s*-?0\.\d{4,}\s*,\s*){50,}\s*-?0\.\d{4,}\s*\]/g,
]

/**
 * Check if array is a valid embedding vector
 */
export function isValidEmbeddingVector(parsed: any): {
  valid: boolean
  dimensions?: number
  provider?: string
  confidence?: 'high' | 'medium' | 'low'
} {
  try {
    // Must be an array
    if (!Array.isArray(parsed)) {
      return { valid: false }
    }

    const length = parsed.length

    // Check if length matches common embedding dimensions
    if (!COMMON_EMBEDDING_DIMENSIONS.includes(length)) {
      return { valid: false }
    }

    // All elements must be numbers
    const allNumbers = parsed.every(n => typeof n === 'number')
    if (!allNumbers) {
      return { valid: false }
    }

    // Most embedding vectors have values between -1 and 1
    // (some models normalize to -1..1, some don't)
    const valuesInRange = parsed.filter(n => n >= -2 && n <= 2).length / length
    if (valuesInRange < 0.9) {
      // More than 10% outside -2..2 range is suspicious
      return { valid: false }
    }

    // Calculate entropy - real embeddings have high entropy
    const entropy = calculateEntropy(parsed)
    if (entropy < 0.6) {
      // Low entropy = likely fake/test data
      return { valid: false }
    }

    // Estimate provider based on dimensions
    let provider = 'Unknown'
    let confidence: 'high' | 'medium' | 'low' = 'medium'

    if (length === 1536) {
      provider = 'OpenAI (text-embedding-ada-002)'
      confidence = 'high'
    } else if (length === 3072) {
      provider = 'OpenAI (text-embedding-3-large)'
      confidence = 'high'
    } else if (length === 1024) {
      provider = 'OpenAI (text-embedding-3-small)'
      confidence = 'high'
    } else if (length === 4096) {
      provider = 'Cohere'
      confidence = 'high'
    } else if (length === 768) {
      provider = 'BERT-base / Sentence Transformers'
      confidence = 'medium'
    } else if (length === 384) {
      provider = 'Sentence Transformers (MiniLM)'
      confidence = 'medium'
    }

    // Higher confidence if entropy is very high
    if (entropy > 0.85 && confidence === 'medium') {
      confidence = 'high'
    }

    return {
      valid: true,
      dimensions: length,
      provider: provider,
      confidence: confidence,
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Calculate Shannon entropy for a vector
 * High entropy = more random/realistic data
 * Low entropy = uniform/fake data
 */
function calculateEntropy(vector: number[]): number {
  // Bin values into 100 buckets (-1 to 1 range)
  const buckets = 100
  const binned = vector.map(v => {
    // Normalize to 0-1 range, then to bucket index
    const normalized = (v + 1) / 2 // -1..1 -> 0..1
    const bucket = Math.floor(normalized * (buckets - 1))
    return Math.max(0, Math.min(buckets - 1, bucket))
  })

  // Count frequencies
  const counts = new Map<number, number>()
  binned.forEach(bin => {
    counts.set(bin, (counts.get(bin) || 0) + 1)
  })

  // Calculate Shannon entropy
  let entropy = 0
  const total = vector.length

  counts.forEach(count => {
    const p = count / total
    entropy -= p * Math.log2(p)
  })

  // Normalize to 0-1 range
  const maxEntropy = Math.log2(buckets)
  return entropy / maxEntropy
}

/**
 * Calculate variance of a vector
 */
function calculateVariance(vector: number[]): number {
  const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length
  const squaredDiffs = vector.map(val => Math.pow(val - mean, 2))
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / vector.length
}

/**
 * Check if vector is likely a false positive
 */
function isLikelyFalsePositive(vector: number[], context: string): boolean {
  // Exclude test/mock data
  if (context.match(/test|mock|example|demo|fixture|sample/i)) {
    return true
  }

  // Exclude RGB color arrays (values 0-255)
  if (vector.every(n => n >= 0 && n <= 255 && Number.isInteger(n))) {
    return true
  }

  // Exclude arrays with too uniform values (dummy data)
  const variance = calculateVariance(vector)
  if (variance < 0.001) {
    return true
  }

  // Exclude arrays that are too regular (e.g., [0.1, 0.2, 0.3, ...])
  if (vector.length >= 10) {
    const diffs = []
    for (let i = 1; i < Math.min(vector.length, 20); i++) {
      diffs.push(Math.abs(vector[i] - vector[i - 1]))
    }
    const avgDiff = diffs.reduce((sum, d) => sum + d, 0) / diffs.length
    const diffVariance = calculateVariance(diffs)

    // If differences are too uniform, it's likely generated/fake
    if (diffVariance < 0.0001 && avgDiff > 0) {
      return true
    }
  }

  return false
}

/**
 * Extract context around a match
 */
function extractContext(source: string, matchIndex: number, contextLength: number = 150): string {
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(source.length, matchIndex + contextLength)

  let context = source.substring(start, end)

  if (start > 0) context = '...' + context
  if (end < source.length) context = context + '...'

  return context
}

/**
 * Analyze page for exposed embedding vectors
 */
export async function analyzeEmbeddingVectors(page: Page): Promise<EmbeddingVectorFinding[]> {
  const findings: EmbeddingVectorFinding[] = []

  try {
    // Extract all script contents
    const scripts = await page.evaluate(() => {
      const scriptElements = Array.from(document.querySelectorAll('script'))
      return scriptElements.map(script => ({
        content: script.textContent || '',
        src: script.src || null,
      }))
    })

    const allScripts = scripts.map(s => s.content).join('\n')

    // Search for potential embedding vector arrays
    for (const pattern of EMBEDDING_VECTOR_PATTERNS) {
      const matches = allScripts.matchAll(pattern)

      for (const match of matches) {
        const matchStr = match[0]
        const matchIndex = match.index || 0

        try {
          // Try to parse as JSON array
          let parsed: any
          try {
            parsed = JSON.parse(matchStr)
          } catch {
            // Try to extract just the array part
            const arrayMatch = matchStr.match(/\[[\s\S]+\]/)
            if (arrayMatch) {
              parsed = JSON.parse(arrayMatch[0])
            } else {
              continue
            }
          }

          // Validate as embedding vector
          const validation = isValidEmbeddingVector(parsed)
          if (!validation.valid) {
            continue
          }

          // Extract context
          const context = extractContext(allScripts, matchIndex, 150)

          // Check for false positives
          if (isLikelyFalsePositive(parsed, context)) {
            continue
          }

          // Try to identify source file
          let sourceFile: string | null = null
          const scriptWithMatch = scripts.find(s => s.content.includes(matchStr))
          if (scriptWithMatch && scriptWithMatch.src) {
            sourceFile = scriptWithMatch.src
          }

          // Create sample (first 10 values)
          const sampleVector = `[${parsed.slice(0, 10).map((v: number) => v.toFixed(4)).join(', ')}${parsed.length > 10 ? ', ...' : ''}]`

          // Check if we already found vectors with same dimensions from same source
          const existingFinding = findings.find(
            f => f.evidence.dimensions === validation.dimensions &&
                 f.evidence.file === sourceFile
          )

          if (existingFinding) {
            // Increment count for existing finding
            existingFinding.evidence.vectorCount++
          } else {
            // Create new finding
            findings.push({
              type: 'embedding_vector_exposure',
              severity: 'critical',
              title: 'AI Embedding Vectors Exposed in Client-Side Code',
              description: `Found ${validation.dimensions}-dimensional embedding vector(s) exposed in client-side JavaScript. These vectors represent your proprietary data in numerical form and can be inverted to extract original content.`,
              evidence: {
                vectorCount: 1,
                dimensions: validation.dimensions!,
                file: sourceFile,
                sampleVector: sampleVector,
                estimatedProvider: validation.provider!,
                confidence: validation.confidence!,
              },
              recommendation: 'URGENT: Remove embedding vectors from client-side code immediately. Vectors should only be stored in your vector database (Pinecone, Weaviate, Qdrant, etc.) and accessed via authenticated API calls on the server. Never expose vectors in JavaScript or API responses without proper authentication.',
              impact: `Your embedding vectors represent your proprietary data in numerical form. Modern inversion techniques can extract the original text from these ${validation.dimensions}-dimensional vectors, potentially exposing confidential documents, customer data, source code, or trade secrets. This is equivalent to publishing your entire RAG knowledge base publicly.`,
            })
          }
        } catch (parseError) {
          // Skip invalid arrays
          continue
        }
      }
    }

    return findings

  } catch (error) {
    console.error('[Embedding Vector Detection] Analysis failed:', error)
    return []
  }
}

/**
 * Helper: Quick check if text contains potential embedding vectors
 */
export function containsPotentialVectors(text: string): boolean {
  // Look for array patterns with many float numbers
  const pattern = /\[(?:\s*-?0\.\d{3,}\s*,\s*){30,}/
  return pattern.test(text)
}
