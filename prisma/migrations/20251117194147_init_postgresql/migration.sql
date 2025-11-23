-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "riskScore" INTEGER,
    "riskLevel" TEXT,
    "detectedTech" JSONB,
    "findings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "role" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "lifecycleStage" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
    "source" TEXT,
    "scanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTrustScorecard" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "isProviderDisclosed" BOOLEAN NOT NULL DEFAULT false,
    "isIdentityDisclosed" BOOLEAN NOT NULL DEFAULT false,
    "isAiPolicyLinked" BOOLEAN NOT NULL DEFAULT false,
    "isModelVersionDisclosed" BOOLEAN NOT NULL DEFAULT false,
    "isLimitationsDisclosed" BOOLEAN NOT NULL DEFAULT false,
    "hasDataUsageDisclosure" BOOLEAN NOT NULL DEFAULT false,
    "hasFeedbackMechanism" BOOLEAN NOT NULL DEFAULT false,
    "hasConversationReset" BOOLEAN NOT NULL DEFAULT false,
    "hasHumanEscalation" BOOLEAN NOT NULL DEFAULT false,
    "hasConversationExport" BOOLEAN NOT NULL DEFAULT false,
    "hasDataDeletionOption" BOOLEAN NOT NULL DEFAULT false,
    "hasDpoContact" BOOLEAN NOT NULL DEFAULT false,
    "hasCookieBanner" BOOLEAN NOT NULL DEFAULT false,
    "hasPrivacyPolicyLink" BOOLEAN NOT NULL DEFAULT false,
    "hasTermsOfServiceLink" BOOLEAN NOT NULL DEFAULT false,
    "hasGdprCompliance" BOOLEAN NOT NULL DEFAULT false,
    "hasBotProtection" BOOLEAN NOT NULL DEFAULT false,
    "hasAiRateLimitHeaders" BOOLEAN NOT NULL DEFAULT false,
    "hasBasicWebSecurity" BOOLEAN NOT NULL DEFAULT false,
    "hasInputLengthLimit" BOOLEAN NOT NULL DEFAULT false,
    "usesInputSanitization" BOOLEAN NOT NULL DEFAULT false,
    "hasErrorHandling" BOOLEAN NOT NULL DEFAULT false,
    "hasSessionManagement" BOOLEAN NOT NULL DEFAULT false,
    "hasBiasDisclosure" BOOLEAN NOT NULL DEFAULT false,
    "hasContentModeration" BOOLEAN NOT NULL DEFAULT false,
    "hasAgeVerification" BOOLEAN NOT NULL DEFAULT false,
    "hasAccessibilitySupport" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "weightedScore" INTEGER NOT NULL DEFAULT 0,
    "categoryScores" JSONB,
    "passedChecks" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "detectedAiProvider" TEXT,
    "detectedModel" TEXT,
    "detectedChatFramework" TEXT,
    "evidenceData" JSONB,
    "hasAiImplementation" BOOLEAN NOT NULL DEFAULT false,
    "aiConfidenceLevel" TEXT,
    "relevantChecks" INTEGER NOT NULL DEFAULT 0,
    "detailedChecks" JSONB,
    "summary" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiTrustScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseFinding" (
    "id" TEXT NOT NULL,
    "findingKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "technicalDetails" TEXT,
    "references" JSONB,
    "seoKeywords" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBaseFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "twitterHandle" TEXT,
    "facebookUrl" TEXT,
    "linkedinUrl" TEXT,
    "instagramHandle" TEXT,
    "youtubeUrl" TEXT,
    "githubUrl" TEXT,
    "siteName" TEXT NOT NULL DEFAULT 'AI Security Scanner',
    "siteDescription" TEXT,
    "siteUrl" TEXT,
    "ogImageUrl" TEXT,
    "faviconUrl" TEXT,
    "supportEmail" TEXT,
    "salesEmail" TEXT,
    "companyName" TEXT,
    "companyAddress" TEXT,
    "enableTwitterCards" BOOLEAN NOT NULL DEFAULT false,
    "enableOgTags" BOOLEAN NOT NULL DEFAULT true,
    "enableAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanArchive" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT,
    "status" TEXT NOT NULL,
    "riskScore" INTEGER,
    "riskLevel" TEXT,
    "detectedTech" JSONB,
    "findings" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_url_idx" ON "Scan"("url");

-- CreateIndex
CREATE INDEX "Scan_domain_idx" ON "Scan"("domain");

-- CreateIndex
CREATE INDEX "Scan_status_idx" ON "Scan"("status");

-- CreateIndex
CREATE INDEX "Scan_createdAt_idx" ON "Scan"("createdAt");

-- CreateIndex
CREATE INDEX "Scan_status_createdAt_idx" ON "Scan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_riskLevel_riskScore_idx" ON "Scan"("riskLevel", "riskScore");

-- CreateIndex
CREATE INDEX "Scan_completedAt_idx" ON "Scan"("completedAt");

-- CreateIndex
CREATE INDEX "Scan_domain_createdAt_idx" ON "Scan"("domain", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_scanId_idx" ON "Lead"("scanId");

-- CreateIndex
CREATE INDEX "Lead_lifecycleStage_idx" ON "Lead"("lifecycleStage");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Job_type_status_idx" ON "Job"("type", "status");

-- CreateIndex
CREATE INDEX "Job_completedAt_idx" ON "Job"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiTrustScorecard_scanId_key" ON "AiTrustScorecard"("scanId");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_scanId_idx" ON "AiTrustScorecard"("scanId");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_score_idx" ON "AiTrustScorecard"("score");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_weightedScore_idx" ON "AiTrustScorecard"("weightedScore");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_hasAiImplementation_idx" ON "AiTrustScorecard"("hasAiImplementation");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_detectedAiProvider_idx" ON "AiTrustScorecard"("detectedAiProvider");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_analyzedAt_idx" ON "AiTrustScorecard"("analyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseFinding_findingKey_key" ON "KnowledgeBaseFinding"("findingKey");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFinding_category_idx" ON "KnowledgeBaseFinding"("category");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFinding_severity_idx" ON "KnowledgeBaseFinding"("severity");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFinding_findingKey_idx" ON "KnowledgeBaseFinding"("findingKey");

-- CreateIndex
CREATE INDEX "ScanArchive_domain_idx" ON "ScanArchive"("domain");

-- CreateIndex
CREATE INDEX "ScanArchive_archivedAt_idx" ON "ScanArchive"("archivedAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTrustScorecard" ADD CONSTRAINT "AiTrustScorecard_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
