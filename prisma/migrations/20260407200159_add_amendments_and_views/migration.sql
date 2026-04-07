-- CreateEnum
CREATE TYPE "AmendmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVISED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "ContractAmendment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "AmendmentStatus" NOT NULL DEFAULT 'PENDING',
    "changes" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "message" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,

    CONSTRAINT "ContractAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractView" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "viewedBy" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "ContractView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractView" ADD CONSTRAINT "ContractView_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
