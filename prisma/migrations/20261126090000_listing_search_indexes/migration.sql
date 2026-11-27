CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "Property_isActive_city_createdAt_id_idx"
ON "Property" ("isActive", "city", "createdAt" DESC, "id");

CREATE INDEX "Property_isActive_price_asc_id_idx"
ON "Property" ("isActive", "price", "id");

CREATE INDEX "Property_isActive_price_desc_id_idx"
ON "Property" ("isActive", "price" DESC, "id");

CREATE INDEX "Property_isActive_createdAt_id_idx"
ON "Property" ("isActive", "createdAt" DESC, "id");

CREATE INDEX "Property_filters_idx"
ON "Property" ("isActive", "propertyType", "listingType", "bedrooms", "price");

CREATE INDEX "Property_city_trgm_idx"
ON "Property" USING GIN ("city" gin_trgm_ops);

CREATE INDEX "Property_locality_trgm_idx"
ON "Property" USING GIN ("locality" gin_trgm_ops);

CREATE INDEX "Inquiry_buyerId_createdAt_idx"
ON "Inquiry" ("buyerId", "createdAt");
