-- CreateTable
CREATE TABLE "KnowledgeBaseFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingKey" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "technicalDetails" TEXT,
    "references" TEXT,
    "seoKeywords" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseFinding_findingKey_key" ON "KnowledgeBaseFinding"("findingKey");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFinding_category_idx" ON "KnowledgeBaseFinding"("category");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFinding_severity_idx" ON "KnowledgeBaseFinding"("severity");

-- CreateIndex
CREATE INDEX "KnowledgeBaseFinding_findingKey_idx" ON "KnowledgeBaseFinding"("findingKey");
