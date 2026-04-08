'use client';

import { formatCurrency } from '@/lib/utils';
import { Change } from './NegotiationPanel';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | undefined | null): string {
  if (!date) return '_______________';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function money(v: number | undefined | null): string {
  if (!v) return '_______________';
  return formatCurrency(v);
}

function blank(v: string | undefined | null, fallback = '_______________'): string {
  return v || fallback;
}

const DEED_DESCRIPTIONS: Record<string, string> = {
  'General Warranty Deed':        'a General Warranty Deed, warranting title against all claims and encumbrances, past and present',
  'Special Warranty Deed':        'a Special Warranty Deed, warranting title only against claims arising during Seller\'s period of ownership',
  'Quit Claim Deed':              'a Quit Claim Deed, conveying whatever interest Seller holds in the Property without warranty',
  'Bargain and Sale Deed':        'a Bargain and Sale Deed, conveying the Property without express covenants against encumbrances',
  "Trustee's Deed":               "a Trustee's Deed, conveyed by Seller in their capacity as trustee",
  "Fiduciary / Executor's Deed":  "a Fiduciary Deed executed by Seller in a fiduciary or representative capacity",
  "Sheriff's / Court Officer's Deed": "a Sheriff's Deed or Court Officer's Deed as directed by court order",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="font-bold text-sm mb-1.5 uppercase tracking-wide text-gray-800">
        {number}. {title}
      </p>
      <div className="text-sm leading-relaxed text-gray-700 space-y-2">{children}</div>
    </div>
  );
}

// A term that is currently under negotiation gets highlighted
function Term({ value, field, pendingChanges }: { value: string; field: string; pendingChanges?: Change[] }) {
  const proposed = pendingChanges?.find(c => c.field === field);
  if (proposed) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <span className="line-through text-red-500 bg-red-50 px-1 rounded">{value}</span>
        <span className="font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-1 rounded">
          {proposed.newValue}
          <span className="ml-1 text-[10px] font-normal text-amber-600">(proposed)</span>
        </span>
      </span>
    );
  }
  return <strong>{value}</strong>;
}

// ─── Signature block ──────────────────────────────────────────────────────────

