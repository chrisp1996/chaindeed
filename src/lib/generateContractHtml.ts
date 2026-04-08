/**
 * generateContractHtml.ts
 *
 * Produces the initial editable HTML document from a Contract record.
 * This runs entirely in the browser (no server call needed) when a party
 * opens the Contract editor for the first time and no documentHtml is stored.
 *
 * The output is valid TipTap-compatible HTML.  All variables are filled from
 * wizardData / contract fields.  If a value is missing a visible blank is
 * rendered so editors know what to fill in.
 */

function b(v: string | number | null | undefined, fallback = '_______________'): string {
  if (v === null || v === undefined || v === '') return `<span class="blank">${fallback}</span>`;
  return String(v);
}

function money(v: number | null | undefined): string {
  if (!v) return '<span class="blank">$_______________</span>';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function date(v: string | null | undefined): string {
  if (!v) return '<span class="blank">_______________, 20____</span>';
  return new Date(v).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const DEED_DESCRIPTIONS: Record<string, string> = {
  'General Warranty Deed':        'a General Warranty Deed, thereby warranting title against all claims and encumbrances whether arising before or during Seller\'s period of ownership',
  'Special Warranty Deed':        'a Special Warranty Deed, warranting title only against claims arising during Seller\'s period of ownership',
  'Quit Claim Deed':              'a Quit Claim Deed, conveying whatever interest Seller holds in the Property without warranty of any kind',
  'Bargain and Sale Deed':        'a Bargain and Sale Deed, conveying the Property without express covenants against encumbrances',
  "Trustee's Deed":               "a Trustee's Deed, executed by Seller in Seller's capacity as trustee",
  "Fiduciary / Executor's Deed":  "a Fiduciary Deed executed by Seller in a fiduciary or representative capacity",
  "Sheriff's / Court Officer's Deed": "a Sheriff's Deed or Court Officer's Deed as directed by court order",
};

const DEED_ADVISORIES: Record<string, string> = {
  'Special Warranty Deed':   '<em>Note:</em> A Special Warranty Deed does not protect against claims arising before Seller acquired the Property.  Buyer should obtain title insurance and conduct independent title review.',
  'Quit Claim Deed':         '<em>Warning:</em> A Quit Claim Deed conveys no warranties whatsoever.  Buyer accepts all risk as to title quality.  Independent title examination and title insurance are strongly recommended.',
  'Bargain and Sale Deed':   '<em>Note:</em> A Bargain and Sale Deed makes no covenants against encumbrances.  Buyer should obtain title insurance.',
};

export function generateContractHtml(contract: Record<string, any>): string {
  const wd = (contract.wizardData ?? {}) as Record<string, any>;
  const af = (wd.assetFields ?? {}) as Record<string, any>;
  const parties = (wd.parties ?? {}) as Record<string, any>;

  const buyerName  = contract.buyer?.name  ?? parties.buyerName  ?? contract.buyer?.email  ?? '';
  const sellerName = contract.seller?.name ?? parties.sellerName ?? contract.seller?.email ?? '';
  const agentName  = contract.agent?.name  ?? parties.agentName  ?? '';

  const streetAddress = af.streetAddress ?? contract.property?.streetAddress ?? '';
  const city          = af.city          ?? contract.property?.city          ?? '';
  const stateCode     = af.state         ?? contract.state                   ?? '';
  const zipCode       = af.zipCode       ?? contract.property?.zipCode       ?? '';
  const county        = af.county        ?? contract.property?.county        ?? '';
  const apn           = af.parcelNumber  ?? contract.property?.apn           ?? '';
  const legalDesc     = af.legalDescription ?? contract.property?.legalDescription ?? '';

  const purchasePrice  = contract.purchasePrice  ?? af.price         ?? null;
  const earnestMoney   = contract.earnestMoneyAmount ?? af.earnestMoney ?? null;
  const closingDate    = contract.closingDate    ?? af.closingDate    ?? null;
  const inspectionDays = af.inspectionDays ? Number(af.inspectionDays) : null;
  const deedType       = af.deedType ?? 'General Warranty Deed';
  const deedDesc       = DEED_DESCRIPTIONS[deedType] ?? DEED_DESCRIPTIONS['General Warranty Deed'];
  const deedAdvisory   = DEED_ADVISORIES[deedType]   ?? '';
  const conditions     = af.conditions ?? '';
  const titleCompany   = wd.titleCompanyName ?? contract.titleCompany ?? '';
  const jurisdiction   = stateCode ? `the State of ${stateCode}` : 'the applicable jurisdiction';

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<h1 style="text-align:center;font-size:1.25em;font-weight:bold;text-transform:uppercase;letter-spacing:0.05em;">
  PURCHASE AND SALE AGREEMENT
</h1>
<p style="text-align:center;font-size:0.85em;color:#555;">
  ChainDeed Platform — Negotiation Draft &nbsp;|&nbsp; ${today}
</p>
<hr/>

<h2>I. PARTIES</h2>
<p>
  This Purchase and Sale Agreement (<strong>"Agreement"</strong>) is entered into as of
  <strong>${date(contract.offerDate ?? null)}</strong>, by and between:
</p>
<p>
  <strong>SELLER:</strong> ${b(sellerName)}, hereinafter referred to as <strong>"Seller"</strong>; and
</p>
<p>
  <strong>BUYER:</strong> ${b(buyerName)}, hereinafter referred to as <strong>"Buyer"</strong>.
</p>
${agentName ? `<p><strong>REAL ESTATE AGENT/BROKER:</strong> ${agentName}, acting as agent in this transaction.</p>` : ''}

<h2>II. PROPERTY DESCRIPTION</h2>
<p>
  Seller agrees to sell and Buyer agrees to purchase the following described real property
  (the <strong>"Property"</strong>):
</p>
<p>
  <strong>Street Address:</strong> ${b(streetAddress)}, ${b(city)}, ${b(stateCode)} ${b(zipCode)}<br/>
  <strong>County:</strong> ${b(county)}<br/>
  <strong>Assessor Parcel Number (APN):</strong> ${b(apn)}<br/>
  <strong>Legal Description:</strong> ${b(legalDesc, '[legal description to be inserted]')}
</p>
<p>
  The Property is sold together with all improvements, fixtures, and appurtenances unless
  specifically excluded herein.
</p>

<h2>III. PURCHASE PRICE AND EARNEST MONEY</h2>
<p>
  The total purchase price for the Property shall be <strong>${money(purchasePrice)}</strong>
  (<strong>"Purchase Price"</strong>), payable as follows:
</p>
<ol>
  <li>
    <strong>Earnest Money Deposit:</strong> Buyer shall deposit the sum of
    <strong>${money(earnestMoney)}</strong> as earnest money within
    <strong>${b(af.earnestMoneyDays ?? '3')}</strong> business days of the
    Effective Date of this Agreement, to be held by
    ${titleCompany ? `<strong>${titleCompany}</strong>` : 'the designated escrow holder'}
    in a trust or escrow account.
  </li>
  <li>
    <strong>Balance at Closing:</strong> The balance of the Purchase Price, less the Earnest
    Money Deposit and subject to prorations and adjustments provided herein, shall be paid at
    Closing by wire transfer of immediately available funds or such other method as agreed
    in writing by the parties.
  </li>
</ol>

<h2>IV. CONVEYANCE OF TITLE</h2>
<p>
  At Closing, Seller shall convey marketable title to the Property by delivery of ${deedDesc}.
  ${deedAdvisory ? `<br/><br/><em style="color:#92400e;">${deedAdvisory}</em>` : ''}
</p>
<p>
  Title shall be free and clear of all liens and encumbrances except: (a) real property taxes
  not yet due and payable; (b) easements, covenants, restrictions, and conditions of record
  that do not materially interfere with Buyer's intended use; and (c) such other matters as
  Buyer expressly agrees to accept in writing.
</p>

<h2>V. INSPECTION AND DUE DILIGENCE</h2>
<p>
  Buyer shall have <strong>${b(inspectionDays ? `${inspectionDays} calendar days` : null, '_____ calendar days')}</strong>
  following the Effective Date (the <strong>"Inspection Period"</strong>) to conduct, at
  Buyer's sole cost and expense, such inspections, investigations, tests, surveys, and
  studies as Buyer deems necessary or appropriate.
</p>
<p>
  If Buyer, in Buyer's sole discretion, determines that the results of any inspection or
  investigation are unsatisfactory, Buyer may, by written notice to Seller prior to
  expiration of the Inspection Period, either: (a) terminate this Agreement and receive
  a full refund of the Earnest Money Deposit; or (b) request that Seller remedy specific
  identified deficiencies.  Seller's obligation to remedy shall be as negotiated in writing
  and attached hereto as an addendum.
</p>

<h2>VI. CLOSING</h2>
<p>
  The Closing of this transaction (the <strong>"Closing"</strong>) shall occur on or before
  <strong>${date(closingDate)}</strong> (the <strong>"Closing Date"</strong>), at the
  offices of the escrow or title company, or at such other time and place as the parties
  may agree in writing.
</p>
<p>
  Time is of the essence with respect to the Closing Date.  If Closing does not occur by
  the Closing Date for any reason other than Seller's default, the Earnest Money shall be
  disbursed as set forth in Section IX.
</p>

<h2>VII. CONDITIONS TO CLOSING</h2>
<p>
  The obligations of the parties under this Agreement are conditioned upon satisfaction (or
  written waiver by the benefiting party) of each of the following conditions on or before
  the Closing Date:
</p>
<ol>
  <li>
    <strong>Title:</strong> Title to the Property shall be clear, free, and insurable at
    standard rates by a nationally recognized title insurer, subject only to Permitted
    Exceptions.
  </li>
  <li>
    <strong>Inspections:</strong> Buyer shall have completed the inspection process described
    in Section V and shall not have elected to terminate this Agreement.
  </li>
  <li>
    <strong>Financing (if applicable):</strong> Buyer shall have obtained a written loan
    commitment satisfactory to Buyer, in Buyer's reasonable discretion, for financing
    sufficient to fund the balance of the Purchase Price.
  </li>
  <li>
    <strong>Seller Representations:</strong> All representations and warranties of Seller
    contained herein shall be true and correct in all material respects as of the Closing Date.
  </li>
  ${conditions ? `<li><strong>Additional Conditions:</strong> ${conditions}</li>` : '<li><strong>Additional Conditions:</strong> <em>[insert any additional agreed conditions here]</em></li>'}
</ol>

<h2>VIII. REPRESENTATIONS AND WARRANTIES OF SELLER</h2>
<p>Seller represents and warrants to Buyer as of the Effective Date and as of the Closing Date:</p>
<ol>
  <li>Seller has full legal authority to sell the Property and execute this Agreement.</li>
  <li>There are no pending or threatened legal proceedings affecting the Property.</li>
  <li>Seller has no knowledge of any material defect in the Property not disclosed to Buyer.</li>
  <li>The Property is not subject to any unrecorded liens, encumbrances, or adverse claims of which Seller is aware.</li>
  <li>Seller has not received any notice from any governmental authority of any pending or contemplated condemnation, assessment, or zoning change affecting the Property.</li>
</ol>

<h2>IX. DEFAULT AND REMEDIES</h2>
<p>
  <strong>Buyer Default:</strong> If Buyer fails to perform any obligation under this
  Agreement and such failure is not cured within five (5) business days after written notice,
  Seller may, as Seller's sole and exclusive remedy, retain the Earnest Money as liquidated
  damages, whereupon this Agreement shall terminate and neither party shall have any further
  obligation hereunder.
</p>
<p>
  <strong>Seller Default:</strong> If Seller fails to perform any obligation under this
  Agreement and such failure is not cured within five (5) business days after written notice,
  Buyer may, at Buyer's election: (a) terminate this Agreement and receive a full refund of
  the Earnest Money; or (b) pursue specific performance and/or actual damages.
</p>

<h2>X. PRORATIONS AND CLOSING COSTS</h2>
<p>
  Real estate taxes, homeowner association dues, rents, and other recurring charges shall
  be prorated as of the Closing Date.  Closing costs shall be allocated as follows unless
  otherwise agreed in writing:
</p>
<ul>
  <li><strong>Buyer:</strong> loan origination fees, title insurance premium (owner's policy), recording fees for deed, inspection fees, and Buyer's attorney fees.</li>
  <li><strong>Seller:</strong> broker commission (if applicable), transfer taxes, title search fees, and Seller's attorney fees.</li>
  <li><strong>Split equally:</strong> escrow fees and closing/settlement fees.</li>
</ul>

<h2>XI. ADDITIONAL TERMS AND PROVISIONS</h2>
<p>
  <em>[Insert any additional negotiated terms, addenda, riders, or special provisions here.
  Common additions include: personal property inclusions/exclusions, HOA transfer
  requirements, lease-back provisions, and custom contingencies.]</em>
</p>

<h2>XII. GOVERNING LAW AND GENERAL PROVISIONS</h2>
<p>
  This Agreement shall be governed by and construed in accordance with the laws of
  ${jurisdiction}.  In the event of any dispute arising under this Agreement, the prevailing
  party shall be entitled to recover reasonable attorneys' fees and costs from the
  non-prevailing party.
</p>
<p>
  This Agreement constitutes the entire agreement between the parties with respect to the
  subject matter hereof and supersedes all prior negotiations, representations, warranties,
  and understandings of the parties.  This Agreement may be amended only by a written
  instrument signed by both parties.  Time is of the essence as to all dates set forth herein.
</p>

<h2>XIII. DIGITAL EXECUTION AND PLATFORM DISCLOSURE</h2>
<p>
  This Agreement is being negotiated, drafted, and executed through the ChainDeed digital
  platform.  The parties acknowledge that:
</p>
<ol>
  <li>Electronic signatures applied through the ChainDeed platform constitute valid and
  binding signatures under applicable electronic signature law.</li>
  <li>A blockchain-based smart contract for escrow and closing mechanics will be deployed
  <strong>only after</strong> this Agreement is fully accepted and signed by all required
  parties, and all applicable conditions are satisfied.</li>
  <li>The legal agreement reflected in this document governs the parties' rights and
  obligations.  The smart contract implements the economic execution mechanics agreed herein.</li>
  <li>ChainDeed is a platform provider only and is not a party to this Agreement, does not
  provide legal advice, and does not represent either party.</li>
</ol>

<hr/>
<h2>SIGNATURES</h2>
<p><em>The parties have executed this Agreement as of the date first written above.</em></p>

<table style="width:100%;border-collapse:collapse;">
  <tr>
    <td style="width:50%;padding:8px;vertical-align:top;">
      <strong>SELLER</strong><br/><br/>
      <div style="border-bottom:1px solid #ccc;min-height:40px;margin-bottom:4px;"></div>
      <small>Signature</small><br/><br/>
      <strong>${b(sellerName)}</strong><br/>
      <small>Printed Name</small><br/><br/>
      Date: ___________________________
    </td>
    <td style="width:50%;padding:8px;vertical-align:top;">
      <strong>BUYER</strong><br/><br/>
      <div style="border-bottom:1px solid #ccc;min-height:40px;margin-bottom:4px;"></div>
      <small>Signature</small><br/><br/>
      <strong>${b(buyerName)}</strong><br/>
      <small>Printed Name</small><br/><br/>
      Date: ___________________________
    </td>
  </tr>
</table>

${titleCompany ? `
<br/>
<strong>TITLE COMPANY / ESCROW HOLDER (Acknowledgment)</strong><br/><br/>
<div style="border-bottom:1px solid #ccc;min-height:40px;margin-bottom:4px;width:50%;"></div>
<small>Authorized Signature</small><br/><br/>
<strong>${titleCompany}</strong><br/>
Date: ___________________________
` : ''}
`.trim();
}
