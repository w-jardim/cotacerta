-- CreateEnum
CREATE TYPE "AnnualClosingStatus" AS ENUM ('SIMULATED', 'CONFIRMED', 'CANCELED');

-- CreateTable
CREATE TABLE "annual_closings" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "cycle_year" INTEGER NOT NULL,
    "status" "AnnualClosingStatus" NOT NULL DEFAULT 'SIMULATED',
    "total_quota_received" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_loan_received" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_available" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_quota_pending" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_loan_pending" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_pending" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_quotas" INTEGER NOT NULL DEFAULT 0,
    "value_per_quota" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "confirmed_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_closing_member_results" (
    "id" TEXT NOT NULL,
    "closing_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "quota_quantity" INTEGER NOT NULL,
    "gross_amount" DECIMAL(10,2) NOT NULL,
    "quota_debt_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "loan_debt_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_debt_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remaining_debt_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_closing_member_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annual_closings_group_id_idx" ON "annual_closings"("group_id");

-- CreateIndex
CREATE INDEX "annual_closing_member_results_closing_id_idx" ON "annual_closing_member_results"("closing_id");

-- CreateIndex
CREATE INDEX "annual_closing_member_results_member_id_idx" ON "annual_closing_member_results"("member_id");

-- AddForeignKey
ALTER TABLE "annual_closings" ADD CONSTRAINT "annual_closings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "cash_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_closing_member_results" ADD CONSTRAINT "annual_closing_member_results_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "annual_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_closing_member_results" ADD CONSTRAINT "annual_closing_member_results_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
