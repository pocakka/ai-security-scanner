#!/usr/bin/env tsx

/**
 * Migrate data from SQLite to PostgreSQL
 *
 * Usage:
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts
 *
 * This script:
 * 1. Reads all data from SQLite (dev.db.backup)
 * 2. Transforms JSON strings to objects
 * 3. Writes to PostgreSQL
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { Database } from 'better-sqlite3'

// PostgreSQL client (current DATABASE_URL)
const postgres = new PrismaClient()

// SQLite path
const sqlitePath = './prisma/dev.db.backup-20251117-204020'

async function migrate() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...\n')

  try {
    // Import better-sqlite3 dynamically
    const sqlite3 = await import('better-sqlite3')
    const sqlite = sqlite3.default(sqlitePath)

    console.log('📦 Connected to SQLite database')
    console.log('📦 Connected to PostgreSQL database\n')

    // ========================================
    // MIGRATE SCANS
    // ========================================
    console.log('📊 Migrating Scans...')
    const scans = sqlite.prepare('SELECT * FROM Scan').all() as any[]
    console.log(`   Found ${scans.length} scans`)

    let scanCount = 0
    for (const scan of scans) {
      await postgres.scan.create({
        data: {
          id: scan.id,
          url: scan.url,
          domain: scan.domain,
          status: scan.status,
          riskScore: scan.riskScore,
          riskLevel: scan.riskLevel,
          // Parse JSON strings to objects
          detectedTech: scan.detectedTech ? JSON.parse(scan.detectedTech) : null,
          findings: scan.findings ? JSON.parse(scan.findings) : null,
          metadata: scan.metadata ? JSON.parse(scan.metadata) : null,
          createdAt: new Date(scan.createdAt),
          startedAt: scan.startedAt ? new Date(scan.startedAt) : null,
          completedAt: scan.completedAt ? new Date(scan.completedAt) : null,
        }
      })
      scanCount++
      if (scanCount % 10 === 0) {
        process.stdout.write(`\r   Migrated ${scanCount}/${scans.length} scans...`)
      }
    }
    console.log(`\r   ✅ Migrated ${scanCount} scans\n`)

    // ========================================
    // MIGRATE LEADS
    // ========================================
    console.log('📧 Migrating Leads...')
    const leads = sqlite.prepare('SELECT * FROM Lead').all() as any[]
    console.log(`   Found ${leads.length} leads`)

    let leadCount = 0
    for (const lead of leads) {
      await postgres.lead.create({
        data: {
          id: lead.id,
          email: lead.email,
          name: lead.name,
          company: lead.company,
          role: lead.role,
          leadScore: lead.leadScore,
          lifecycleStage: lead.lifecycleStage,
          source: lead.source,
          scanId: lead.scanId,
          createdAt: new Date(lead.createdAt),
          lastInteraction: new Date(lead.lastInteraction),
        }
      })
      leadCount++
    }
    console.log(`   ✅ Migrated ${leadCount} leads\n`)

    // ========================================
    // MIGRATE JOBS
    // ========================================
    console.log('💼 Migrating Jobs...')
    const jobs = sqlite.prepare('SELECT * FROM Job').all() as any[]
    console.log(`   Found ${jobs.length} jobs`)

    let jobCount = 0
    for (const job of jobs) {
      await postgres.job.create({
        data: {
          id: job.id,
          type: job.type,
          data: job.data,
          status: job.status,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          error: job.error,
          createdAt: new Date(job.createdAt),
          startedAt: job.startedAt ? new Date(job.startedAt) : null,
          completedAt: job.completedAt ? new Date(job.completedAt) : null,
        }
      })
      jobCount++
    }
    console.log(`   ✅ Migrated ${jobCount} jobs\n`)

    // ========================================
    // MIGRATE AI TRUST SCORECARDS
    // ========================================
    console.log('🤖 Migrating AI Trust Scorecards...')
    const scorecards = sqlite.prepare('SELECT * FROM AiTrustScorecard').all() as any[]
    console.log(`   Found ${scorecards.length} scorecards`)

    let scorecardCount = 0
    for (const card of scorecards) {
      await postgres.aiTrustScorecard.create({
        data: {
          id: card.id,
          scanId: card.scanId,
          // Transparency
          isProviderDisclosed: Boolean(card.isProviderDisclosed),
          isIdentityDisclosed: Boolean(card.isIdentityDisclosed),
          isAiPolicyLinked: Boolean(card.isAiPolicyLinked),
          isModelVersionDisclosed: Boolean(card.isModelVersionDisclosed),
          isLimitationsDisclosed: Boolean(card.isLimitationsDisclosed),
          hasDataUsageDisclosure: Boolean(card.hasDataUsageDisclosure),
          // User control
          hasFeedbackMechanism: Boolean(card.hasFeedbackMechanism),
          hasConversationReset: Boolean(card.hasConversationReset),
          hasHumanEscalation: Boolean(card.hasHumanEscalation),
          hasConversationExport: Boolean(card.hasConversationExport),
          hasDataDeletionOption: Boolean(card.hasDataDeletionOption),
          // Compliance
          hasDpoContact: Boolean(card.hasDpoContact),
          hasCookieBanner: Boolean(card.hasCookieBanner),
          hasPrivacyPolicyLink: Boolean(card.hasPrivacyPolicyLink),
          hasTermsOfServiceLink: Boolean(card.hasTermsOfServiceLink),
          hasGdprCompliance: Boolean(card.hasGdprCompliance),
          // Security
          hasBotProtection: Boolean(card.hasBotProtection),
          hasAiRateLimitHeaders: Boolean(card.hasAiRateLimitHeaders),
          hasBasicWebSecurity: Boolean(card.hasBasicWebSecurity),
          hasInputLengthLimit: Boolean(card.hasInputLengthLimit),
          usesInputSanitization: Boolean(card.usesInputSanitization),
          hasErrorHandling: Boolean(card.hasErrorHandling),
          hasSessionManagement: Boolean(card.hasSessionManagement),
          // Ethical AI
          hasBiasDisclosure: Boolean(card.hasBiasDisclosure),
          hasContentModeration: Boolean(card.hasContentModeration),
          hasAgeVerification: Boolean(card.hasAgeVerification),
          hasAccessibilitySupport: Boolean(card.hasAccessibilitySupport),
          // Scores
          score: card.score,
          weightedScore: card.weightedScore,
          categoryScores: card.categoryScores ? JSON.parse(card.categoryScores) : null,
          passedChecks: card.passedChecks,
          totalChecks: card.totalChecks,
          // Detection
          detectedAiProvider: card.detectedAiProvider,
          detectedModel: card.detectedModel,
          detectedChatFramework: card.detectedChatFramework,
          evidenceData: card.evidenceData ? JSON.parse(card.evidenceData) : null,
          // Enhanced fields
          hasAiImplementation: Boolean(card.hasAiImplementation),
          aiConfidenceLevel: card.aiConfidenceLevel,
          relevantChecks: card.relevantChecks,
          detailedChecks: card.detailedChecks ? JSON.parse(card.detailedChecks) : null,
          summary: card.summary ? JSON.parse(card.summary) : null,
          analyzedAt: new Date(card.analyzedAt),
        }
      })
      scorecardCount++
    }
    console.log(`   ✅ Migrated ${scorecardCount} scorecards\n`)

    // ========================================
    // MIGRATE KNOWLEDGE BASE
    // ========================================
    console.log('📚 Migrating Knowledge Base Findings...')
    const findings = sqlite.prepare('SELECT * FROM KnowledgeBaseFinding').all() as any[]
    console.log(`   Found ${findings.length} findings`)

    let findingCount = 0
    for (const finding of findings) {
      await postgres.knowledgeBaseFinding.create({
        data: {
          id: finding.id,
          findingKey: finding.findingKey,
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          explanation: finding.explanation,
          impact: finding.impact,
          solution: finding.solution,
          technicalDetails: finding.technicalDetails,
          references: finding.references ? JSON.parse(finding.references) : null,
          seoKeywords: finding.seoKeywords,
          lastUpdated: new Date(finding.lastUpdated),
        }
      })
      findingCount++
    }
    console.log(`   ✅ Migrated ${findingCount} findings\n`)

    // ========================================
    // SUMMARY
    // ========================================
    console.log('✅ Migration complete!\n')
    console.log('📊 Summary:')
    console.log(`   Scans:       ${scanCount}`)
    console.log(`   Leads:       ${leadCount}`)
    console.log(`   Jobs:        ${jobCount}`)
    console.log(`   Scorecards:  ${scorecardCount}`)
    console.log(`   Findings:    ${findingCount}`)
    console.log(`   TOTAL:       ${scanCount + leadCount + jobCount + scorecardCount + findingCount} records\n`)

    sqlite.close()
    await postgres.$disconnect()

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
