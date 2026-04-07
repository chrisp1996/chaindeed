import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

export interface ClosingChecklistPDFProps {
  propertyAddress: string;
  state: 'OH' | 'KY' | 'IN' | string;
  contractId?: string;
  createdAt?: string;
  buyerName?: string;
  sellerName?: string;
  closingDate?: string;
}

// ─────────────────────────────────────────────────────────
// Checklist data
// ─────────────────────────────────────────────────────────

type ChecklistItem = { label: string; note?: string };

const SELLER_TASKS: Record<string, ChecklistItem[]> = {
  OH: [
    { label: 'Complete ORC 5302.30 Residential Property Disclosure Form', note: 'Must be delivered before purchase agreement is signed' },
    { label: 'Obtain title search / title commitment from title company' },
    { label: 'Calculate and confirm Ohio conveyance fee ($1 per $1,000 of sale price)', note: 'Ohio Revised Code § 319.54' },
    { label: 'Provide EPA lead paint pamphlet to buyer (if home built before 1978)' },
    { label: 'Execute deed (general warranty deed recommended)' },
    { label: 'File deed with county recorder after closing' },
    { label: 'Deliver keys and access materials to buyer' },
  ],
  KY: [
    { label: "Complete Kentucky Seller's Disclosure of Property Condition form", note: 'KRS § 324.360 — required before purchase agreement' },
    { label: 'Engage a Kentucky-licensed attorney to supervise closing', note: 'KRS Chapter 324 — attorney-supervised closing required' },
    { label: 'Pay Kentucky transfer tax at closing ($0.50 per $500 of sale price)', note: 'KRS § 142.050' },
    { label: 'Execute deed with attorney at closing' },
    { label: 'Record deed at county clerk office' },
    { label: 'Notify Property Valuation Administrator (PVA) by providing copy of deed', note: 'KRS § 132.220' },
    { label: 'Deliver keys and access materials to buyer' },
  ],
  IN: [
    { label: 'Complete Indiana Sales Disclosure Form 46021', note: 'IC § 6-1.1-5.5 — must be filed before deed is recorded' },
    { label: 'File Sales Disclosure Form 46021 with county assessor at closing' },
    { label: "Complete Indiana Seller's Residential Real Estate Sales Disclosure", note: 'IC § 32-21-5-7 — deliver to buyer before purchase agreement' },
    { label: 'Pay Indiana Sales Disclosure Fee ($0.10 per $100 of sale price)', note: 'IC § 6-1.1-5.5-3' },
    { label: 'Execute and deliver deed at closing' },
    { label: 'Ensure deed is recorded with county recorder' },
    { label: 'Deliver keys and access materials to buyer' },
  ],
  DEFAULT: [
    { label: 'Obtain title search or title commitment' },
    { label: 'Disclose all known material defects to buyer' },
    { label: 'Execute deed at closing' },
    { label: 'Record deed with appropriate government office' },
    { label: 'Deliver keys and access materials to buyer' },
  ],
};

