-- AlterTable: corrigir tipo de cpf de VARCHAR(14) para TEXT
ALTER TABLE "members" ALTER COLUMN "cpf" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "gestor_ai_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "apiKeyEncrypted" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gestor_ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "suggestion" JSONB NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "reasoning" TEXT,
    "gestorAction" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gestor_ai_configs_userId_key" ON "gestor_ai_configs"("userId");

-- CreateIndex
CREATE INDEX "ai_analysis_logs_userId_feature_idx" ON "ai_analysis_logs"("userId", "feature");

-- CreateIndex
CREATE INDEX "ai_analysis_logs_created_at_idx" ON "ai_analysis_logs"("created_at");

-- AddForeignKey
ALTER TABLE "gestor_ai_configs" ADD CONSTRAINT "gestor_ai_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis_logs" ADD CONSTRAINT "ai_analysis_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
