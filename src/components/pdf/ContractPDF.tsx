import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

export interface ContractPDFProps {
  contractType: string;
  assetDescription: string;
  sellerName: string;
  buyerName: string;
  price: number;
  createdAt: string;
  contractId: string;
  state?: string;
  covenants?: string[];
  conditions?: string;
  closingDate?: string;
  inspectionDays?: number;
  additionalNotes?: string;
  propertyAddress?: string;
  apn?: string;
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────

const brandBlue = '#0ea5e9';
const sectionHeaderBg = '#f1f5f9';
const borderGray = '#e2e8f0';
const textDark = '#0f172a';
const textMuted = '#64748b';
const textSmall = 9;
const textBody = 10;
const textLabel = 9;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: textBody,
    color: textDark,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },

  // Header bar
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
    fontFamily: 'Helvetica',
  },

  // Contract meta bar (below header)
  metaBar: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: borderGray,
    paddingVertical: 8,
    paddingHorizontal: 32,
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metaLabel: {
    fontSize: textLabel,
    color: textMuted,
    fontFamily: 'Helvetica',
  },
  metaValue: {
    fontSize: textLabel,
    color: textDark,
    fontFamily: 'Helvetica-Bold',
  },

  // Body
  body: {
    paddingHorizontal: 32,
    paddingTop: 20,
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    backgroundColor: sectionHeaderBg,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: brandBlue,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Row inside sections
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLabel: {
    fontSize: textLabel,
    color: textMuted,
    width: 140,
    fontFamily: 'Helvetica',
  },
  rowValue: {
    fontSize: textBody,
    color: textDark,
    flex: 1,
    fontFamily: 'Helvetica',
  },
  rowValueBold: {
    fontSize: textBody,
    color: brandBlue,
    flex: 1,
    fontFamily: 'Helvetica-Bold',
  },

  // Covenant list
  covenantItem: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 3,
  },
  bullet: {
    fontSize: textBody,
    color: brandBlue,
    width: 10,
    fontFamily: 'Helvetica-Bold',
  },
  covenantText: {
    fontSize: textSmall,
    color: textDark,
    flex: 1,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },

  // Notes block
  notesBlock: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: borderGray,
    borderRadius: 4,
    padding: 10,
  },
  notesText: {
    fontSize: textBody,
    color: textDark,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },

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
  footerText: {
    fontSize: 7.5,
    color: textMuted,
    fontFamily: 'Helvetica',
  },
  footerPage: {
    fontSize: 7.5,
    color: textMuted,
    fontFamily: 'Helvetica',
  },

  // Disclaimer box
  disclaimer: {
    marginTop: 20,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    padding: 10,
  },
  disclaimerText: {
    fontSize: 8,
    color: '#92400e',
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
});

// ─────────────────────────────────────────────────────────
// Helper: format currency
// ─────────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function ContractPDF({
  contractType,
  assetDescription,
  sellerName,
  buyerName,
  price,
  createdAt,
  contractId,
  state,
  covenants = [],
  conditions,
  closingDate,
  inspectionDays,
  additionalNotes,
  propertyAddress,
  apn,
}: ContractPDFProps) {
  return (
    <Document
      title={`ChainDeed Contract — ${contractId}`}
      author="ChainDeed"
      subject={contractType}
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBrand}>ChainDeed</Text>
          <Text style={styles.headerRight}>Contract Summary</Text>
        </View>

        {/* Meta bar */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Contract ID:</Text>
            <Text style={styles.metaValue}>{contractId}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Created:</Text>
            <Text style={styles.metaValue}>{createdAt}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Type:</Text>
            <Text style={styles.metaValue}>{contractType}</Text>
          </View>
          {state && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>State:</Text>
              <Text style={styles.metaValue}>{state}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Asset / Property */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Asset / Property</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Description</Text>
              <Text style={styles.rowValue}>{assetDescription}</Text>
            </View>
            {propertyAddress && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Property Address</Text>
                <Text style={styles.rowValue}>{propertyAddress}</Text>
              </View>
            )}
            {apn && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Parcel Number (APN)</Text>
                <Text style={styles.rowValue}>{apn}</Text>
              </View>
            )}
          </View>

          {/* Parties */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Parties</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Seller</Text>
              <Text style={styles.rowValue}>{sellerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Buyer</Text>
              <Text style={styles.rowValue}>{buyerName}</Text>
            </View>
          </View>

          {/* Financial Terms */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Terms</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Purchase Price</Text>
              <Text style={styles.rowValueBold}>{fmtCurrency(price)}</Text>
            </View>
            {inspectionDays !== undefined && inspectionDays > 0 && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Inspection Period</Text>
                <Text style={styles.rowValue}>{inspectionDays} days</Text>
              </View>
            )}
            {closingDate && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Completion Deadline</Text>
                <Text style={styles.rowValue}>{closingDate}</Text>
              </View>
            )}
            {conditions && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Conditions</Text>
                <Text style={styles.rowValue}>{conditions}</Text>
              </View>
            )}
          </View>

          {/* Covenants */}
          {covenants.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Agreed Covenants &amp; Warranties</Text>
              </View>
              {covenants.map((label, i) => (
                <View key={i} style={styles.covenantItem}>
                  <Text style={styles.bullet}>✓</Text>
                  <Text style={styles.covenantText}>{label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Additional Terms */}
          {additionalNotes && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Additional Terms</Text>
              </View>
              <View style={styles.notesBlock}>
                <Text style={styles.notesText}>{additionalNotes}</Text>
              </View>
            </View>
          )}

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              IMPORTANT: This document is a summary only and is not a substitute for legal advice.
              Parties should consult with a licensed attorney in their jurisdiction before signing any
              agreement. ChainDeed does not provide legal services.
            </Text>
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
