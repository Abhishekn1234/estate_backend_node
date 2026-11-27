DROP INDEX IF EXISTS "Inquiry_buyerId_createdAt_idx";
DROP INDEX IF EXISTS "Inquiry_propertyId_createdAt_idx";
DROP INDEX IF EXISTS "SavedProperty_userId_createdAt_idx";

CREATE INDEX "Inquiry_buyerId_createdAt_id_idx"
ON "Inquiry" ("buyerId", "createdAt" DESC, "id" DESC);

CREATE INDEX "Inquiry_propertyId_createdAt_id_idx"
ON "Inquiry" ("propertyId", "createdAt" DESC, "id" DESC);

CREATE INDEX "SavedProperty_userId_createdAt_id_idx"
ON "SavedProperty" ("userId", "createdAt" DESC, "id" DESC);
