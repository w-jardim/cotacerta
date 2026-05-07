CREATE TYPE "LoanStatus" AS ENUM ('OPEN', 'PARTIAL', 'PAID', 'CANCELED');

CREATE TYPE "LoanPaymentMethod" AS ENUM ('PIX', 'CASH', 'OTHER');

CREATE TYPE "LoanPaymentStatus" AS ENUM ('CONFIRMED', 'CANCELED');

CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "cash_group_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "principal_amount" DECIMAL(10,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "total_due" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "granted_at" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loan_payments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "LoanPaymentMethod" NOT NULL DEFAULT 'PIX',
    "status" "LoanPaymentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "paid_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loans_cash_group_id_idx" ON "loans"("cash_group_id");
CREATE INDEX "loans_member_id_idx" ON "loans"("member_id");
CREATE INDEX "loan_payments_loan_id_idx" ON "loan_payments"("loan_id");
CREATE INDEX "loan_payments_paid_at_idx" ON "loan_payments"("paid_at");

ALTER TABLE "loans"
ADD CONSTRAINT "loans_cash_group_id_fkey"
FOREIGN KEY ("cash_group_id") REFERENCES "cash_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loans"
ADD CONSTRAINT "loans_member_id_fkey"
FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loan_payments"
ADD CONSTRAINT "loan_payments_loan_id_fkey"
FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
