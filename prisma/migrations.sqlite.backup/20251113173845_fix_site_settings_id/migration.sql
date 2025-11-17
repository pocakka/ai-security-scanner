-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_SiteSettings" ("companyAddress", "companyName", "createdAt", "enableAnalytics", "enableOgTags", "enableTwitterCards", "facebookUrl", "faviconUrl", "githubUrl", "id", "instagramHandle", "linkedinUrl", "ogImageUrl", "salesEmail", "siteDescription", "siteName", "siteUrl", "supportEmail", "twitterHandle", "updatedAt", "youtubeUrl") SELECT "companyAddress", "companyName", "createdAt", "enableAnalytics", "enableOgTags", "enableTwitterCards", "facebookUrl", "faviconUrl", "githubUrl", "id", "instagramHandle", "linkedinUrl", "ogImageUrl", "salesEmail", "siteDescription", "siteName", "siteUrl", "supportEmail", "twitterHandle", "updatedAt", "youtubeUrl" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
