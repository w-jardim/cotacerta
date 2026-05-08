-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "sender_user_id" TEXT,
    "recipient_user_id" TEXT NOT NULL,
    "cash_group_id" TEXT,
    "member_id" TEXT,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'INTERNAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "event_type" TEXT,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communication_messages_recipient_user_id_idx" ON "communication_messages"("recipient_user_id");

-- CreateIndex
CREATE INDEX "communication_messages_recipient_user_id_is_read_idx" ON "communication_messages"("recipient_user_id", "is_read");

-- CreateIndex
CREATE INDEX "communication_messages_sender_user_id_idx" ON "communication_messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "communication_messages_cash_group_id_idx" ON "communication_messages"("cash_group_id");
