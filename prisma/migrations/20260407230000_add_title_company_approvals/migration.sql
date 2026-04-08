-- AlterTable
ALTER TABLE "Contract"
  ADD COLUMN "buyerApprovedTitleCompany"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sellerApprovedTitleCompany" BOOLEAN NOT NULL DEFAULT false;
