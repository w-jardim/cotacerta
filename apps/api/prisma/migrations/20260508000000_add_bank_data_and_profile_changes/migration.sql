-- AlterTable: Add bank data fields to members
ALTER TABLE "members" ADD COLUMN "bank_institution" TEXT;
ALTER TABLE "members" ADD COLUMN "bank_account_holder" TEXT;

-- CreateEnum
CREATE TYPE "ProfileChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "member_profile_change_requests" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "requested_data" JSONB NOT NULL,
    "status" "ProfileChangeStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_profile_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_profile_change_requests_member_id_idx" ON "member_profile_change_requests"("member_id");

-- CreateIndex
CREATE INDEX "member_profile_change_requests_status_idx" ON "member_profile_change_requests"("status");

-- AddForeignKey
ALTER TABLE "member_profile_change_requests" ADD CONSTRAINT "member_profile_change_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