const BUYER_TASKS: Record<string, ChecklistItem[]> = {
  OH: [
    { label: "Review Ohio ORC 5302.30 Seller's Disclosure Form carefully" },
    { label: 'Schedule and complete professional home inspection', note: 'Recommended within inspection contingency period' },
    { label: 'Obtain financing pre-approval or confirm funds availability' },
    { label: 'Review title commitment from title company' },
    { label: 'Review and confirm Ohio conveyance fee allocation' },
    { label: 'Attend closing and sign all documents' },
    { label: 'File for Ohio Homestead Exemption with county auditor (if primary residence)', note: 'Due by December 31 of purchase year — Ohio Revised Code § 323.152' },
  ],
  KY: [
    { label: "Review Kentucky Seller's Disclosure of Property Condition" },
    { label: 'Schedule and complete professional home inspection' },
    { label: 'Obtain financing or confirm cash funds' },
    { label: 'Engage Kentucky-licensed attorney to review documents' },
    { label: 'Attend closing at attorney office and sign all documents' },
    { label: 'File for Kentucky homestead exemption with PVA (if primary residence)', note: 'KRS § 132.200 — available for homeowners 65+ or permanently disabled' },
  ],
  IN: [
    { label: "Review Indiana Seller's Residential Real Estate Sales Disclosure" },
    { label: 'Schedule and complete professional home inspection' },
    { label: 'Obtain financing approval or confirm cash funds' },
    { label: 'Review title commitment' },
    { label: 'Attend closing and sign all documents' },
    { label: 'File for Indiana Homestead Standard Deduction with County Auditor', note: 'IC § 6-1.1-12-17 — due December 31 of purchase year; up to 60% AV or $45,000' },
    { label: 'File for other applicable Indiana deductions (Mortgage, Over 65, etc.)' },
  ],
  DEFAULT: [
    { label: 'Review all seller disclosures' },
    { label: 'Complete professional home inspection' },
    { label: 'Obtain financing or confirm funds' },
    { label: 'Review title commitment' },
    { label: 'Attend closing and sign all documents' },
    { label: 'Record change of address with USPS and relevant agencies' },
  ],
};

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const brandBlue = '#0ea5e9';
const borderGray = '#e2e8f0';
const textDark = '#0f172a';
const textMuted = '#64748b';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: textDark,
    paddingTop: 0,
    paddingBottom: 44,
    paddingHorizontal: 0,
  },

  // Header
  header: {
    backgroundColor: brandBlue,
    paddingVertical: 14,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBrand: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  headerRight: {
    color: '#bae6fd',
    fontSize: 11,
  },

  // Meta bar
  metaBar: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: borderGray,
    paddingVertical: 8,
    paddingHorizontal: 32,
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: { flexDirection: 'row', gap: 4 },
  metaLabel: { fontSize: 9, color: textMuted },
  metaValue: { fontSize: 9, color: textDark, fontFamily: 'Helvetica-Bold' },

  // Title block
  titleBlock: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: borderGray,
  },
  titleText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: textDark,
  },
  subtitleText: {
    fontSize: 9,
    color: textMuted,
    marginTop: 3,
  },

  // Columns container
  columns: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  column: {
    flex: 1,
  },

  // Column header
  colHeader: {
    backgroundColor: '#1e40af',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  colHeaderText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Checklist item
  checkItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 2,
    marginTop: 1,
    flexShrink: 0,
  },
  checkContent: { flex: 1 },
  checkLabel: {
    fontSize: 9.5,
    color: textDark,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  checkNote: {
    fontSize: 8,
    color: textMuted,
    fontFamily: 'Helvetica',
    marginTop: 2,
    lineHeight: 1.3,
  },

  // Signature block
  sigBlock: {
    paddingHorizontal: 32,
    paddingTop: 20,
    flexDirection: 'row',
    gap: 32,
  },
  sigColumn: { flex: 1 },
  sigLabel: { fontSize: 9, color: textMuted, marginBottom: 20 },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginBottom: 4,
  },
  sigName: { fontSize: 9, color: textDark },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: borderGray,
    paddingVertical: 8,
    paddingHorizontal: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  footerText: { fontSize: 7.5, color: textMuted },
  footerPage: { fontSize: 7.5, color: textMuted },
});

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function ClosingChecklistPDF({
  propertyAddress,
  state,
  contractId,
  createdAt,
  buyerName,
  sellerName,
  closingDate,
}: ClosingChecklistPDFProps) {
  const stateKey = state in SELLER_TASKS ? state : 'DEFAULT';
  const sellerItems = SELLER_TASKS[stateKey];
  const buyerItems = BUYER_TASKS[stateKey];

  return (
    <Document
      title={`ChainDeed Closing Checklist — ${propertyAddress}`}
      author="ChainDeed"
      subject="Closing Checklist"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBrand}>ChainDeed</Text>
          <Text style={styles.headerRight}>Closing Checklist</Text>
        </View>

        {/* Meta bar */}
        <View style={styles.metaBar}>
          {contractId && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Contract ID:</Text>
              <Text style={styles.metaValue}>{contractId}</Text>
            </View>
          )}
          {createdAt && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Created:</Text>
              <Text style={styles.metaValue}>{createdAt}</Text>
            </View>
          )}
          {closingDate && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Target Closing Date:</Text>
              <Text style={styles.metaValue}>{closingDate}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>State:</Text>
            <Text style={styles.metaValue}>{state}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleText}>Closing Checklist — {propertyAddress}</Text>
          <Text style={styles.subtitleText}>
            Use this checklist to track required tasks before and at closing.
            {state !== 'DEFAULT' && ` Tasks reflect ${state}-specific legal requirements.`}
          </Text>
        </View>

        {/* Two-column checklist */}
        <View style={styles.columns}>
          {/* Seller column */}
          <View style={styles.column}>
            <View style={styles.colHeader}>
              <Text style={styles.colHeaderText}>
                Seller Tasks{sellerName ? ` — ${sellerName}` : ''}
              </Text>
            </View>
            {sellerItems.map((item, i) => (
              <View key={i} style={styles.checkItem}>
                <View style={styles.checkbox} />
                <View style={styles.checkContent}>
                  <Text style={styles.checkLabel}>{item.label}</Text>
                  {item.note && <Text style={styles.checkNote}>{item.note}</Text>}
                </View>
              </View>
            ))}
          </View>

          {/* Buyer column */}
          <View style={styles.column}>
            <View style={{ ...styles.colHeader, backgroundColor: '#065f46' }}>
              <Text style={styles.colHeaderText}>
                Buyer Tasks{buyerName ? ` — ${buyerName}` : ''}
              </Text>
            </View>
            {buyerItems.map((item, i) => (
              <View key={i} style={styles.checkItem}>
                <View style={styles.checkbox} />
                <View style={styles.checkContent}>
                  <Text style={styles.checkLabel}>{item.label}</Text>
                  {item.note && <Text style={styles.checkNote}>{item.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Signature block */}
        <View style={styles.sigBlock}>
          <View style={styles.sigColumn}>
            <Text style={styles.sigLabel}>Seller signature &amp; date</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{sellerName || 'Seller'}</Text>
          </View>
          <View style={styles.sigColumn}>
            <Text style={styles.sigLabel}>Buyer signature &amp; date</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>{buyerName || 'Buyer'}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This document is a summary only. Not a substitute for legal advice. Generated by ChainDeed.
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
