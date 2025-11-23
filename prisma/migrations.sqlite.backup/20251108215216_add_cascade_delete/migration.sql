-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "company" TEXT,
    "role" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 0,
    "lifecycleStage" TEXT NOT NULL DEFAULT 'SUBSCRIBER',
    "source" TEXT,
    "scanId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastInteraction" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("company", "createdAt", "email", "id", "lastInteraction", "leadScore", "lifecycleStage", "name", "role", "scanId", "source") SELECT "company", "createdAt", "email", "id", "lastInteraction", "leadScore", "lifecycleStage", "name", "role", "scanId", "source" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
