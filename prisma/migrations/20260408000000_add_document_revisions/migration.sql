-- Add live document HTML field to Contract
ALTER TABLE "Contract" ADD COLUMN "documentHtml" TEXT;

-- Document revision rounds (redlines / track-changes)
CREATE TABLE "ContractRevision" (
    "id"           TEXT NOT NULL,
    "contractId"   TEXT NOT NULL,
    "version"      INTEGER NOT NULL,
    "baseHtml"     TEXT NOT NULL,
    "proposedHtml" TEXT NOT NULL,
    "authorRole"   TEXT NOT NULL,
    "authorId"     TEXT,
    "authorName"   TEXT,
    "status"       TEXT NOT NULL DEFAULT 'PENDING',
    "message"      TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt"  TIMESTAMP(3),
    "respondedBy"  TEXT,
    CONSTRAINT "ContractRevision_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContractRevision"
    ADD CONSTRAINT "ContractRevision_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Inline comments on contract documents
CREATE TABLE "ContractComment" (
    "id"          TEXT NOT NULL,
    "contractId"  TEXT NOT NULL,
    "revisionId"  TEXT,
    "authorRole"  TEXT NOT NULL,
    "authorId"    TEXT,
    "authorName"  TEXT,
    "anchorText"  TEXT,
    "text"        TEXT NOT NULL,
    "resolved"    BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt"  TIMESTAMP(3),
    "resolvedBy"  TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContractComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContractComment"
    ADD CONSTRAINT "ContractComment_contractId_fkey"
    FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractComment"
    ADD CONSTRAINT "ContractComment_revisionId_fkey"
    FOREIGN KEY ("revisionId") REFERENCES "ContractRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
