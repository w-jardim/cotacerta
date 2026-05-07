ALTER TABLE "monthly_charges"
ADD COLUMN "base_amount" DECIMAL(10,2);

UPDATE "monthly_charges"
SET "base_amount" = "amount_due"
WHERE "base_amount" IS NULL;

ALTER TABLE "monthly_charges"
ALTER COLUMN "base_amount" SET NOT NULL;
