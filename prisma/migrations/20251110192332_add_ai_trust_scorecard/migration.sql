-- CreateTable
CREATE TABLE "AiTrustScorecard" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "categoryScores" TEXT,
    "passedChecks" INTEGER NOT NULL DEFAULT 0,
    "totalChecks" INTEGER NOT NULL DEFAULT 0,
    "detectedAiProvider" TEXT,
    "detectedModel" TEXT,
    "detectedChatFramework" TEXT,
    "evidenceData" TEXT,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiTrustScorecard_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AiTrustScorecard_scanId_key" ON "AiTrustScorecard"("scanId");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_scanId_idx" ON "AiTrustScorecard"("scanId");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_score_idx" ON "AiTrustScorecard"("score");

-- CreateIndex
CREATE INDEX "AiTrustScorecard_weightedScore_idx" ON "AiTrustScorecard"("weightedScore");
