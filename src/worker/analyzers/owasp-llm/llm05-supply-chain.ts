/**
 * OWASP LLM05: Supply Chain Vulnerabilities Analyzer
 *
 * Detects supply chain security risks in AI/ML applications:
 * 1. Vulnerable npm packages (outdated, known CVEs)
 * 2. CDN integrity issues (missing SRI hashes)
 * 3. Untrusted model sources (HuggingFace, custom URLs)
 * 4. Dependency confusion risks
 * 5. Outdated AI libraries (transformers, langchain, openai)
 *
 * Risk Levels:
 * - CRITICAL: Known CVEs in AI libraries, compromised model sources
 * - HIGH: Missing SRI on CDN, outdated packages with security issues
 * - MEDIUM: Untrusted model sources, dependency confusion risks
 * - LOW: Minor version updates available
 *
 * Passive Detection Only:
 * - Analyzes package.json references
 * - Checks script tags for SRI attributes
 * - Detects model loading patterns
 * - Version comparison with known vulnerable versions
 */

export interface SupplyChainFinding {
  type: 'vulnerable-package' | 'missing-sri' | 'untrusted-model' | 'outdated-ai-lib' | 'dependency-confusion'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  evidence: string
  packageName?: string
  currentVersion?: string
  recommendedVersion?: string
  cveIds?: string[]
  modelSource?: string
  impact: string
  recommendation: string
}

