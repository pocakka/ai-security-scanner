interface LeadEmailData {
  leadName: string
  leadEmail: string
  scanUrl: string
  domain: string
  riskScore: number
  riskLevel: string
  grade: string
  criticalIssues: number
  highIssues: number
}

export function generateLeadEmail(data: LeadEmailData): {
  subject: string
  html: string
  text: string
} {
  const subject = `Your AI Security Scan Results for ${data.domain}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Security Scan Results</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🛡️ AI Security Scanner
              </h1>
              <p style="margin: 10px 0 0; color: #dbeafe; font-size: 16px;">
                Your Security Scan is Complete
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 20px;">
              <p style="margin: 0; font-size: 16px; color: #1e293b;">
                Hi <strong>${data.leadName}</strong>,
              </p>
              <p style="margin: 15px 0 0; font-size: 16px; color: #475569; line-height: 1.6;">
                Thank you for using AI Security Scanner! We've completed the security analysis of your website.
              </p>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; padding: 30px;">
                <tr>
                  <td align="center">
                    <h2 style="margin: 0; font-size: 18px; color: #64748b; font-weight: 600;">
                      Security Score
                    </h2>
                    <div style="margin: 15px 0; font-size: 56px; font-weight: 700; color: ${getScoreColor(data.riskScore)};">
                      ${data.riskScore}/100
                    </div>
                    <div style="display: inline-block; padding: 8px 16px; background-color: ${getRiskBadgeColor(data.riskLevel)}; border-radius: 20px; font-size: 14px; font-weight: 600; color: #ffffff;">
                      ${data.riskLevel} RISK
                    </div>
                    <div style="margin-top: 10px; font-size: 24px; color: #475569; font-weight: 600;">
                      Grade: ${data.grade}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Issues Summary -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px; font-size: 18px; color: #1e293b; font-weight: 600;">
                Issues Found:
              </h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 6px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;">Severity</td>
                  <td style="padding: 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0;" align="right">Count</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #ef4444; border-bottom: 1px solid #e2e8f0;">Critical</td>
                  <td style="padding: 10px 12px; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0;" align="right">${data.criticalIssues}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #f97316; border-bottom: 1px solid #e2e8f0;">High</td>
                  <td style="padding: 10px 12px; color: #1e293b; font-weight: 600; border-bottom: 1px solid #e2e8f0;" align="right">${data.highIssues}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #eab308;">Medium</td>
                  <td style="padding: 10px 12px; color: #1e293b; font-weight: 600;" align="right">...</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); border-radius: 8px; padding: 30px; text-align: center;">
                <h3 style="margin: 0 0 10px; color: #ffffff; font-size: 20px; font-weight: 700;">
                  Want a Deeper Security Audit?
                </h3>
                <p style="margin: 0 0 20px; color: #dbeafe; font-size: 14px; line-height: 1.6;">
                  This automated scan provides valuable insights, but cannot detect all AI-specific vulnerabilities like prompt injection, jailbreaking, or data leakage.
                </p>
                <a href="mailto:security@aisecurityscanner.com?subject=Manual%20Audit%20Request"
                   style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #3b82f6; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                  Request Manual Audit ($2,000+)
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Scanned URL: <a href="${data.scanUrl}" style="color: #3b82f6; text-decoration: none;">${data.domain}</a>
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #94a3b8;">
                © 2025 AI Security Scanner. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
AI Security Scanner - Scan Results

Hi ${data.leadName},

Thank you for using AI Security Scanner! We've completed the security analysis of your website.

SECURITY SCORE: ${data.riskScore}/100
Grade: ${data.grade}
Risk Level: ${data.riskLevel}

ISSUES FOUND:
- Critical: ${data.criticalIssues}
- High: ${data.highIssues}

Scanned URL: ${data.scanUrl}

---

Want a Deeper Security Audit?

This automated scan provides valuable insights, but cannot detect all AI-specific vulnerabilities like prompt injection, jailbreaking, or data leakage.

Request a manual audit: security@aisecurityscanner.com

© 2025 AI Security Scanner
  `

  return { subject, html, text }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e' // Green
  if (score >= 60) return '#eab308' // Yellow
  if (score >= 40) return '#f97316' // Orange
  return '#ef4444' // Red
}

function getRiskBadgeColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return '#22c55e'
    case 'MEDIUM':
      return '#eab308'
    case 'HIGH':
      return '#f97316'
    case 'CRITICAL':
      return '#ef4444'
    default:
      return '#64748b'
  }
}
