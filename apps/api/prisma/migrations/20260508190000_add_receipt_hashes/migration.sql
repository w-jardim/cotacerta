-- AlterTable
ALTER TABLE "payment_receipts" ADD COLUMN     "receipt_hash" TEXT;

-- AlterTable
ALTER TABLE "payment_requests" ADD COLUMN     "receipt_hash" TEXT;

-- CreateIndex
CREATE INDEX "payment_receipts_receipt_hash_idx" ON "payment_receipts"("receipt_hash");

-- CreateIndex
CREATE INDEX "payment_requests_receipt_hash_idx" ON "payment_requests"("receipt_hash");
