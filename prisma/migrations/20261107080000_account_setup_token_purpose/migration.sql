-- The schema got AccountSetupToken.purpose (activation vs password reset links) without a migration,
-- so every insert of a setup token failed with "column purpose does not exist".

-- CreateEnum
CREATE TYPE "AccountTokenPurposeEnum" AS ENUM ('ACCOUNT_ACTIVATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "AccountSetupToken" ADD COLUMN     "purpose" "AccountTokenPurposeEnum" NOT NULL DEFAULT 'ACCOUNT_ACTIVATION';
