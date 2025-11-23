/**
 * MFA/2FA Detection Analyzer
 *
 * Detects Multi-Factor Authentication (MFA) and Two-Factor Authentication (2FA)
 * implementations on websites.
 *
 * Supported MFA Methods:
 * - OAuth 2.0 (Google, Facebook, GitHub, Microsoft, Apple)
 * - SAML (Enterprise SSO)
 * - WebAuthn / FIDO2 (Hardware keys, biometrics)
 * - TOTP (Time-based One-Time Passwords - Google Authenticator, Authy)
 * - SMS-based 2FA
 * - Email-based 2FA
 * - Backup codes
 * - Push notifications (Duo, Okta Verify)
 *
 * ALL CHECKS ARE PASSIVE - analyzing HTML and JavaScript only
 *
 * Nov 17, 2025: Reduced false positives from documentation/tutorial content (40% FP → <10%)
 */

interface MFAMethod {
  type: string
  provider?: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
}

interface MFAFinding {
  type: string
  severity: 'info' | 'low' | 'medium' | 'high'
  title: string
  category: string
  method?: string
  provider?: string
  confidence?: string
  evidence?: string
  recommendation?: string
  impact?: string
}

export interface MFAResult {
  findings: MFAFinding[]
  detectedMethods: MFAMethod[]
  hasMFA: boolean
  hasOAuth: boolean
  hasSAML: boolean
  hasWebAuthn: boolean
  hasTOTP: boolean
  recommendedMethods: string[]
}

/**
 * Clean HTML to remove documentation, articles, code examples
 * Nov 17, 2025: Reduces false positives from tutorial/blog content
 */
function cleanHTMLForMFADetection(html: string): string {
  return html
    // Remove code blocks (contain examples, not implementations)
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '')

    // Remove article/blog content
    .replace(/<article\b[^>]*>[\s\S]*?<\/article>/gi, '')

    // Remove FAQ/help sections (common false positive sources)
    .replace(/<div[^>]*class="[^"]*(?:faq|help|docs|guide|tutorial|blog)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')

    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')

    // Remove JavaScript comments
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Check if page has login/authentication functionality
 * Nov 17, 2025: Only flag "No MFA" on pages that actually have login
 */
function hasLoginFunctionality(html: string): boolean {
  const lowerHTML = html.toLowerCase()

  // Check for password input fields
  const hasPasswordInput = html.match(/<input[^>]*type="password"/i)

  // Check for login-related text
  const hasLoginText =
    lowerHTML.includes('log in') ||
    lowerHTML.includes('sign in') ||
    lowerHTML.includes('login') ||
    lowerHTML.includes('signin')

  // Check for auth forms
  const hasAuthForm = html.match(/<form[^>]*(?:login|signin|auth)/i)

  return !!(hasPasswordInput || hasAuthForm || hasLoginText)
}