function SigBlock({ role, name, email, signedAt, walletAddress }: {
  role: string; name?: string; email?: string; signedAt?: string; walletAddress?: string;
}) {
  return (
    <div className="border border-gray-300 rounded p-4 space-y-2 bg-white">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{role}</p>
      <div className="min-h-10 border-b border-dashed border-gray-300 flex items-end pb-1">
        {signedAt
          ? <p className="text-base italic text-gray-700 font-serif">/s/ {name || email}</p>
          : <p className="text-xs text-gray-400">Signature pending</p>}
      </div>
      <p className="text-xs text-gray-600"><span className="font-medium">Printed name:</span> {blank(name)}</p>
      <p className="text-xs text-gray-600"><span className="font-medium">Email:</span> {blank(email)}</p>
      <p className="text-xs text-gray-600"><span className="font-medium">Date:</span> {signedAt ? fmt(signedAt) : '_______________'}</p>
      {walletAddress && (
        <p className="text-[10px] font-mono text-gray-400 break-all">
          Wallet: {walletAddress}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ContractDocumentProps {
  contract: any;
  pendingChanges?: Change[];   // currently negotiated changes to highlight
}

export function ContractDocument({ contract, pendingChanges = [] }: ContractDocumentProps) {
  const wd       = (contract.wizardData as Record<string, any>) ?? {};
  const af       = (wd.assetFields as Record<string, any>) ?? {};
  const isRE     = contract.type === 'REAL_ESTATE_PURCHASE';
  const isComm   = af.commercialType || wd.assetTypeKey === 'commercial_real_estate';
  const state    = contract.state ?? af.state ?? '';

  const sellerName  = contract.seller?.name  ?? wd.sellerName  ?? '';
  const sellerEmail = contract.seller?.email ?? wd.sellerEmail ?? '';
  const buyerName   = contract.buyer?.name   ?? wd.buyerName   ?? '';
  const buyerEmail  = contract.buyer?.email  ?? wd.buyerEmail  ?? '';
  const tcName      = contract.titleCompany  ?? wd.titleCompanyName ?? '';
  const tcEmail     = contract.titleCompanyEmail ?? wd.titleCompanyEmail ?? '';

  const address = [af.propertyAddress, af.city, af.state, af.zipCode].filter(Boolean).join(', ')
                  || wd.propertyAddress || '';
  const apn       = af.apn     || contract.property?.parcelNumber || '';
  const legalDesc = af.legalDescription || contract.property?.legalDescription || '';
  const deedType  = af.deedType || 'General Warranty Deed';
  const deedDesc  = DEED_DESCRIPTIONS[deedType] ?? `a ${deedType}`;

  const price       = contract.purchasePrice    ?? wd.price      ?? 0;
  const earnest     = contract.earnestMoneyAmount ?? wd.earnestMoney;
  const inspDays    = wd.inspectionDays;
  const closingDate = contract.closingDate;
  const notes       = wd.additionalNotes || wd.notes || '';

  const covenants: Record<string, boolean> = wd.covenants ?? {};
  const covenantList = Object.entries(covenants).filter(([, v]) => v).map(([k]) => k);

  const sellerSig = contract.signatures?.find((s: any) => s.role?.toLowerCase() === 'seller');
  const buyerSig  = contract.signatures?.find((s: any) => s.role?.toLowerCase() === 'buyer');

  const hasPending = pendingChanges.length > 0;

  const docTitle = isRE
    ? (isComm ? 'Commercial Real Estate Purchase and Sale Agreement' : 'Residential Real Estate Purchase and Sale Agreement')
    : 'Asset Purchase and Sale Agreement';

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm font-serif">
      {/* Negotiation notice banner */}
      {hasPending && (
        <div className="bg-amber-50 border-b border-amber-300 px-6 py-3 rounded-t-xl">
          <p className="text-xs font-sans font-semibold text-amber-800">
            ⚠️ Proposed Changes Under Negotiation
          </p>
          <p className="text-xs font-sans text-amber-700 mt-0.5">
            Terms highlighted in amber reflect a pending proposal. They are not yet final.
            The document below shows the currently agreed terms with proposed changes marked inline.
          </p>
        </div>
      )}

      <div className="px-8 py-8 max-w-3xl mx-auto space-y-1">
        {/* Title block */}
        <div className="text-center space-y-1 mb-8 border-b pb-6">
          <p className="text-xs font-sans font-semibold uppercase tracking-widest text-gray-500">ChainDeed · Digital Agreement</p>
          <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">{docTitle}</h1>
          <p className="text-xs text-gray-500 font-sans">Agreement ID: {contract.id}</p>
          <p className="text-xs text-gray-500 font-sans">
            Date of Agreement: {fmt(contract.createdAt)}
            {state && ` · State: ${state}`}
          </p>
        </div>

        {/* Recitals */}
        <Section number="I" title="Recitals">
          <p>
            This {docTitle} ("<strong>Agreement</strong>") is entered into as of{' '}
            <strong>{fmt(contract.createdAt)}</strong>, by and between{' '}
            <strong>{blank(sellerName, 'SELLER NAME')}</strong> ("<strong>Seller</strong>"){sellerEmail ? ` (${sellerEmail})` : ''}{' '}
            and <strong>{blank(buyerName, 'BUYER NAME')}</strong> ("<strong>Buyer</strong>"){buyerEmail ? ` (${buyerEmail})` : ''}.
          </p>
          {tcName && (
            <p>
              <strong>{tcName}</strong>{tcEmail ? ` (${tcEmail})` : ''} has been designated as the title company
              for this transaction (the "<strong>Title Company</strong>").
            </p>
          )}
        </Section>

        {/* Property */}
        {isRE && (
          <Section number="II" title="Property Description">
            <p>
              Seller agrees to sell and convey, and Buyer agrees to purchase, the real property commonly known as:{' '}
              <strong>{blank(address, '[Property address not specified]')}</strong>
              {apn ? `, Parcel No. ${apn}` : ''}{' '}
              (the "<strong>Property</strong>").
            </p>
            {legalDesc && <p><span className="font-sans text-xs font-semibold">Legal Description:</span> {legalDesc}</p>}
            {isComm && af.zoning && <p><span className="font-sans text-xs font-semibold">Zoning:</span> {af.zoning}</p>}
            {isComm && af.totalSqft && <p><span className="font-sans text-xs font-semibold">Total Square Footage:</span> {Number(af.totalSqft).toLocaleString()} sq ft</p>}
          </Section>
        )}

        {/* Purchase Price */}
        <Section number={isRE ? 'III' : 'II'} title="Purchase Price and Payment">
          <p>
            The total purchase price for the{' '}
            {isRE ? 'Property' : 'Asset'} shall be{' '}
            <Term value={money(price)} field="purchasePrice" pendingChanges={pendingChanges} />{' '}
            ("<strong>Purchase Price</strong>"), payable as follows:
          </p>
          {earnest ? (
            <p>
              (a)&nbsp; Earnest money deposit of{' '}
              <Term value={money(earnest)} field="earnestMoney" pendingChanges={pendingChanges} />{' '}
              due within three (3) business days of execution of this Agreement, held in escrow
              and applied toward the Purchase Price at closing; and
            </p>
          ) : null}
          <p>
            {earnest ? '(b)' : '(a)'}
            &nbsp; The balance of{' '}
            <strong>{money(price && earnest ? price - earnest : price)}</strong>{' '}
            due at closing.
          </p>
        </Section>

        {/* Deed type */}
        {isRE && (
          <Section number="IV" title="Conveyance of Title">
            <p>
              At closing, Seller shall convey title to the Property to Buyer by {deedDesc},
              free and clear of all liens, encumbrances, and defects except{' '}
              {deedType === 'Quit Claim Deed'
                ? 'as otherwise provided herein, Seller makes no warranty as to the condition of title.'
                : 'current-year real estate taxes and any easements or restrictions of record acceptable to Buyer.'}
            </p>
            {deedType === 'Special Warranty Deed' && (
              <p className="text-xs font-sans bg-sky-50 border border-sky-200 rounded p-2 mt-1">
                <strong>Note:</strong> A Special Warranty Deed warrants title only against claims arising during Seller's
                ownership period. Buyer is strongly encouraged to obtain title insurance to protect against claims predating
                Seller's ownership.
              </p>
            )}
            {deedType === 'Quit Claim Deed' && (
              <p className="text-xs font-sans bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                <strong>Note:</strong> A Quit Claim Deed conveys only whatever interest Seller currently holds, with no
                warranties. Title insurance is strongly recommended.
              </p>
            )}
          </Section>
        )}

        {/* Inspection / Due Diligence */}
        {isRE && (
          <Section number="V" title={isComm ? 'Due Diligence Period' : 'Inspection Contingency'}>
            <p>
              Buyer shall have{' '}
              <Term
                value={inspDays ? `${inspDays} calendar days` : '_____ calendar days'}
                field="inspectionDays"
                pendingChanges={pendingChanges}
              />{' '}
              from the Effective Date to {isComm
                ? 'complete physical, financial, legal, and environmental due diligence on the Property'
                : 'conduct a professional inspection of the Property at Buyer\'s expense'
              }.{' '}
              If Buyer determines in their {isComm ? 'sole discretion' : 'reasonable judgment'} that the{' '}
              {isComm ? 'due diligence results' : 'inspection reveals material defects'}, Buyer may
              (i) terminate this Agreement and receive a full refund of earnest money, or
              (ii) provide Seller with a written request for repairs or price reduction.
            </p>
          </Section>
        )}

        {/* Closing */}
        <Section number={isRE ? 'VI' : 'III'} title="Closing and Possession">
          <p>
            The closing of this transaction shall occur on or before{' '}
            <Term value={fmt(closingDate)} field="closingDate" pendingChanges={pendingChanges} />{' '}
            ("<strong>Closing Date</strong>"), unless otherwise agreed in writing by both parties.
            {isRE && ' Possession of the Property shall transfer to Buyer at closing unless otherwise agreed.'}
          </p>
          {tcName && (
            <p>
              Closing shall be coordinated through {tcName}, who will confirm clearance of title,
              receipt of funds, and satisfaction of all required conditions prior to disbursement.
            </p>
          )}
        </Section>

        {/* Conditions */}
        {(wd.conditions || pendingChanges.find(c => c.field === 'conditions')) && (
          <Section number={isRE ? 'VII' : 'IV'} title="Conditions and Contingencies">
            <p>
              <Term value={blank(wd.conditions)} field="conditions" pendingChanges={pendingChanges} />
            </p>
          </Section>
        )}

        {/* Warranties / Covenants */}
        {covenantList.length > 0 && (
          <Section number={isRE ? 'VIII' : 'V'} title="Representations, Warranties, and Covenants">
            <p>Seller and Buyer hereby agree to the following warranties and covenants:</p>
            <ul className="list-disc pl-5 space-y-1 font-sans text-xs text-gray-700">
              {covenantList.map(k => (
                <li key={k}>{k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* Commercial — Tenants */}
        {isComm && wd.tenants && wd.tenants.length > 0 && (
          <Section number="IX" title="Tenant Schedule">
            <p>The following tenants currently occupy the Property and their leases are assumed by Buyer at closing:</p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 bg-gray-50">
                    {['Tenant', 'Suite', 'Sq Ft', 'Lease Type', 'Expiration', 'Monthly Rent'].map(h => (
                      <th key={h} className="text-left py-1.5 px-2 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wd.tenants.map((t: any, i: number) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 px-2">{t.name}</td>
                      <td className="py-1.5 px-2">{t.suite}</td>
                      <td className="py-1.5 px-2">{t.sqft}</td>
                      <td className="py-1.5 px-2">{t.leaseType}</td>
                      <td className="py-1.5 px-2">{t.leaseEnd ? fmt(t.leaseEnd) : '—'}</td>
                      <td className="py-1.5 px-2">{t.monthlyRent ? money(Number(t.monthlyRent)) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Additional terms */}
        {notes && (
          <Section number={isRE ? (isComm ? 'X' : 'IX') : 'VI'} title="Additional Terms">
            <p>{notes}</p>
          </Section>
        )}

        {/* Governing law */}
        <Section number={isRE ? (isComm ? 'XI' : 'X') : 'VII'} title="Governing Law">
          <p>
            This Agreement shall be governed by and construed in accordance with the laws of the State of{' '}
            <strong>{state || '_______________'}</strong>.
            Any disputes arising hereunder shall be resolved through binding arbitration or as otherwise
            agreed by the parties in writing.
          </p>
        </Section>

        {/* Blockchain execution */}
        <Section number={isRE ? (isComm ? 'XII' : 'XI') : 'VIII'} title="Digital Execution and Blockchain Record">
          <p>
            This Agreement is executed digitally through the ChainDeed platform. Each party's digital
            signature constitutes a legally binding signature to the same effect as a handwritten signature.
            A permanent, immutable record of this Agreement{contract.contractAddress ? `, deployed at contract address ${contract.contractAddress}` : ''}{' '}
            is maintained on the{' '}
            {contract.chainId === 137 ? 'Polygon' : contract.chainId === 80002 ? 'Polygon Amoy (testnet)' : 'blockchain'}{' '}
            network for the benefit of both parties.
          </p>
        </Section>

        {/* Entire agreement boilerplate */}
        <div className="border-t pt-4 mt-6">
          <p className="text-xs font-sans text-gray-500 leading-relaxed">
            <strong>Entire Agreement.</strong> This Agreement constitutes the entire agreement between the
            parties with respect to the subject matter hereof and supersedes all prior negotiations,
            understandings, and agreements. This Agreement may not be amended except by a written instrument
            signed by both parties. Time is of the essence with respect to all dates and deadlines.
          </p>
        </div>

        {/* Signature page */}
        <div className="border-t-2 border-gray-800 pt-6 mt-8 space-y-4">
          <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-800">Signature Page</p>
          <p className="text-xs font-sans text-gray-600 text-center">
            By signing below, each party agrees to be bound by all terms of this Agreement.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            <SigBlock
              role="Seller"
              name={sellerName}
              email={sellerEmail}
              signedAt={sellerSig?.signedAt}
              walletAddress={contract.seller?.walletAddress}
            />
            <SigBlock
              role="Buyer"
              name={buyerName}
              email={buyerEmail}
              signedAt={buyerSig?.signedAt}
              walletAddress={contract.buyer?.walletAddress}
            />
          </div>
          {tcName && (
            <div className="mt-4">
              <p className="text-xs font-sans text-gray-500 text-center mb-2">Title Company (Acknowledged)</p>
              <div className="max-w-sm mx-auto">
                <SigBlock role="Title Company" name={tcName} email={tcEmail} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 mt-4 flex items-center justify-between">
          <p className="text-[10px] font-sans text-gray-400">
            ChainDeed · Agreement {contract.id?.slice(0, 8)}
          </p>
          <p className="text-[10px] font-sans text-gray-400">
            This document is provided for informational purposes. Consult an attorney regarding your rights and obligations.
          </p>
        </div>
      </div>
    </div>
  );
}
