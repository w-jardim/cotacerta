-- AlterTable: Add user_id to members
ALTER TABLE "members" ADD COLUMN "user_id" TEXT;

-- CreateIndex: Unique constraint on user_id
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_key" UNIQUE ("user_id");

-- AddForeignKey: members.user_id -> users.id
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