export async function analyzeMFADetection(html: string): Promise<MFAResult> {
  const findings: MFAFinding[] = []
  const detectedMethods: MFAMethod[] = []

  // Nov 17, 2025: Clean HTML to remove documentation/tutorial content
  const cleanHTML = cleanHTMLForMFADetection(html)
  const lowerHTML = cleanHTML.toLowerCase()

  // Check for OAuth providers (using cleaned HTML)
  const oauth = detectOAuth(cleanHTML, lowerHTML)
  if (oauth.length > 0) {
    detectedMethods.push(...oauth)
    oauth.forEach(method => {
      findings.push({
        type: 'mfa-oauth',
        severity: 'info',
        title: `OAuth 2.0 Authentication: ${method.provider}`,
        category: 'mfa',
        method: 'OAuth 2.0',
        provider: method.provider,
        confidence: method.confidence,
        evidence: method.evidence.join(', '),
      })
    })
  }

  // Check for SAML (using cleaned HTML)
  const saml = detectSAML(cleanHTML, lowerHTML)
  if (saml) {
    detectedMethods.push(saml)
    findings.push({
      type: 'mfa-saml',
      severity: 'info',
      title: 'SAML SSO Detected',
      category: 'mfa',
      method: 'SAML',
      confidence: saml.confidence,
      evidence: saml.evidence.join(', '),
    })
  }

  // Check for WebAuthn/FIDO2 (using cleaned HTML)
  const webauthn = detectWebAuthn(cleanHTML, lowerHTML)
  if (webauthn) {
    detectedMethods.push(webauthn)
    findings.push({
      type: 'mfa-webauthn',
      severity: 'info',
      title: 'WebAuthn/FIDO2 Support Detected',
      category: 'mfa',
      method: 'WebAuthn',
      confidence: webauthn.confidence,
      evidence: webauthn.evidence.join(', '),
    })
  }

  // Check for TOTP (using cleaned HTML)
  const totp = detectTOTP(cleanHTML, lowerHTML)
  if (totp) {
    detectedMethods.push(totp)
    findings.push({
      type: 'mfa-totp',
      severity: 'info',
      title: 'TOTP 2FA Detected',
      category: 'mfa',
      method: 'TOTP',
      confidence: totp.confidence,
      evidence: totp.evidence.join(', '),
    })
  }

  // Check for SMS 2FA (using cleaned HTML)
  const sms = detectSMS2FA(cleanHTML, lowerHTML)
  if (sms) {
    detectedMethods.push(sms)
    findings.push({
      type: 'mfa-sms',
      severity: 'low',
      title: 'SMS-based 2FA Detected',
      category: 'mfa',
      method: 'SMS',
      confidence: sms.confidence,
      evidence: sms.evidence.join(', '),
      recommendation: 'Consider upgrading to more secure methods like TOTP or WebAuthn',
    })
  }

  // Check for Email 2FA (using cleaned HTML)
  const email = detectEmail2FA(cleanHTML, lowerHTML)
  if (email) {
    detectedMethods.push(email)
    findings.push({
      type: 'mfa-email',
      severity: 'low',
      title: 'Email-based 2FA Detected',
      category: 'mfa',
      method: 'Email',
      confidence: email.confidence,
      evidence: email.evidence.join(', '),
      recommendation: 'Email 2FA is less secure than app-based methods',
    })
  }

  // Check for Push notifications (using cleaned HTML)
  const push = detectPushNotification(cleanHTML, lowerHTML)
  if (push.length > 0) {
    detectedMethods.push(...push)
    push.forEach(method => {
      findings.push({
        type: 'mfa-push',
        severity: 'info',
        title: `Push Notification 2FA: ${method.provider}`,
        category: 'mfa',
        method: 'Push Notification',
        provider: method.provider,
        confidence: method.confidence,
        evidence: method.evidence.join(', '),
      })
    })
  }

  // Check for Backup codes (using cleaned HTML)
  const backupCodes = detectBackupCodes(cleanHTML, lowerHTML)
  if (backupCodes) {
    detectedMethods.push(backupCodes)
    findings.push({
      type: 'mfa-backup-codes',
      severity: 'info',
      title: 'Backup Codes Supported',
      category: 'mfa',
      method: 'Backup Codes',
      confidence: backupCodes.confidence,
      evidence: backupCodes.evidence.join(', '),
    })
  }

  // Nov 17, 2025: Only flag "No MFA" if page has login functionality
  if (detectedMethods.length === 0 && hasLoginFunctionality(html)) {
    findings.push({
      type: 'mfa-not-detected',
      severity: 'medium',
      title: 'No Multi-Factor Authentication Detected',
      category: 'mfa',
      impact: 'Account takeover risk - passwords alone are not sufficient security',
      recommendation: 'Implement MFA using TOTP, WebAuthn, or OAuth to protect user accounts',
    })
  }

  // Recommend additional methods
  const recommended: string[] = []
  const hasOAuth = detectedMethods.some(m => m.type === 'oauth')
  const hasSAML = detectedMethods.some(m => m.type === 'saml')
  const hasWebAuthn = detectedMethods.some(m => m.type === 'webauthn')
  const hasTOTP = detectedMethods.some(m => m.type === 'totp')

  if (!hasWebAuthn) {
    recommended.push('WebAuthn/FIDO2 (hardware keys, biometrics)')
  }
  if (!hasTOTP) {
    recommended.push('TOTP (Google Authenticator, Authy)')
  }
  if (!hasOAuth) {
    recommended.push('OAuth 2.0 (Google, Microsoft, GitHub)')
  }

  if (recommended.length > 0 && detectedMethods.length > 0) {
    findings.push({
      type: 'mfa-recommendations',
      severity: 'info',
      title: 'Additional MFA Methods Recommended',
      category: 'mfa',
      recommendation: `Consider adding: ${recommended.join(', ')}`,
    })
  }

  return {
    findings,
    detectedMethods,
    hasMFA: detectedMethods.length > 0,
    hasOAuth,
    hasSAML,
    hasWebAuthn,
    hasTOTP,
    recommendedMethods: recommended,
  }
}

/**
 * OAuth 2.0 Detection
 */
function detectOAuth(html: string, lowerHTML: string): MFAMethod[] {
  const methods: MFAMethod[] = []

  const providers = [
    { name: 'Google', patterns: ['accounts.google.com', 'google oauth', 'sign in with google', 'gsi_client'] },
    { name: 'Facebook', patterns: ['facebook.com/login', 'facebook oauth', 'sign in with facebook', 'fb:login'] },
    { name: 'GitHub', patterns: ['github.com/login/oauth', 'sign in with github', 'github oauth'] },
    { name: 'Microsoft', patterns: ['login.microsoftonline.com', 'microsoft oauth', 'sign in with microsoft'] },
    { name: 'Apple', patterns: ['appleid.apple.com', 'sign in with apple', 'apple oauth'] },
    { name: 'Twitter', patterns: ['twitter.com/oauth', 'sign in with twitter', 'twitter oauth'] },
    { name: 'LinkedIn', patterns: ['linkedin.com/oauth', 'sign in with linkedin'] },
  ]

  for (const provider of providers) {
    const evidence: string[] = []
    let found = false

    for (const pattern of provider.patterns) {
      if (lowerHTML.includes(pattern)) {
        evidence.push(`"${pattern}" found`)
        found = true
      }
    }

    if (found) {
      methods.push({
        type: 'oauth',
        provider: provider.name,
        confidence: evidence.length >= 2 ? 'high' : 'medium',
        evidence,
      })
    }
  }

  return methods
}

