-- CreateEnum
CREATE TYPE "PaymentRequestAnalysisStatus" AS ENUM ('NOT_ANALYZED', 'AUTO_MATCHED', 'NEEDS_MANUAL_REVIEW', 'MISMATCH');

-- CreateTable
CREATE TABLE "payment_request_analyses" (
    "id" TEXT NOT NULL,
    "payment_request_id" TEXT NOT NULL,
    "status" "PaymentRequestAnalysisStatus" NOT NULL DEFAULT 'NOT_ANALYZED',
    "extracted_text" TEXT,
    "extracted_amount" DECIMAL(10,2),
    "extracted_paid_at" TIMESTAMP(3),
    "extracted_receiver" TEXT,
    "extracted_pix_key" TEXT,
    "extracted_txid" TEXT,
    "extracted_bank" TEXT,
    "expected_amount" DECIMAL(10,2),
    "expected_receiver" TEXT,
    "expected_pix_key" TEXT,
    "amount_matches" BOOLEAN,
    "receiver_matches" BOOLEAN,
    "pix_key_matches" BOOLEAN,
    "date_looks_valid" BOOLEAN,
    "issues" JSONB,
    "analyzed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_request_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_request_analyses_payment_request_id_key" ON "payment_request_analyses"("payment_request_id");

-- AddForeignKey
ALTER TABLE "payment_request_analyses" ADD CONSTRAINT "payment_request_analyses_payment_request_id_fkey" FOREIGN KEY ("payment_request_id") REFERENCES "payment_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
