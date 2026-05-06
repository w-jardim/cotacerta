-- CreateEnum
CREATE TYPE "CashGroupStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "cash_groups" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cycle_year" INTEGER NOT NULL,
    "quota_value" DECIMAL(10,2) NOT NULL,
    "due_day" INTEGER NOT NULL,
    "max_quotas_per_member" INTEGER NOT NULL DEFAULT 2,
    "default_loan_interest_rate" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "status" "CashGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_groups_owner_user_id_idx" ON "cash_groups"("owner_user_id");

-- AddForeignKey
ALTER TABLE "cash_groups" ADD CONSTRAINT "cash_groups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
