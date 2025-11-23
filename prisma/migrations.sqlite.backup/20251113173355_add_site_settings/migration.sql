-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
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
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
