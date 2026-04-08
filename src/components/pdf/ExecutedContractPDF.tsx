import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface SignatureData {
  name: string;
  email?: string;
  walletAddress?: string;
  signedAt?: string;
  role: 'BUYER' | 'SELLER' | 'AGENT';
}

export interface ExecutedContractPDFProps {
  contractId: string;
  contractType: string;
  state?: string;
  createdAt: string;
  executedAt?: string;

  // Parties
  seller: SignatureData;
  buyer: SignatureData;

  // Property / Asset
  propertyAddress?: string;
  parcelNumber?: string;
  assetDescription: string;
  legalDescription?: string;

  // Financial
  purchasePrice: number;
  earnestMoney?: number;
  closingDate?: string;
  inspectionDays?: number;
  financingContingency?: boolean;
  financingAmount?: number;

  // Terms
  covenants?: string[];
  additionalTerms?: string;
  conditions?: string;
  possessionDate?: string;

  // Blockchain
  contractAddress?: string;
  chainId?: number;
  txHash?: string;
  blockNumber?: number;
}

// ─── Styles ──────────────────────────────────────────────
const navy   = '#0f2d4e';
const blue   = '#0ea5e9';
const light  = '#f8fafc';
const border = '#cbd5e1';
const muted  = '#64748b';
const dark   = '#0f172a';
const green  = '#16a34a';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: dark, paddingBottom: 52 },

  // Cover header
  coverBand: { backgroundColor: navy, paddingVertical: 18, paddingHorizontal: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  coverTitle: { color: '#ffffff', fontSize: 17, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  coverSub: { color: '#93c5fd', fontSize: 9.5 },
  coverRight: { alignItems: 'flex-end' },
  coverRightLine: { color: '#bae6fd', fontSize: 8 },

  // Blue accent bar
  accentBar: { backgroundColor: blue, height: 3 },

  // Meta row below header
  metaRow: { backgroundColor: light, borderBottomWidth: 1, borderBottomColor: border, paddingVertical: 6, paddingHorizontal: 36, flexDirection: 'row', gap: 20, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', gap: 3 },
  metaLabel: { fontSize: 7.5, color: muted },
  metaValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: dark },

  // Executed badge
  executedBadge: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac', borderRadius: 3, paddingVertical: 1.5, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  executedText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: green },

  // Body
  body: { paddingHorizontal: 36, paddingTop: 18 },

  // Section heading
  secHead: { backgroundColor: light, borderLeftWidth: 3, borderLeftColor: blue, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 7, marginTop: 14, borderRadius: 2 },
  secNum: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: muted, marginRight: 4 },
  secTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: dark, textTransform: 'uppercase', letterSpacing: 0.4 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center' },

  // Row
  row: { flexDirection: 'row', paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 8, color: muted, width: 160 },
  rowValue: { fontSize: 9, color: dark, flex: 1 },
  rowValueBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: blue, flex: 1 },

  // Recitals / body text
  recital: { fontSize: 9, color: dark, lineHeight: 1.55, marginBottom: 6, paddingLeft: 0 },
  bodyText: { fontSize: 9, color: dark, lineHeight: 1.6 },
  indent: { paddingLeft: 18 },

  // Numbered list item
  listItem: { flexDirection: 'row', gap: 6, paddingVertical: 2.5 },
  listNum: { fontSize: 9, color: blue, fontFamily: 'Helvetica-Bold', width: 14 },
  listText: { fontSize: 9, color: dark, flex: 1, lineHeight: 1.5 },

  // Covenant check
  covenant: { flexDirection: 'row', gap: 6, paddingVertical: 2.5 },
  checkmark: { fontSize: 9, color: green, fontFamily: 'Helvetica-Bold', width: 12 },
  covenantText: { fontSize: 8.5, color: dark, flex: 1, lineHeight: 1.45 },

  // Disclaimer
  disclaimer: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 3, padding: 8, marginTop: 14 },
  disclaimerText: { fontSize: 7.5, color: '#92400e', lineHeight: 1.5 },

  // ── Signature Page ──
  sigPageHeader: { backgroundColor: navy, paddingVertical: 12, paddingHorizontal: 36 },
  sigPageTitle: { color: '#ffffff', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  sigPageSub: { color: '#93c5fd', fontSize: 8, marginTop: 2 },

  witnessText: { fontSize: 9, color: dark, lineHeight: 1.6, paddingHorizontal: 36, paddingTop: 16, paddingBottom: 12 },

  sigColumns: { flexDirection: 'row', gap: 20, paddingHorizontal: 36, marginTop: 8 },
  sigBlock: { flex: 1, borderWidth: 1.5, borderColor: border, borderRadius: 4, overflow: 'hidden' },
  sigBlockHeader: { backgroundColor: navy, paddingVertical: 6, paddingHorizontal: 10 },
  sigBlockRole: { color: '#bae6fd', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  sigBlockName: { color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold', marginTop: 1 },
  sigBlockBody: { padding: 10 },
  sigField: { marginBottom: 8 },
  sigFieldLabel: { fontSize: 7, color: muted, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 2, minHeight: 22 },
  sigLineValue: { fontSize: 8.5, color: dark },
  sigLineEmpty: { color: '#cbd5e1', fontSize: 8, fontStyle: 'italic' },
  digitalSigBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: 3, padding: 5, marginTop: 6 },
  digitalSigLabel: { fontSize: 7, color: green, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  digitalSigValue: { fontSize: 7, color: dark, fontFamily: 'Helvetica', lineHeight: 1.4 },

  // Blockchain section
  chainBox: { marginHorizontal: 36, marginTop: 18, borderWidth: 1.5, borderColor: blue, borderRadius: 4, overflow: 'hidden' },
  chainHeader: { backgroundColor: blue, paddingVertical: 6, paddingHorizontal: 12 },
  chainHeaderText: { color: '#ffffff', fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  chainBody: { padding: 10, backgroundColor: '#f0f9ff' },
  chainRow: { flexDirection: 'row', paddingVertical: 2 },
  chainLabel: { fontSize: 7.5, color: muted, width: 110 },
  chainValue: { fontSize: 7.5, color: dark, flex: 1, fontFamily: 'Helvetica' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: border, paddingVertical: 7, paddingHorizontal: 36, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ffffff' },
  footerLeft: { fontSize: 7, color: muted },
  footerRight: { fontSize: 7, color: muted },
});

// ─── Helpers ──────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function contractTitle(type: string): string {
  const map: Record<string, string> = {
    SIMPLE_TRANSACTION: 'PURCHASE AND SALE AGREEMENT',
    REAL_ESTATE_PURCHASE: 'REAL ESTATE PURCHASE AND SALE AGREEMENT',
    TOKENIZED_PROPERTY: 'TOKENIZED REAL PROPERTY TRANSFER AGREEMENT',
    FRACTIONAL_INVESTMENT: 'FRACTIONAL INVESTMENT AGREEMENT',
  };
  return map[type] || 'PURCHASE AND SALE AGREEMENT';
}

function stateLabel(s?: string) {
  const map: Record<string, string> = { OH: 'Ohio', KY: 'Kentucky', IN: 'Indiana' };
  return s ? (map[s] || s) : 'Not specified';
}

function chainLabel(id?: number) {
  const map: Record<number, string> = { 80002: 'Polygon Amoy Testnet', 137: 'Polygon Mainnet', 1: 'Ethereum Mainnet' };
  return id ? (map[id] || `Chain ID ${id}`) : 'Polygon Network';
}

// ─── Component ────────────────────────────────────────────
export function ExecutedContractPDF(p: ExecutedContractPDFProps) {
  const title = contractTitle(p.contractType);
  const isExecuted = !!p.executedAt;

  return (
    <Document title={`${title} — ${p.contractId}`} author="ChainDeed" subject={title}>

      {/* ══════════════════════════════════════════
          PAGE 1 — Agreement Body
      ══════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>

        {/* Header */}
        <View style={s.coverBand}>
          <View>
            <Text style={s.coverTitle}>ChainDeed</Text>
            <Text style={s.coverSub}>{title}</Text>
          </View>
          <View style={s.coverRight}>
            {isExecuted && (
              <View style={s.executedBadge}>
                <Text style={s.executedText}>FULLY EXECUTED</Text>
              </View>
            )}
            <Text style={[s.coverRightLine, { marginTop: 4 }]}>Digital · Blockchain-Verified</Text>
          </View>
        </View>
        <View style={s.accentBar} />

        {/* Meta row */}
        <View style={s.metaRow}>
          {[
            ['Contract ID', p.contractId.slice(0, 16) + '…'],
            ['Type', p.contractType.replace(/_/g, ' ')],
            ['State', stateLabel(p.state)],
            ['Dated', p.createdAt],
            ...(p.executedAt ? [['Executed', p.executedAt]] : []),
          ].map(([label, value]) => (
            <View key={label} style={s.metaItem}>
              <Text style={s.metaLabel}>{label}: </Text>
              <Text style={s.metaValue}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* RECITALS */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secTitle}>Recitals</Text>
            </View>
          </View>
          <Text style={s.recital}>
            This {title} ("Agreement") is entered into as of {p.createdAt}, by and between{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{p.seller.name}</Text> ("Seller") and{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{p.buyer.name}</Text> ("Buyer"). Seller and Buyer are sometimes referred to collectively herein as the "Parties."
          </Text>
          <Text style={s.recital}>
            WHEREAS, Seller desires to sell and convey to Buyer, and Buyer desires to purchase from Seller, the asset described herein, on the terms and subject to the conditions set forth in this Agreement;
          </Text>
          <Text style={s.recital}>
            NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:
          </Text>

          {/* 1. PROPERTY */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secNum}>1.</Text>
              <Text style={s.secTitle}>Property / Asset Description</Text>
            </View>
          </View>
          <View style={s.row}><Text style={s.rowLabel}>Subject of Sale</Text><Text style={s.rowValue}>{p.assetDescription}</Text></View>
          {p.propertyAddress && <View style={s.row}><Text style={s.rowLabel}>Property Address</Text><Text style={s.rowValue}>{p.propertyAddress}</Text></View>}
          {p.parcelNumber && <View style={s.row}><Text style={s.rowLabel}>Parcel / APN</Text><Text style={s.rowValue}>{p.parcelNumber}</Text></View>}
          {p.legalDescription && <View style={s.row}><Text style={s.rowLabel}>Legal Description</Text><Text style={s.rowValue}>{p.legalDescription}</Text></View>}

          {/* 2. PARTIES */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secNum}>2.</Text>
              <Text style={s.secTitle}>Parties</Text>
            </View>
          </View>
          <View style={s.row}><Text style={s.rowLabel}>Seller</Text><Text style={s.rowValue}>{p.seller.name}{p.seller.email ? `  ·  ${p.seller.email}` : ''}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Buyer</Text><Text style={s.rowValue}>{p.buyer.name}{p.buyer.email ? `  ·  ${p.buyer.email}` : ''}</Text></View>

          {/* 3. PURCHASE PRICE */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secNum}>3.</Text>
              <Text style={s.secTitle}>Purchase Price and Payment</Text>
            </View>
          </View>
          <View style={s.row}><Text style={s.rowLabel}>Total Purchase Price</Text><Text style={s.rowValueBold}>{fmt(p.purchasePrice)}</Text></View>
          {p.earnestMoney !== undefined && p.earnestMoney > 0 && (
            <View style={s.row}><Text style={s.rowLabel}>Earnest Money Deposit</Text><Text style={s.rowValue}>{fmt(p.earnestMoney)} (to be applied toward purchase price at closing)</Text></View>
          )}
          <Text style={[s.bodyText, s.indent, { marginTop: 5 }]}>
            Buyer shall pay to Seller the total purchase price of {fmt(p.purchasePrice)}, payable at closing unless otherwise specified herein or in any addendum.
            {p.earnestMoney && p.earnestMoney > 0 ? ` An earnest money deposit of ${fmt(p.earnestMoney)} shall be delivered within three (3) business days of acceptance of this Agreement.` : ''}
          </Text>

          {/* 4. INSPECTION */}
          {p.inspectionDays !== undefined && p.inspectionDays > 0 && (
            <>
              <View style={s.secHead}>
                <View style={s.secTitleRow}>
                  <Text style={s.secNum}>4.</Text>
                  <Text style={s.secTitle}>Inspection Period</Text>
                </View>
              </View>
              <View style={s.row}><Text style={s.rowLabel}>Inspection Period</Text><Text style={s.rowValue}>{p.inspectionDays} calendar days from date of acceptance</Text></View>
              <Text style={[s.bodyText, s.indent, { marginTop: 5 }]}>
                Buyer shall have {p.inspectionDays} calendar days following acceptance of this Agreement to conduct all desired inspections of the Property at Buyer's expense. If Buyer determines the Property to be unsatisfactory, Buyer may terminate this Agreement and receive a full refund of any earnest money.
              </Text>
            </>
          )}

          {/* 5. CLOSING DATE */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secNum}>{p.inspectionDays && p.inspectionDays > 0 ? '5.' : '4.'}</Text>
              <Text style={s.secTitle}>Closing and Possession</Text>
            </View>
          </View>
          {p.closingDate && <View style={s.row}><Text style={s.rowLabel}>Closing Date</Text><Text style={s.rowValue}>{p.closingDate}</Text></View>}
          {p.possessionDate && <View style={s.row}><Text style={s.rowLabel}>Possession Date</Text><Text style={s.rowValue}>{p.possessionDate}</Text></View>}
          <Text style={[s.bodyText, s.indent, { marginTop: 5 }]}>
            Closing shall occur {p.closingDate ? `on or before ${p.closingDate}` : 'on a mutually agreed date'}. At closing, Seller shall deliver to Buyer a deed conveying good and marketable title, free and clear of all liens and encumbrances except as set forth herein. Possession shall be delivered to Buyer upon closing unless otherwise agreed in writing.
          </Text>

          {/* 6. CONDITIONS */}
          {p.conditions && (
            <>
              <View style={s.secHead}>
                <View style={s.secTitleRow}>
                  <Text style={s.secNum}>6.</Text>
                  <Text style={s.secTitle}>Conditions and Contingencies</Text>
                </View>
              </View>
              <Text style={[s.bodyText, { marginTop: 2 }]}>{p.conditions}</Text>
            </>
          )}

          {/* 7. COVENANTS */}
          {p.covenants && p.covenants.length > 0 && (
            <>
              <View style={s.secHead}>
                <View style={s.secTitleRow}>
                  <Text style={s.secNum}>7.</Text>
                  <Text style={s.secTitle}>Representations, Warranties, and Covenants</Text>
                </View>
              </View>
              <Text style={[s.bodyText, { marginBottom: 5 }]}>The Parties represent, warrant, and covenant as follows:</Text>
              {p.covenants.map((cov, i) => (
                <View key={i} style={s.covenant}>
                  <Text style={s.checkmark}>✓</Text>
                  <Text style={s.covenantText}>{cov}</Text>
                </View>
              ))}
            </>
          )}

          {/* 8. ADDITIONAL TERMS */}
          {p.additionalTerms && (
            <>
              <View style={s.secHead}>
                <View style={s.secTitleRow}>
                  <Text style={s.secNum}>8.</Text>
                  <Text style={s.secTitle}>Additional Terms and Conditions</Text>
                </View>
              </View>
              <Text style={s.bodyText}>{p.additionalTerms}</Text>
            </>
          )}

          {/* 9. GOVERNING LAW */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secNum}>9.</Text>
              <Text style={s.secTitle}>Governing Law and Entire Agreement</Text>
            </View>
          </View>
          <Text style={s.bodyText}>
            This Agreement shall be governed by and construed in accordance with the laws of the State of {stateLabel(p.state)}, without regard to its conflict of laws provisions. This Agreement constitutes the entire agreement between the Parties with respect to its subject matter and supersedes all prior and contemporaneous agreements, understandings, and negotiations. No amendment or modification shall be valid unless made in writing and signed by both Parties.
          </Text>

          {/* 10. BLOCKCHAIN */}
          <View style={s.secHead}>
            <View style={s.secTitleRow}>
              <Text style={s.secNum}>10.</Text>
              <Text style={s.secTitle}>Blockchain Execution and Electronic Signature</Text>
            </View>
          </View>
          <Text style={s.bodyText}>
            The Parties expressly agree that this Agreement has been executed electronically via the ChainDeed platform and that such electronic execution constitutes a valid and binding signature for all purposes under applicable law, including the Electronic Signatures in Global and National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA). A digital record of execution has been recorded on the blockchain as identified in the Verification section of this document.
          </Text>

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              LEGAL NOTICE: This document is generated by ChainDeed for informational and record-keeping purposes. It is not a substitute for independent legal counsel. Parties are encouraged to consult with a licensed attorney in their jurisdiction before or after executing any agreement. ChainDeed, LLC is not a law firm and does not provide legal services.
            </Text>
          </View>

        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>ChainDeed — {title} — ID: {p.contractId.slice(0, 20)}</Text>
          <Text style={s.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ══════════════════════════════════════════
          PAGE 2 — Signature Page
      ══════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>

        <View style={s.sigPageHeader}>
          <Text style={s.sigPageTitle}>Signature Page</Text>
          <Text style={s.sigPageSub}>{title} · Contract ID: {p.contractId}</Text>
        </View>
        <View style={s.accentBar} />

        <Text style={s.witnessText}>
          IN WITNESS WHEREOF, the undersigned have executed this {title} as of the date(s) indicated below. By signing below (electronically or in writing), each Party acknowledges that they have read, understand, and agree to be bound by all terms and conditions of this Agreement.
        </Text>

        {/* Signature blocks */}
        <View style={s.sigColumns}>
          {/* SELLER */}
          <View style={s.sigBlock}>
            <View style={s.sigBlockHeader}>
              <Text style={s.sigBlockRole}>Seller</Text>
              <Text style={s.sigBlockName}>{p.seller.name}</Text>
            </View>
            <View style={s.sigBlockBody}>
              <View style={s.sigField}>
                <Text style={s.sigFieldLabel}>Printed Name</Text>
                <View style={s.sigLine}><Text style={s.sigLineValue}>{p.seller.name}</Text></View>
              </View>
              <View style={s.sigField}>
                <Text style={s.sigFieldLabel}>Signature</Text>
                <View style={[s.sigLine, { minHeight: 28 }]}>
                  {p.seller.signedAt ? (
                    <Text style={[s.sigLineValue, { fontFamily: 'Helvetica-Oblique', fontSize: 10, color: navy }]}>/s/ {p.seller.name}</Text>
                  ) : (
                    <Text style={s.sigLineEmpty}>Awaiting signature</Text>
                  )}
                </View>
              </View>
              <View style={s.sigField}>
                <Text style={s.sigFieldLabel}>Date Signed</Text>
                <View style={s.sigLine}>
                  <Text style={s.sigLineValue}>{p.seller.signedAt || '________________________'}</Text>
                </View>
              </View>
              {p.seller.email && (
                <View style={s.sigField}>
                  <Text style={s.sigFieldLabel}>Email</Text>
                  <View style={s.sigLine}><Text style={s.sigLineValue}>{p.seller.email}</Text></View>
                </View>
              )}
              {p.seller.signedAt && (
                <View style={s.digitalSigBox}>
                  <Text style={s.digitalSigLabel}>Digital Signature Verified</Text>
                  {p.seller.walletAddress && <Text style={s.digitalSigValue}>Wallet: {p.seller.walletAddress}</Text>}
                  <Text style={s.digitalSigValue}>Executed via ChainDeed on {p.seller.signedAt}</Text>
                </View>
              )}
            </View>
          </View>

          {/* BUYER */}
          <View style={s.sigBlock}>
            <View style={s.sigBlockHeader}>
              <Text style={s.sigBlockRole}>Buyer</Text>
              <Text style={s.sigBlockName}>{p.buyer.name}</Text>
            </View>
            <View style={s.sigBlockBody}>
              <View style={s.sigField}>
                <Text style={s.sigFieldLabel}>Printed Name</Text>
                <View style={s.sigLine}><Text style={s.sigLineValue}>{p.buyer.name}</Text></View>
              </View>
              <View style={s.sigField}>
                <Text style={s.sigFieldLabel}>Signature</Text>
                <View style={[s.sigLine, { minHeight: 28 }]}>
                  {p.buyer.signedAt ? (
                    <Text style={[s.sigLineValue, { fontFamily: 'Helvetica-Oblique', fontSize: 10, color: navy }]}>/s/ {p.buyer.name}</Text>
                  ) : (
                    <Text style={s.sigLineEmpty}>Awaiting signature</Text>
                  )}
                </View>
              </View>
              <View style={s.sigField}>
                <Text style={s.sigFieldLabel}>Date Signed</Text>
                <View style={s.sigLine}>
                  <Text style={s.sigLineValue}>{p.buyer.signedAt || '________________________'}</Text>
                </View>
              </View>
              {p.buyer.email && (
                <View style={s.sigField}>
                  <Text style={s.sigFieldLabel}>Email</Text>
                  <View style={s.sigLine}><Text style={s.sigLineValue}>{p.buyer.email}</Text></View>
                </View>
              )}
              {p.buyer.signedAt && (
                <View style={s.digitalSigBox}>
                  <Text style={s.digitalSigLabel}>Digital Signature Verified</Text>
                  {p.buyer.walletAddress && <Text style={s.digitalSigValue}>Wallet: {p.buyer.walletAddress}</Text>}
                  <Text style={s.digitalSigValue}>Executed via ChainDeed on {p.buyer.signedAt}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Blockchain Verification */}
        {(p.contractAddress || p.txHash) && (
          <View style={s.chainBox}>
            <View style={s.chainHeader}>
              <Text style={s.chainHeaderText}>Blockchain Verification Record</Text>
            </View>
            <View style={s.chainBody}>
              {p.contractAddress && <View style={s.chainRow}><Text style={s.chainLabel}>Smart Contract Address</Text><Text style={s.chainValue}>{p.contractAddress}</Text></View>}
              {p.txHash && <View style={s.chainRow}><Text style={s.chainLabel}>Transaction Hash</Text><Text style={s.chainValue}>{p.txHash}</Text></View>}
              <View style={s.chainRow}><Text style={s.chainLabel}>Network</Text><Text style={s.chainValue}>{chainLabel(p.chainId)}</Text></View>
              {p.blockNumber && <View style={s.chainRow}><Text style={s.chainLabel}>Block Number</Text><Text style={s.chainValue}>{p.blockNumber}</Text></View>}
              {p.executedAt && <View style={s.chainRow}><Text style={s.chainLabel}>Executed</Text><Text style={s.chainValue}>{p.executedAt}</Text></View>}
              <View style={[s.chainRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#bae6fd' }]}>
                <Text style={[s.chainValue, { fontSize: 7, color: muted }]}>
                  This contract has been recorded on-chain and is immutable. Verification can be performed at any time using the transaction hash above on a compatible blockchain explorer.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>ChainDeed — {title} — ID: {p.contractId.slice(0, 20)}</Text>
          <Text style={s.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
