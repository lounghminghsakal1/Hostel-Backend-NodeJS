-- AlterEnum
ALTER TYPE "UserStatusEnum" ADD VALUE 'PENDING_ACTIVATION';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_ACTIVATION';

-- CreateTable
CREATE TABLE "AccountSetupToken" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSetupToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountSetupToken_tokenHash_key" ON "AccountSetupToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountSetupToken_userId_idx" ON "AccountSetupToken"("userId");

-- AddForeignKey
ALTER TABLE "AccountSetupToken" ADD CONSTRAINT "AccountSetupToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
