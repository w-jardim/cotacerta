-- AlterTable: add Pix receiving settings by payment type
ALTER TABLE "cash_groups"
  ADD COLUMN "receiving_pix_enabled_for_charges" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "receiving_pix_enabled_for_loans" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "receiving_pix_receiver_city" TEXT,
  ADD COLUMN "receiving_pix_description_prefix" TEXT;

-- CreateTable
CREATE TABLE "pix_payment_payloads" (
    "id" TEXT NOT NULL,
    "payment_request_id" TEXT NOT NULL,
    "pix_key" TEXT NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "receiver_city" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "txid" TEXT,
    "copy_paste_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pix_payment_payloads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pix_payment_payloads_payment_request_id_key" ON "pix_payment_payloads"("payment_request_id");

-- AddForeignKey
ALTER TABLE "pix_payment_payloads" ADD CONSTRAINT "pix_payment_payloads_payment_request_id_fkey"
  FOREIGN KEY ("payment_request_id") REFERENCES "payment_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