export interface SupplyChainResult {
  findings: SupplyChainFinding[]
  hasVulnerablePackages: boolean
  hasMissingSRI: boolean
  hasUntrustedModels: boolean
  vulnerablePackages: string[]
  missingIntegrity: number
  untrustedModelSources: string[]
  overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

// Known vulnerable AI/ML package versions (examples - in production, use a CVE database)
const VULNERABLE_AI_PACKAGES: Record<string, { minVuln: string, fixed: string, cve: string, severity: 'critical' | 'high' }[]> = {
  'openai': [
    { minVuln: '0.0.0', fixed: '1.0.0', cve: 'CVE-2023-EXAMPLE', severity: 'high' },
  ],
  'langchain': [
    { minVuln: '0.0.0', fixed: '0.1.0', cve: 'CVE-2023-LANGCHAIN', severity: 'high' },
  ],
  '@huggingface/transformers': [
    { minVuln: '0.0.0', fixed: '2.0.0', cve: 'CVE-2024-HF', severity: 'critical' },
  ],
  'transformers': [
    { minVuln: '0.0.0', fixed: '4.30.0', cve: 'CVE-2023-TRANSFORMERS', severity: 'high' },
  ],
  'tensorflow': [
    { minVuln: '0.0.0', fixed: '2.12.0', cve: 'CVE-2023-TF', severity: 'critical' },
  ],
  'pytorch': [
    { minVuln: '0.0.0', fixed: '2.0.0', cve: 'CVE-2023-TORCH', severity: 'high' },
  ],
}

// CDN patterns to check for integrity
const CDN_PATTERNS = [
  /https?:\/\/cdn\.jsdelivr\.net\/[^\s"']*/gi,
  /https?:\/\/unpkg\.com\/[^\s"']*/gi,
  /https?:\/\/cdnjs\.cloudflare\.com\/[^\s"']*/gi,
  /https?:\/\/cdn\.skypack\.dev\/[^\s"']*/gi,
  /https?:\/\/esm\.sh\/[^\s"']*/gi,
]

// Untrusted or risky model sources
const MODEL_SOURCE_PATTERNS = [
  { pattern: /huggingface\.co\/([^\/]+)\/([^\/\s"']+)/gi, name: 'HuggingFace', risk: 'medium' },
  { pattern: /models\.openai\.com\/([^\s"']+)/gi, name: 'OpenAI Models', risk: 'low' },
  { pattern: /storage\.googleapis\.com\/([^\s"']+\.(?:bin|onnx|pt|h5|pb))/gi, name: 'Google Cloud Storage', risk: 'medium' },
  { pattern: /s3\.amazonaws\.com\/([^\s"']+\.(?:bin|onnx|pt|h5|pb))/gi, name: 'AWS S3', risk: 'medium' },
  { pattern: /blob\.core\.windows\.net\/([^\s"']+\.(?:bin|onnx|pt|h5|pb))/gi, name: 'Azure Blob', risk: 'medium' },
  { pattern: /(?:https?:)?\/\/[^\/\s"']+\/([^\s"']+\.(?:bin|onnx|pt|h5|pb))/gi, name: 'Custom URL', risk: 'high' },
]

// AI/ML library version patterns
const AI_LIBRARY_PATTERNS = [
  { name: 'openai', pattern: /openai[@\/]?([\d.]+)/i, npmPackage: 'openai' },
  { name: 'langchain', pattern: /langchain[@\/]?([\d.]+)/i, npmPackage: 'langchain' },
  { name: '@langchain/core', pattern: /@langchain\/core[@\/]?([\d.]+)/i, npmPackage: '@langchain/core' },
  { name: 'transformers.js', pattern: /@xenova\/transformers[@\/]?([\d.]+)/i, npmPackage: '@xenova/transformers' },
  { name: 'tensorflow.js', pattern: /@tensorflow\/tfjs[@\/]?([\d.]+)/i, npmPackage: '@tensorflow/tfjs' },
  { name: 'ml5.js', pattern: /ml5[@\/]?([\d.]+)/i, npmPackage: 'ml5' },
  { name: 'brain.js', pattern: /brain\.js[@\/]?([\d.]+)/i, npmPackage: 'brain.js' },
]

// Dependency confusion risk patterns (internal package names that could be confused)
const INTERNAL_PACKAGE_PATTERNS = [
  /@company\//i,
  /@internal\//i,
  /@private\//i,
  /company-/i,
  /internal-/i,
]

export async function analyzeLLM05SupplyChain(
  html: string,
  headers: Record<string, string>
): Promise<SupplyChainResult> {
  const findings: SupplyChainFinding[] = []
  const vulnerablePackages: string[] = []
  const untrustedModelSources: string[] = []
  let missingIntegrity = 0

  // 1. Check for vulnerable AI/ML packages in script tags or inline code
  for (const [packageName, vulnerabilities] of Object.entries(VULNERABLE_AI_PACKAGES)) {
    for (const vuln of vulnerabilities) {
      const packagePattern = new RegExp(`${packageName.replace('/', '\\/')}[@\/]?([\\d.]+)`, 'gi')
      let match
      while ((match = packagePattern.exec(html)) !== null) {
        const detectedVersion = match[1]

        // Simple version comparison (in production, use semver library)
        if (isVersionVulnerable(detectedVersion, vuln.minVuln, vuln.fixed)) {
          vulnerablePackages.push(`${packageName}@${detectedVersion}`)

          findings.push({
            type: 'vulnerable-package',
            severity: vuln.severity,
            title: `Vulnerable AI Library: ${packageName}@${detectedVersion}`,
            description: `Detected vulnerable version of ${packageName} (${detectedVersion}). This package has known security vulnerabilities tracked as ${vuln.cve}.`,
            evidence: match[0],
            packageName,
            currentVersion: detectedVersion,
            recommendedVersion: vuln.fixed,
            cveIds: [vuln.cve],
            impact: vuln.severity === 'critical'
              ? `Critical vulnerability in AI library ${packageName} could allow attackers to execute arbitrary code, manipulate AI models, or exfiltrate training data. Immediate upgrade required.`
              : `Known security vulnerability in ${packageName} could be exploited to compromise AI functionality, leak model weights, or inject malicious prompts.`,
            recommendation: `Upgrade ${packageName} from ${detectedVersion} to ${vuln.fixed} or later. Review security advisories: https://github.com/advisories?query=${packageName}`,
          })
        }
      }
    }
  }

  // 2. Check for outdated AI libraries (even without known CVEs)
  for (const library of AI_LIBRARY_PATTERNS) {
    let match
    while ((match = library.pattern.exec(html)) !== null) {
      const detectedVersion = match[1]

      // Check if version is outdated (simplified - in production, check against npm registry)
      if (isVersionOutdated(detectedVersion, library.name)) {
        findings.push({
          type: 'outdated-ai-lib',
          severity: 'medium',
          title: `Outdated AI Library: ${library.name}@${detectedVersion}`,
          description: `Detected outdated version of ${library.name} (${detectedVersion}). Newer versions may include security patches, performance improvements, and bug fixes.`,
          evidence: match[0],
          packageName: library.npmPackage,
          currentVersion: detectedVersion,
          impact: `Using outdated AI libraries increases the risk of unpatched vulnerabilities, compatibility issues with AI models, and potential security exploits in model inference or training pipelines.`,
          recommendation: `Update ${library.name} to the latest stable version. Check npm for updates: npm outdated ${library.npmPackage}`,
        })
      }
    }
  }

  // 3. Check for missing Subresource Integrity (SRI) on CDN scripts
  const scriptTags = html.match(/<script[^>]*>/gi) || []

  for (const scriptTag of scriptTags) {
    // Check if it's a CDN URL
    let isCDN = false
    let cdnUrl = ''

    for (const cdnPattern of CDN_PATTERNS) {
      const cdnMatch = scriptTag.match(cdnPattern)
      if (cdnMatch) {
        isCDN = true
        cdnUrl = cdnMatch[0]
        break
      }
    }

    if (isCDN) {
      // Check if integrity attribute is present
      const hasIntegrity = /integrity\s*=\s*["'][^"']+["']/i.test(scriptTag)

      if (!hasIntegrity) {
        missingIntegrity++

        findings.push({
          type: 'missing-sri',
          severity: 'high',
          title: `Missing Subresource Integrity on CDN Script`,
          description: `CDN script loaded without Subresource Integrity (SRI) hash. If the CDN is compromised, malicious code could be injected into your AI application.`,
          evidence: scriptTag,
          impact: `Without SRI, a compromised CDN could serve malicious JavaScript that manipulates AI prompts, steals API keys, exfiltrates user data, or injects backdoors into AI model interactions.`,
          recommendation: `Add integrity and crossorigin attributes to all CDN script tags. Generate SRI hashes using: https://www.srihash.org/ or use npm packages with built-in SRI support.`,
        })
      }
    }
  }

  // 4. Detect untrusted model sources
  for (const modelSource of MODEL_SOURCE_PATTERNS) {
    let match
    modelSource.pattern.lastIndex = 0 // Reset regex

    while ((match = modelSource.pattern.exec(html)) !== null) {
      const fullMatch = match[0]
      untrustedModelSources.push(fullMatch)

      const severity = modelSource.risk === 'high' ? 'high' : modelSource.risk === 'medium' ? 'medium' : 'low'

      findings.push({
        type: 'untrusted-model',
        severity,
        title: `AI Model from ${modelSource.name}`,
        description: `Detected AI model loading from ${modelSource.name}. Third-party models may contain backdoors, poisoned data, or unverified weights.`,
        evidence: fullMatch,
        modelSource: modelSource.name,
        impact: severity === 'high'
          ? `Loading models from untrusted custom URLs is extremely risky. Malicious models can contain backdoors, data exfiltration logic, or poisoned weights that manipulate AI outputs to favor attackers.`
          : `Third-party model sources like ${modelSource.name} may not have the same security guarantees as official sources. Models could be tampered with or contain unintended biases.`,
        recommendation: severity === 'high'
          ? `Only load models from trusted, verified sources. Host models on your own infrastructure with integrity verification. Use model signing and checksum validation.`
          : `Verify model checksums/hashes before loading. Use official model repositories with security reviews. Consider hosting models internally for production use.`,
      })
    }
  }

  // 5. Check for dependency confusion risks
  const packageJsonMatches = html.match(/["'](@[^"'\/]+\/[^"']+|[a-z][-a-z0-9]*?)["']\s*:\s*["'][\d.^~*]+["']/gi) || []

  for (const pkgMatch of packageJsonMatches) {
    for (const internalPattern of INTERNAL_PACKAGE_PATTERNS) {
      if (internalPattern.test(pkgMatch)) {
        findings.push({
          type: 'dependency-confusion',
          severity: 'medium',
          title: `Potential Dependency Confusion Risk`,
          description: `Detected internal/private package naming pattern that could be vulnerable to dependency confusion attacks. Attackers could publish malicious packages with the same name to public registries.`,
          evidence: pkgMatch,
          impact: `Dependency confusion attacks exploit private package names by publishing malicious packages with identical names to public npm. If your package manager isn't configured correctly, it could install the malicious public package instead of your private one, leading to supply chain compromise.`,
          recommendation: `Use npm scoped packages (@yourcompany/package), configure .npmrc to only use your private registry for internal packages, and implement package verification. Use "npm audit signatures" to verify package authenticity.`,
        })
        break
      }
    }
  }

  // Calculate overall risk
  const hasVulnerablePackages = vulnerablePackages.length > 0
  const hasMissingSRI = missingIntegrity > 0
  const hasUntrustedModels = untrustedModelSources.length > 0

  let overallRisk: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'

  if (findings.some(f => f.severity === 'critical')) {
    overallRisk = 'critical'
  } else if (findings.some(f => f.severity === 'high') || hasVulnerablePackages) {
    overallRisk = 'high'
  } else if (findings.some(f => f.severity === 'medium') || hasUntrustedModels) {
    overallRisk = 'medium'
  } else if (findings.length > 0) {
    overallRisk = 'low'
  }

  return {
    findings,
    hasVulnerablePackages,
    hasMissingSRI,
    hasUntrustedModels,
    vulnerablePackages,
    missingIntegrity,
    untrustedModelSources,
    overallRisk,
  }
}

// Helper: Check if version is vulnerable (simplified comparison)
function isVersionVulnerable(current: string, minVuln: string, fixed: string): boolean {
  // In production, use semver library for proper version comparison
  const currentParts = current.split('.').map(Number)
  const fixedParts = fixed.split('.').map(Number)

  for (let i = 0; i < Math.max(currentParts.length, fixedParts.length); i++) {
    const curr = currentParts[i] || 0
    const fix = fixedParts[i] || 0

    if (curr < fix) return true
    if (curr > fix) return false
  }

  return false // Same version = not vulnerable
}

// Helper: Check if version is outdated (simplified)
function isVersionOutdated(version: string, libraryName: string): boolean {
  // Simplified logic - in production, query npm registry for latest version
  const versionNum = parseFloat(version.split('.')[0] + '.' + version.split('.')[1])

  const latestVersions: Record<string, number> = {
    'openai': 4.0,
    'langchain': 0.2,
    '@langchain/core': 0.2,
    'transformers.js': 2.5,
    'tensorflow.js': 4.0,
    'ml5.js': 1.0,
    'brain.js': 2.0,
  }

  const latest = latestVersions[libraryName]
  if (!latest) return false

  // Consider outdated if more than 1 major version behind
  return versionNum < (latest - 1.0)
}
