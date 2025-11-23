-- AlterTable: Add scanNumber column and make it primary key
-- Step 1: Add scanNumber column (nullable first)
ALTER TABLE "Scan" ADD COLUMN "scanNumber" SERIAL;

-- Step 2: Backfill scanNumber for existing records (sequential IDs starting from 1)
WITH numbered_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "Scan"
)
UPDATE "Scan"
SET "scanNumber" = numbered_rows.rn
FROM numbered_rows
WHERE "Scan".id = numbered_rows.id;

-- Step 3: Drop foreign key constraints that depend on Scan_pkey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_scanId_fkey";
ALTER TABLE "AiTrustScorecard" DROP CONSTRAINT "AiTrustScorecard_scanId_fkey";

-- Step 4: Drop old primary key constraint on id
ALTER TABLE "Scan" DROP CONSTRAINT "Scan_pkey";

-- Step 5: Make scanNumber NOT NULL and set as primary key
ALTER TABLE "Scan" ALTER COLUMN "scanNumber" SET NOT NULL;
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_pkey" PRIMARY KEY ("scanNumber");

-- Step 6: Add unique constraint on id (was primary, now just unique)
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_id_key" UNIQUE ("id");

-- Step 7: Create index on id for fast UUID lookups
CREATE INDEX "Scan_id_idx" ON "Scan"("id");

-- Step 8: Recreate foreign key constraints (still reference id, not scanNumber)
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiTrustScorecard" ADD CONSTRAINT "AiTrustScorecard_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
