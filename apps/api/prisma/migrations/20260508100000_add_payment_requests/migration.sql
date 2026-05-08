-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('PENDING_REVIEW', 'AUTO_MATCHED', 'NEEDS_MANUAL_REVIEW', 'MISMATCH', 'CONFIRMED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentRequestType" AS ENUM ('MONTHLY_CHARGE', 'LOAN');

-- CreateEnum
CREATE TYPE "ReceivingMethod" AS ENUM ('PIX', 'CASH', 'OTHER');

-- AlterTable: Add receiving configuration to cash_groups
ALTER TABLE "cash_groups"
  ADD COLUMN "receiving_pix_key" TEXT,
  ADD COLUMN "receiving_pix_key_holder" TEXT,
  ADD COLUMN "receiving_instructions" TEXT;

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" TEXT NOT NULL,
    "cash_group_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "type" "PaymentRequestType" NOT NULL,
    "monthly_charge_id" TEXT,
    "loan_id" TEXT,
    "method" "ReceivingMethod" NOT NULL,
    "amount_declared" DECIMAL(10,2) NOT NULL,
    "receipt_file_name" TEXT,
    "receipt_mime_type" TEXT,
    "receipt_data_url" TEXT,
    "notes" TEXT,
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_requests_cash_group_id_idx" ON "payment_requests"("cash_group_id");

-- CreateIndex
CREATE INDEX "payment_requests_member_id_idx" ON "payment_requests"("member_id");

-- CreateIndex
CREATE INDEX "payment_requests_status_idx" ON "payment_requests"("status");

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_cash_group_id_fkey"
  FOREIGN KEY ("cash_group_id") REFERENCES "cash_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_monthly_charge_id_fkey"
  FOREIGN KEY ("monthly_charge_id") REFERENCES "monthly_charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_reviewed_by_user_id_fkey"
  FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
