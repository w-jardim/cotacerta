-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX');

-- CreateTable
CREATE TABLE "charge_payments" (
    "id" TEXT NOT NULL,
    "monthly_charge_id" TEXT NOT NULL,
    "cash_group_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'PIX',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receipts" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "data_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charge_payments_monthly_charge_id_idx" ON "charge_payments"("monthly_charge_id");

-- CreateIndex
CREATE INDEX "charge_payments_cash_group_id_idx" ON "charge_payments"("cash_group_id");

-- CreateIndex
CREATE INDEX "charge_payments_member_id_idx" ON "charge_payments"("member_id");

-- CreateIndex
CREATE INDEX "charge_payments_paid_at_idx" ON "charge_payments"("paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_receipts_payment_id_key" ON "payment_receipts"("payment_id");

-- AddForeignKey
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payments_monthly_charge_id_fkey" FOREIGN KEY ("monthly_charge_id") REFERENCES "monthly_charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payments_cash_group_id_fkey" FOREIGN KEY ("cash_group_id") REFERENCES "cash_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_payments" ADD CONSTRAINT "charge_payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "charge_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
