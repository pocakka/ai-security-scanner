import fs from 'fs'
import path from 'path'
import { generateLeadEmail } from './email-templates'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  // LOCALHOST MODE: Save email to file system instead of sending
  const emailsDir = path.join(process.cwd(), 'emails')

  // Ensure emails directory exists
  if (!fs.existsSync(emailsDir)) {
    fs.mkdirSync(emailsDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${timestamp}_${params.to.replace(/[^a-zA-Z0-9]/g, '_')}`

  // Save HTML version
  const htmlPath = path.join(emailsDir, `${filename}.html`)
  fs.writeFileSync(htmlPath, params.html)

  // Save text version
  const textPath = path.join(emailsDir, `${filename}.txt`)
  const emailContent = `
To: ${params.to}
Subject: ${params.subject}

${params.text}
  `
  fs.writeFileSync(textPath, emailContent)

  console.log(`📧 [EMAIL SIMULATION] Email saved to file system:`)
  console.log(`   To: ${params.to}`)
  console.log(`   Subject: ${params.subject}`)
  console.log(`   HTML: ${htmlPath}`)
  console.log(`   Text: ${textPath}`)

  return true
}

export async function sendLeadCaptureEmail(data: {
  leadName: string
  leadEmail: string
  scanId: string
  scanUrl: string
  domain: string
  riskScore: number
  riskLevel: string
  grade: string
  criticalIssues: number
  highIssues: number
}): Promise<boolean> {
  const email = generateLeadEmail(data)

  return sendEmail({
    to: data.leadEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
}