/**
 * SAML Detection
 */
function detectSAML(html: string, lowerHTML: string): MFAMethod | null {
  const evidence: string[] = []

  const patterns = [
    'saml',
    'sso login',
    'single sign-on',
    'samlrequest',
    'samlresponse',
    'assertion consumer service',
    'idp',
    'identity provider',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      evidence.push(`"${pattern}" found`)
    }
  }

  if (evidence.length === 0) return null

  return {
    type: 'saml',
    confidence: evidence.length >= 3 ? 'high' : evidence.length >= 2 ? 'medium' : 'low',
    evidence,
  }
}

/**
 * WebAuthn/FIDO2 Detection
 */
function detectWebAuthn(html: string, lowerHTML: string): MFAMethod | null {
  const evidence: string[] = []

  // JavaScript API usage
  if (html.includes('navigator.credentials.create') || html.includes('navigator.credentials.get')) {
    evidence.push('WebAuthn API usage detected')
  }

  // Text mentions
  const patterns = [
    'webauthn',
    'fido2',
    'fido',
    'security key',
    'yubikey',
    'hardware key',
    'biometric',
    'fingerprint',
    'face id',
    'touch id',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      evidence.push(`"${pattern}" found`)
    }
  }

  if (evidence.length === 0) return null

  return {
    type: 'webauthn',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}

/**
 * TOTP Detection
 */
function detectTOTP(html: string, lowerHTML: string): MFAMethod | null {
  const evidence: string[] = []

  const patterns = [
    'authenticator app',
    'google authenticator',
    'authy',
    'totp',
    'time-based',
    'verification code',
    '6-digit code',
    'six digit code',
    'authenticator code',
    'qr code',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      evidence.push(`"${pattern}" found`)
    }
  }

  if (evidence.length === 0) return null

  return {
    type: 'totp',
    confidence: evidence.length >= 3 ? 'high' : evidence.length >= 2 ? 'medium' : 'low',
    evidence,
  }
}

/**
 * SMS 2FA Detection
 */
function detectSMS2FA(html: string, lowerHTML: string): MFAMethod | null {
  const evidence: string[] = []

  const patterns = [
    'sms code',
    'text message',
    'phone verification',
    'mobile verification',
    'sms verification',
    'text verification',
    'phone number',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      evidence.push(`"${pattern}" found`)
    }
  }

  // Need at least 2 patterns to avoid false positives
  if (evidence.length < 2) return null

  return {
    type: 'sms',
    confidence: evidence.length >= 3 ? 'medium' : 'low',
    evidence,
  }
}

/**
 * Email 2FA Detection
 */
function detectEmail2FA(html: string, lowerHTML: string): MFAMethod | null {
  const evidence: string[] = []

  const patterns = [
    'email code',
    'email verification',
    'verification link',
    'confirm email',
    'email confirmation',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      evidence.push(`"${pattern}" found`)
    }
  }

  if (evidence.length < 2) return null

  return {
    type: 'email',
    confidence: evidence.length >= 3 ? 'medium' : 'low',
    evidence,
  }
}

/**
 * Push Notification Detection
 */
function detectPushNotification(html: string, lowerHTML: string): MFAMethod[] {
  const methods: MFAMethod[] = []

  const providers = [
    { name: 'Duo Security', patterns: ['duo', 'duo security', 'duo push'] },
    { name: 'Okta Verify', patterns: ['okta verify', 'okta push'] },
    { name: 'Microsoft Authenticator', patterns: ['microsoft authenticator', 'ms authenticator'] },
    { name: 'Auth0', patterns: ['auth0', 'guardian'] },
  ]

  for (const provider of providers) {
    const evidence: string[] = []
    let found = false

    for (const pattern of provider.patterns) {
      if (lowerHTML.includes(pattern)) {
        evidence.push(`"${pattern}" found`)
        found = true
      }
    }

    if (found) {
      methods.push({
        type: 'push',
        provider: provider.name,
        confidence: evidence.length >= 2 ? 'high' : 'medium',
        evidence,
      })
    }
  }

  return methods
}

/**
 * Backup Codes Detection
 */
function detectBackupCodes(html: string, lowerHTML: string): MFAMethod | null {
  const evidence: string[] = []

  const patterns = [
    'backup code',
    'recovery code',
    'backup codes',
    'recovery codes',
    'emergency code',
  ]

  for (const pattern of patterns) {
    if (lowerHTML.includes(pattern)) {
      evidence.push(`"${pattern}" found`)
    }
  }

  if (evidence.length === 0) return null

  return {
    type: 'backup-codes',
    confidence: evidence.length >= 2 ? 'high' : 'medium',
    evidence,
  }
}
