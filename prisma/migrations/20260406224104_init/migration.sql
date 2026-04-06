-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SELLER', 'AGENT', 'TITLE_COMPANY', 'ATTORNEY', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURES', 'ACTIVE', 'IN_ESCROW', 'PENDING_CLOSING', 'CLOSED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('SIMPLE_TRANSACTION', 'REAL_ESTATE_PURCHASE', 'TOKENIZED_PROPERTY', 'FRACTIONAL_INVESTMENT');

-- CreateEnum
CREATE TYPE "OffChainStepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'WAIVED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SIGNATURE_NEEDED', 'DOCUMENT_UPLOADED', 'DOCUMENT_REQUIRED', 'DEADLINE_APPROACHING', 'STEP_COMPLETED', 'STEP_OVERDUE', 'FUNDS_DEPOSITED', 'FUNDS_RELEASED', 'DISPUTE_RAISED', 'HOMESTEAD_REMINDER', 'SALES_DISCLOSURE_REMINDER', 'KYC_APPROVED', 'KYC_REJECTED', 'GENERAL');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WalletMethod" AS ENUM ('METAMASK', 'COINBASE_WALLET', 'WALLET_CONNECT', 'MAGIC_LINK', 'PRIVY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRACT_SUMMARY', 'CLOSING_CHECKLIST', 'RECORDER_COVER_SHEET', 'HOMESTEAD_LETTER', 'WHAT_TO_BRING', 'SALES_DISCLOSURE_COVER', 'SELLER_DISCLOSURE', 'TITLE_COMMITMENT', 'DEED', 'PURCHASE_AGREEMENT', 'INSPECTION_REPORT', 'INSURANCE_PROOF', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "walletAddress" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "kycVerifiedAt" TIMESTAMP(3),
    "kycDocumentCids" TEXT[],
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "apn" TEXT,
    "legalDescription" TEXT,
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" DOUBLE PRECISION,
    "squareFeet" INTEGER,
    "lotSizeAcres" DOUBLE PRECISION,
    "yearBuilt" INTEGER,
    "zoning" TEXT,
    "currentOwnerName" TEXT,
    "ownershipVerified" BOOLEAN NOT NULL DEFAULT false,
    "attomPropertyId" TEXT,
    "isTokenized" BOOLEAN NOT NULL DEFAULT false,
    "tokenContractAddr" TEXT,
    "totalShares" INTEGER,
    "photosCids" TEXT[],
    "documentCids" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "type" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "state" TEXT,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "agentId" TEXT,
    "titleCompany" TEXT,
    "arbiterAddress" TEXT,
    "propertyId" TEXT,
    "purchasePrice" DOUBLE PRECISION,
    "earnestMoneyAmount" DOUBLE PRECISION,
    "contractAddress" TEXT,
    "chainId" INTEGER,
    "txHash" TEXT,
    "blockNumber" INTEGER,
    "purchaseContractCid" TEXT,
    "sellerDisclosureCid" TEXT,
    "titleCommitmentCid" TEXT,
    "deedCid" TEXT,
    "titleClear" BOOLEAN NOT NULL DEFAULT false,
    "disclosureDelivered" BOOLEAN NOT NULL DEFAULT false,
    "inspectionComplete" BOOLEAN NOT NULL DEFAULT false,
    "fundingConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "salesDisclosureFiled" BOOLEAN NOT NULL DEFAULT false,
    "offerDate" TIMESTAMP(3),
    "acceptanceDate" TIMESTAMP(3),
    "inspectionDeadline" TIMESTAMP(3),
    "financingDeadline" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "stateLawHash" TEXT,
    "wizardStep" INTEGER NOT NULL DEFAULT 1,
    "wizardData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSignature" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "signerAddress" TEXT NOT NULL,
    "signerEmail" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureHash" TEXT,
    "role" TEXT NOT NULL,
    "emailLinkToken" TEXT,
    "emailLinkExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffChainStep" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "legalBasis" TEXT,
    "responsibility" TEXT NOT NULL,
    "estimatedCost" TEXT,
    "estimatedTime" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isBlocker" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "status" "OffChainStepStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "uploadedDocCid" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffChainStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractId" TEXT,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "channel" "NotificationChannel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "docType" "DocumentType" NOT NULL,
    "ipfsCid" TEXT,
    "localPath" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletOnboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "WalletMethod" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenOffering" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contractAddress" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalShares" INTEGER NOT NULL,
    "sharePrice" DOUBLE PRECISION NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "raisedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minInvestment" DOUBLE PRECISION NOT NULL,
    "maxInvestment" DOUBLE PRECISION,
    "accreditedOnly" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "closingDate" TIMESTAMP(3),
    "projectedReturn" DOUBLE PRECISION,
    "ipfsCid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestmentHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "shares" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,

    CONSTRAINT "InvestmentHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "holdingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "maticAmount" TEXT,
    "distributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "description" TEXT,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaoProposal" (
    "id" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "proposerAddress" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "votesFor" INTEGER NOT NULL DEFAULT 0,
    "votesAgainst" INTEGER NOT NULL DEFAULT 0,
    "quorumRequired" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DaoProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DaoVote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" BOOLEAN NOT NULL,
    "weight" INTEGER NOT NULL,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DaoVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "raisedByAddress" TEXT NOT NULL,
    "raisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "arbiter1" TEXT,
    "arbiter2" TEXT,
    "arbiter3" TEXT,
    "votes" JSONB,
    "txHash" TEXT,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudFlag" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "userId" TEXT,
    "flaggedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSignature_emailLinkToken_key" ON "ContractSignature"("emailLinkToken");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_contractId_key" ON "Dispute"("contractId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSignature" ADD CONSTRAINT "ContractSignature_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffChainStep" ADD CONSTRAINT "OffChainStep_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffChainStep" ADD CONSTRAINT "OffChainStep_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletOnboarding" ADD CONSTRAINT "WalletOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenOffering" ADD CONSTRAINT "TokenOffering_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestmentHolding" ADD CONSTRAINT "InvestmentHolding_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "TokenOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "InvestmentHolding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaoProposal" ADD CONSTRAINT "DaoProposal_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "TokenOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaoVote" ADD CONSTRAINT "DaoVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "DaoProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DaoVote" ADD CONSTRAINT "DaoVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudFlag" ADD CONSTRAINT "FraudFlag_flaggedBy_fkey" FOREIGN KEY ("flaggedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
