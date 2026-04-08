'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { FieldWithHelp } from '@/components/wizard/FieldWithHelp';
import { PlainEnglishSummary } from '@/components/wizard/PlainEnglishSummary';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

type FieldDef = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'state-select';
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
};

type AssetTypeDef = {
  label: string;
  emoji: string;
  description: string;
  fields: FieldDef[];
  hasStateCovenants: boolean;
  group?: 'real_estate' | 'other';
};

// ─── Asset Type Definitions ───────────────────────────────

const ASSET_TYPES: Record<string, AssetTypeDef> = {
  residential_real_estate: {
    label: 'Residential Real Estate',
    emoji: '🏠',
    description: 'Home, condo, townhouse, or residential land',
    group: 'real_estate',
    hasStateCovenants: true,
    fields: [
      { key: 'propertyAddress', label: 'Property Address', type: 'text', required: true, placeholder: '123 Main St' },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'state', label: 'State', type: 'state-select', required: true },
      { key: 'zipCode', label: 'ZIP Code', type: 'text', required: true },
      { key: 'apn', label: 'Parcel Number (APN)', type: 'text', help: 'Found on your tax bill or county records.' },
      { key: 'propertyType', label: 'Property Type', type: 'select', required: true, options: ['Single-family home', 'Condo / Townhouse', 'Multi-family (2–4 units)', 'Residential land / lot', 'Mobile home', 'Other residential'] },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
      { key: 'bathrooms', label: 'Bathrooms', type: 'text', placeholder: '2 or 1.5' },
      { key: 'sqft', label: 'Square Footage', type: 'number' },
      { key: 'yearBuilt', label: 'Year Built', type: 'number', help: 'Required for lead paint disclosure (pre-1978).' },
      { key: 'legalDescription', label: 'Legal Description (optional)', type: 'textarea', help: 'Found on your current deed.' },
    ],
  },
  commercial_real_estate: {
    label: 'Commercial Real Estate',
    emoji: '🏢',
    description: 'Office, retail, industrial, or mixed-use property',
    group: 'real_estate',
    hasStateCovenants: true,
    fields: [
      { key: 'propertyAddress', label: 'Property Address', type: 'text', required: true, placeholder: '500 Commerce Blvd' },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'state', label: 'State', type: 'state-select', required: true },
      { key: 'zipCode', label: 'ZIP Code', type: 'text', required: true },
      { key: 'apn', label: 'Parcel Number (APN)', type: 'text', help: 'Found on county records or your tax bill.' },
      { key: 'commercialType', label: 'Property Type', type: 'select', required: true, options: ['Office', 'Retail / Strip mall', 'Industrial / Warehouse', 'Mixed-use', 'Multi-family (5+ units)', 'Hotel / Hospitality', 'Land / Development site', 'Special use', 'Other commercial'] },
      { key: 'totalSqft', label: 'Total Square Footage', type: 'number', required: true },
      { key: 'lotSizeAcres', label: 'Lot Size (acres)', type: 'text' },
      { key: 'yearBuilt', label: 'Year Built', type: 'number' },
      { key: 'zoning', label: 'Zoning Classification', type: 'text', placeholder: 'e.g. C-2, B-3, I-1', help: 'Found on county zoning maps or with your local planning department.' },
      { key: 'numberUnits', label: 'Number of Units / Suites', type: 'number', help: 'Total rentable units or suites in the building.' },
      { key: 'occupancyRate', label: 'Current Occupancy Rate (%)', type: 'number', placeholder: '85' },
      { key: 'noi', label: 'Net Operating Income (NOI, annual)', type: 'number', placeholder: '85000', help: 'Gross rents minus operating expenses, before debt service.' },
      { key: 'capRate', label: 'Cap Rate (%)', type: 'text', placeholder: '6.5', help: 'NOI divided by purchase price. Used to evaluate commercial property value.' },
      { key: 'legalDescription', label: 'Legal Description (optional)', type: 'textarea', help: 'Found on your current deed.' },
      { key: 'environmentalStatus', label: 'Environmental / Phase I Status', type: 'select', options: ['No known issues', 'Phase I complete — no issues found', 'Phase I complete — issues noted (describe in notes)', 'Phase II completed', 'Remediation ongoing', 'Unknown / not conducted'] },
    ],
  },
  vehicle: {
    label: 'Vehicle',
    emoji: '🚗',
    description: 'Car, truck, motorcycle, boat, RV, trailer',
    hasStateCovenants: false,
    fields: [
      { key: 'vehicleYear', label: 'Year', type: 'number', required: true },
      { key: 'vehicleMake', label: 'Make', type: 'text', required: true, placeholder: 'Toyota' },
      { key: 'vehicleModel', label: 'Model', type: 'text', required: true, placeholder: 'Camry' },
      { key: 'vin', label: 'VIN / Serial Number', type: 'text', required: true, help: '17-character number on dashboard or door jamb' },
      { key: 'odometer', label: 'Odometer Reading (miles)', type: 'number', required: true },
      { key: 'titleNumber', label: 'Title Number', type: 'text', help: 'Found on the paper title' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'condition', label: 'Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor', 'For parts only'] },
      { key: 'knownIssues', label: 'Known Issues (if any)', type: 'textarea', placeholder: 'List any known defects, damage, or issues...' },
    ],
  },
  business: {
    label: 'Business / Business Assets',
    emoji: '💼',
    description: 'Business sale, asset purchase, inventory transfer',
    hasStateCovenants: false,
    fields: [
      { key: 'businessName', label: 'Business Name', type: 'text', required: true },
      { key: 'businessType', label: 'Business Type', type: 'select', required: true, options: ['Sole proprietorship', 'LLC', 'Corporation (Inc.)', 'Partnership', 'Asset sale only'] },
      { key: 'ein', label: 'EIN / Tax ID (optional)', type: 'text', help: 'Employer Identification Number from IRS' },
      { key: 'assetsIncluded', label: 'Assets Included in Sale', type: 'textarea', required: true, placeholder: 'List all assets: equipment, inventory, customer lists, IP, furniture, vehicles...' },
      { key: 'liabilitiesAssumed', label: 'Liabilities Buyer is Assuming (if any)', type: 'textarea', placeholder: 'List any debts or obligations the buyer is taking on. Leave blank if none.' },
      { key: 'nonCompetePeriod', label: 'Seller Non-Compete Period', type: 'select', options: ['None', '6 months', '1 year', '2 years', '3 years', '5 years'] },
      { key: 'nonCompeteArea', label: 'Non-Compete Geographic Area', type: 'text', placeholder: 'e.g. Hamilton County, Ohio' },
      { key: 'transitionPeriod', label: 'Transition Assistance', type: 'select', options: ['None', '7 days', '14 days', '30 days', '60 days', '90 days'], help: 'How long will the seller help transition the buyer?' },
    ],
  },
  personal_property: {
    label: 'Personal Property',
    emoji: '📦',
    description: 'Furniture, art, jewelry, collectibles, antiques',
    hasStateCovenants: false,
    fields: [
      { key: 'itemName', label: 'Item Name', type: 'text', required: true, placeholder: 'Antique oak dining table' },
      { key: 'itemDescription', label: 'Full Description', type: 'textarea', required: true, placeholder: 'Dimensions, materials, age, markings, provenance...' },
      { key: 'serialNumber', label: 'Serial Number (if applicable)', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'condition', label: 'Condition', type: 'select', required: true, options: ['New (never used)', 'Like new', 'Good', 'Fair', 'Poor'] },
    ],
  },
  equipment: {
    label: 'Equipment / Machinery',
    emoji: '⚙️',
    description: 'Industrial equipment, tools, technology, farm equipment',
    hasStateCovenants: false,
    fields: [
      { key: 'equipmentName', label: 'Equipment Name', type: 'text', required: true, placeholder: 'John Deere 5075E Tractor' },
      { key: 'manufacturer', label: 'Manufacturer / Brand', type: 'text', required: true },
      { key: 'modelNumber', label: 'Model Number', type: 'text', required: true },
      { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
      { key: 'yearManufactured', label: 'Year Manufactured', type: 'number' },
      { key: 'hoursUsage', label: 'Hours / Usage', type: 'text', placeholder: '1,200 hours' },
      { key: 'condition', label: 'Condition', type: 'select', required: true, options: ['Excellent', 'Good — fully functional', 'Fair — minor issues', 'Poor — needs repair', 'For parts / as-is'] },
      { key: 'knownIssues', label: 'Known Issues (if any)', type: 'textarea' },
      { key: 'includesAccessories', label: 'Accessories / Attachments Included', type: 'textarea' },
    ],
  },
  intellectual_property: {
    label: 'Intellectual Property',
    emoji: '💡',
    description: 'Patent, trademark, copyright, software, domain name',
    hasStateCovenants: false,
    fields: [
      { key: 'ipType', label: 'Type of IP', type: 'select', required: true, options: ['Patent', 'Trademark', 'Copyright', 'Trade secret', 'Software / source code', 'Domain name', 'Brand / business name', 'Other'] },
      { key: 'ipName', label: 'Name / Title', type: 'text', required: true },
      { key: 'registrationNumber', label: 'Registration Number (if registered)', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', placeholder: 'United States' },
      { key: 'includesSourceCode', label: 'What Is Included', type: 'textarea' },
    ],
  },
  other: {
    label: 'Other',
    emoji: '📝',
    description: 'Something not listed above',
    hasStateCovenants: false,
    fields: [
      { key: 'assetName', label: 'What is being sold?', type: 'text', required: true },
      { key: 'assetDescription', label: 'Full Description', type: 'textarea', required: true },
      { key: 'assetCategory', label: 'Category', type: 'text', placeholder: 'e.g. livestock, mineral rights...' },
    ],
  },
};

// ─── Covenants ────────────────────────────────────────────

type CovenantDef = {
  key: string; label: string; description: string;
  defaultOn: boolean; required?: boolean;
  legalBasis?: string; conditionalOn?: string;
};

const STANDARD_COVENANTS: CovenantDef[] = [
  { key: 'sellerOwnership', label: 'Seller warrants they own this asset free and clear', description: 'The seller confirms they have full legal right to sell this item and that no one else has a claim to it.', defaultOn: true, required: true },
  { key: 'noLiens', label: 'No undisclosed liens or encumbrances', description: 'The seller confirms there are no outstanding loans, judgments, or claims against this asset that the buyer has not been told about.', defaultOn: true, required: true },
  { key: 'asDescribed', label: 'Asset is as described above', description: 'The seller confirms the asset matches the description provided. Any known defects have been disclosed.', defaultOn: true, required: true },
  { key: 'buyerRightToInspect', label: "Buyer's right to inspect before payment releases", description: "The buyer has the right to verify the asset matches the description before funds are released from escrow.", defaultOn: true },
];

const RESIDENTIAL_COVENANTS: CovenantDef[] = [
  { key: 'titleWarranty', label: 'General warranty of title', description: 'Seller warrants and defends the title against all claims. This is the strongest form of title protection for a buyer.', defaultOn: true },
  { key: 'sellerDisclosure', label: 'Seller disclosure of known defects', description: 'The seller has disclosed all known material defects. A separate written disclosure form will be provided.', defaultOn: true, required: true },
  { key: 'leadPaintDisclosure', label: 'Lead paint disclosure (required if built before 1978)', description: 'Federal law requires sellers of homes built before 1978 to disclose known lead paint hazards.', defaultOn: false, conditionalOn: 'yearBuilt<1978' },
  { key: 'inspectionContingency', label: 'Inspection contingency', description: "The buyer may have the property professionally inspected and negotiate repairs or cancel if significant issues are found.", defaultOn: true },
  { key: 'titleSearch', label: 'Title search required before closing', description: 'A title search will be performed to confirm clear title and identify any liens.', defaultOn: true, required: true },
  { key: 'prorationOfTaxes', label: 'Property taxes prorated at closing', description: 'Property taxes for the current year will be divided between buyer and seller based on the closing date.', defaultOn: true },
];

const COMMERCIAL_COVENANTS: CovenantDef[] = [
  { key: 'titleWarranty', label: 'General warranty of title', description: 'Seller warrants and defends title against all claims, past and future.', defaultOn: true },
  { key: 'sellerDisclosure', label: 'Seller disclosure of known material defects', description: 'Seller has disclosed all known material defects, environmental issues, and conditions affecting the property.', defaultOn: true, required: true },
  { key: 'titleSearch', label: 'Title search required before closing', description: 'A title search will confirm clear title and identify any liens or encumbrances.', defaultOn: true, required: true },
  { key: 'leaseRollEstoppel', label: 'Tenant estoppel certificates provided', description: 'Seller shall obtain estoppel certificates from all tenants confirming the status of each lease prior to closing.', defaultOn: true },
  { key: 'rentRollWarranty', label: 'Rent roll warranty', description: 'Seller warrants that the rent roll provided is accurate and complete as of the effective date of this agreement.', defaultOn: true, required: true },
  { key: 'environmentalContingency', label: 'Environmental contingency (Phase I / Phase II)', description: 'Buyer may conduct or review environmental assessments. If Phase II identifies significant contamination, Buyer may terminate.', defaultOn: true },
  { key: 'dueDiligencePeriod', label: 'Commercial due diligence period', description: 'Buyer has the right to conduct full physical, financial, legal, and environmental due diligence during the agreed inspection period.', defaultOn: true },
  { key: 'prorationOfTaxes', label: 'Property taxes and rent prorated at closing', description: 'Taxes, rents, and CAM charges will be prorated between buyer and seller as of the closing date.', defaultOn: true },
];

const STATE_COVENANTS: Record<string, CovenantDef[]> = {
  OH: [
    { key: 'orc530230', label: 'Ohio ORC 5302.30 Residential Property Disclosure', description: 'Ohio law requires sellers of residential property to complete and deliver a Residential Property Disclosure Form (ORC 5302.30) before the purchase agreement is signed.', defaultOn: true, required: true, legalBasis: 'Ohio Revised Code § 5302.30' },
    { key: 'ohConveyanceFee', label: 'Ohio conveyance fee acknowledged ($1 per $1,000 of sale price)', description: 'Ohio charges a conveyance fee of approximately $1 per $1,000 of sale price, split between buyer and seller per county custom.', defaultOn: true, legalBasis: 'Ohio Revised Code § 319.54' },
    { key: 'ohLeadPaint', label: 'Ohio lead paint pamphlet provided (if pre-1978)', description: 'For homes built before 1978, seller confirms the EPA pamphlet has been provided to the buyer.', defaultOn: false, legalBasis: 'EPA/HUD Lead Disclosure Rule' },
  ],
  KY: [
    { key: 'kyAttorneyClosing', label: 'Kentucky attorney-supervised closing required', description: 'Kentucky requires a licensed attorney to supervise real estate closings.', defaultOn: true, required: true, legalBasis: 'KRS Chapter 324' },
    { key: 'kyTransferTax', label: 'Kentucky transfer tax acknowledged ($0.50 per $500)', description: "Kentucky's transfer tax of $0.50 per $500 of sale price is paid by the seller at closing.", defaultOn: true, legalBasis: 'KRS § 142.050' },
    { key: 'kySellerDisclosure', label: "Kentucky Seller's Disclosure of Property Condition", description: "The seller has completed Kentucky's Seller's Disclosure of Property Condition form.", defaultOn: true, required: true, legalBasis: 'KRS § 324.360' },
  ],
  IN: [
    { key: 'inSalesDisclosure', label: 'Indiana Sales Disclosure Form 46021 required', description: 'Indiana requires Form 46021 to be filed with the county assessor at closing before the deed can be recorded.', defaultOn: true, required: true, legalBasis: 'IC § 6-1.1-5.5' },
    { key: 'inSellerDisclosure', label: "Indiana Seller's Residential Real Estate Sales Disclosure", description: "The seller has completed Indiana's Seller's Residential Real Estate Sales Disclosure form and delivered it to the buyer.", defaultOn: true, required: true, legalBasis: 'IC § 32-21-5-7' },
    { key: 'inSalesFee', label: 'Indiana Sales Disclosure Fee ($0.10 per $100)', description: 'Indiana charges a Sales Disclosure Fee of $0.10 per $100 of sale price, paid by the seller.', defaultOn: true, legalBasis: 'IC § 6-1.1-5.5-3' },
    { key: 'inHomesteadReminder', label: 'Indiana Homestead Deduction reminder', description: 'Buyer is advised to file for the Homestead Deduction with the County Auditor by December 31 of the year of purchase.', defaultOn: true, legalBasis: 'IC § 6-1.1-12-17' },
  ],
};

// ─── Tenant interface ─────────────────────────────────────

interface Tenant {
  id: string;
  name: string;
  suite: string;
  sqft: string;
  leaseType: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: string;
  rentEscalation: string;
  renewalOptions: string;
  securityDeposit: string;
  notes: string;
}

function emptyTenant(): Tenant {
  return { id: crypto.randomUUID(), name: '', suite: '', sqft: '', leaseType: '', leaseStart: '', leaseEnd: '', monthlyRent: '', rentEscalation: '', renewalOptions: '', securityDeposit: '', notes: '' };
}

// ─── Steps ────────────────────────────────────────────────

const STEPS_BASE = [
  { id: 1, name: 'Asset type' },
  { id: 2, name: 'Asset details' },
  { id: 3, name: "Who's involved" },
  { id: 4, name: 'Terms & legal' },
  { id: 5, name: 'Review' },
  { id: 6, name: 'Confirm' },
  { id: 7, name: 'Done' },
];

const STEPS_COMMERCIAL = [
  { id: 1, name: 'Asset type' },
  { id: 2, name: 'Property details' },
  { id: 3, name: 'Tenant schedule' },
  { id: 4, name: "Who's involved" },
  { id: 5, name: 'Terms & legal' },
  { id: 6, name: 'Review' },
  { id: 7, name: 'Confirm' },
  { id: 8, name: 'Done' },
];

// ─── Form data ────────────────────────────────────────────

interface FormData {
  assetTypeKey: string;
  assetFields: Record<string, string>;
  tenants: Tenant[];
  sellerName: string; sellerEmail: string;
  buyerName: string; buyerEmail: string;
  titleCompanyName: string; titleCompanyEmail: string;
  price: string; earnestMoney: string;
  inspectionDays: string; closingDate: string;
  notes: string;
  covenants: Record<string, boolean>;
}

// ─── Helpers ──────────────────────────────────────────────

function buildDefaultCovenants(typeKey: string, assetFields: Record<string, string>): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const c of STANDARD_COVENANTS) result[c.key] = c.defaultOn;

  const isResi = typeKey === 'residential_real_estate';
  const isComm = typeKey === 'commercial_real_estate';

  if (isResi) {
    for (const c of RESIDENTIAL_COVENANTS) {
      result[c.key] = c.conditionalOn === 'yearBuilt<1978'
        ? parseInt(assetFields['yearBuilt'] || '9999') < 1978
        : c.defaultOn;
    }
    const state = assetFields['state'];
    if (state && STATE_COVENANTS[state]) {
      for (const c of STATE_COVENANTS[state]) result[c.key] = c.defaultOn;
    }
  }

  if (isComm) {
    for (const c of COMMERCIAL_COVENANTS) result[c.key] = c.defaultOn;
    const state = assetFields['state'];
    if (state && STATE_COVENANTS[state]) {
      for (const c of STATE_COVENANTS[state]) result[c.key] = c.defaultOn;
    }
  }

  return result;
}

function buildAssetDescription(typeKey: string, fields: Record<string, string>): string {
  switch (typeKey) {
    case 'residential_real_estate':
    case 'commercial_real_estate': {
      const addr = [fields.propertyAddress, fields.city, fields.state, fields.zipCode].filter(Boolean).join(', ');
      const subtype = fields.propertyType || fields.commercialType || '';
      return `${subtype ? subtype + ' at ' : ''}${addr || '(address not specified)'}`;
    }
    case 'vehicle':
      return `${fields.vehicleYear || ''} ${fields.vehicleMake || ''} ${fields.vehicleModel || ''}`.trim() || 'Vehicle';
    case 'business': return fields.businessName || 'Business';
    case 'personal_property': return fields.itemName || 'Personal property item';
    case 'equipment': return fields.equipmentName || 'Equipment';
    case 'intellectual_property': return `${fields.ipType ? fields.ipType + ': ' : ''}${fields.ipName || 'Intellectual property'}`;
    case 'other': return fields.assetName || 'Asset';
    default: return ASSET_TYPES[typeKey]?.label || typeKey;
  }
}

// ─── Sub-components ───────────────────────────────────────

function CovenantSection({ title, covenants, values, onChange, legalTag }: {
  title: string; covenants: CovenantDef[]; values: Record<string, boolean>;
  onChange: (key: string, checked: boolean) => void; legalTag?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
        {legalTag && <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 rounded px-2 py-0.5">{legalTag}</span>}
      </div>
      <div className="space-y-3">
        {covenants.map(cov => (
          <div key={cov.key} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <Checkbox
              id={`cov-${cov.key}`}
              checked={values[cov.key] ?? cov.defaultOn}
              onCheckedChange={checked => !cov.required && onChange(cov.key, Boolean(checked))}
              disabled={cov.required}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor={`cov-${cov.key}`} className={`text-sm font-medium leading-snug ${cov.required ? 'cursor-default' : 'cursor-pointer'}`}>
                {cov.label}
                {cov.required && <span className="ml-2 text-xs text-muted-foreground font-normal">(required)</span>}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cov.description}</p>
              {cov.legalBasis && <p className="text-xs text-sky-600 mt-1 font-medium">{cov.legalBasis}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DynamicField({ field, value, onChange }: { field: FieldDef; value: string; onChange: (val: string) => void }) {
  const id = `field-${field.key}`;
  const inner = (() => {
    if (field.type === 'textarea') return <Textarea id={id} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={3} />;
    if (field.type === 'state-select') return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Select a state..." /></SelectTrigger>
        <SelectContent>
          {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          <SelectItem value="Outside US">Outside US</SelectItem>
        </SelectContent>
      </Select>
    );
    if (field.type === 'select' && field.options) return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>{field.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
      </Select>
    );
    return <Input id={id} type={field.type === 'number' ? 'number' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />;
  })();
  return <FieldWithHelp label={field.label} helpText={field.help || field.label} required={field.required} htmlFor={id}>{inner}</FieldWithHelp>;
}

function TenantEditor({ tenants, onChange }: { tenants: Tenant[]; onChange: (t: Tenant[]) => void }) {
  function updateTenant(id: string, field: keyof Tenant, val: string) {
    onChange(tenants.map(t => t.id === id ? { ...t, [field]: val } : t));
  }
  function removeTenant(id: string) { onChange(tenants.filter(t => t.id !== id)); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Tenant Schedule</p>
          <p className="text-sm text-muted-foreground">Add all current tenants and their lease details. Leave blank if property is vacant.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...tenants, emptyTenant()])}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Tenant
        </Button>
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground text-sm">
          No tenants added. Click "Add Tenant" or leave blank if the property is vacant.
        </div>
      )}

      {tenants.map((t, i) => (
        <Card key={t.id} className="border-primary/20">
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">Tenant {i + 1}</p>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTenant(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <FieldWithHelp label="Tenant Name / Company" helpText="Legal name of tenant" required htmlFor={`t-name-${t.id}`}>
                <Input id={`t-name-${t.id}`} value={t.name} onChange={e => updateTenant(t.id, 'name', e.target.value)} placeholder="Acme Corp" />
              </FieldWithHelp>
              <FieldWithHelp label="Suite / Unit" helpText="Suite number or unit identifier" htmlFor={`t-suite-${t.id}`}>
                <Input id={`t-suite-${t.id}`} value={t.suite} onChange={e => updateTenant(t.id, 'suite', e.target.value)} placeholder="Suite 200" />
              </FieldWithHelp>
              <FieldWithHelp label="Leased Sq Ft" helpText="Square footage under this tenant's lease" htmlFor={`t-sqft-${t.id}`}>
                <Input id={`t-sqft-${t.id}`} type="number" value={t.sqft} onChange={e => updateTenant(t.id, 'sqft', e.target.value)} placeholder="2400" />
              </FieldWithHelp>
              <FieldWithHelp label="Lease Type" helpText="Gross, NNN, Modified Gross, etc." htmlFor={`t-ltype-${t.id}`}>
                <Select value={t.leaseType} onValueChange={v => updateTenant(t.id, 'leaseType', v)}>
                  <SelectTrigger id={`t-ltype-${t.id}`}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {['Gross / Full-service', 'Net (N)', 'Double Net (NN)', 'Triple Net (NNN)', 'Modified Gross', 'Percentage lease', 'Ground lease'].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldWithHelp>
              <FieldWithHelp label="Lease Start Date" helpText="Commencement date of the lease" htmlFor={`t-start-${t.id}`}>
                <Input id={`t-start-${t.id}`} type="date" value={t.leaseStart} onChange={e => updateTenant(t.id, 'leaseStart', e.target.value)} />
              </FieldWithHelp>
              <FieldWithHelp label="Lease End / Expiration Date" helpText="Lease expiration or termination date" htmlFor={`t-end-${t.id}`}>
                <Input id={`t-end-${t.id}`} type="date" value={t.leaseEnd} onChange={e => updateTenant(t.id, 'leaseEnd', e.target.value)} />
              </FieldWithHelp>
              <FieldWithHelp label="Monthly Base Rent ($)" helpText="Current monthly base rent amount" required htmlFor={`t-rent-${t.id}`}>
                <Input id={`t-rent-${t.id}`} type="number" value={t.monthlyRent} onChange={e => updateTenant(t.id, 'monthlyRent', e.target.value)} placeholder="3500" />
              </FieldWithHelp>
              <FieldWithHelp label="Annual Rent Escalation" helpText="e.g. 3% per year, CPI, fixed" htmlFor={`t-esc-${t.id}`}>
                <Input id={`t-esc-${t.id}`} value={t.rentEscalation} onChange={e => updateTenant(t.id, 'rentEscalation', e.target.value)} placeholder="3% per year" />
              </FieldWithHelp>
              <FieldWithHelp label="Renewal Options" helpText="e.g. Two 5-year renewal options at market rate" htmlFor={`t-ren-${t.id}`}>
                <Input id={`t-ren-${t.id}`} value={t.renewalOptions} onChange={e => updateTenant(t.id, 'renewalOptions', e.target.value)} placeholder="Two 5-year options" />
              </FieldWithHelp>
              <FieldWithHelp label="Security Deposit ($)" helpText="Current security deposit held" htmlFor={`t-dep-${t.id}`}>
                <Input id={`t-dep-${t.id}`} type="number" value={t.securityDeposit} onChange={e => updateTenant(t.id, 'securityDeposit', e.target.value)} placeholder="7000" />
              </FieldWithHelp>
            </div>
            <FieldWithHelp label="Lease Notes (optional)" helpText="Co-tenancy clauses, exclusives, special provisions, or anything else the buyer should know" htmlFor={`t-notes-${t.id}`}>
              <Textarea id={`t-notes-${t.id}`} value={t.notes} onChange={e => updateTenant(t.id, 'notes', e.target.value)} rows={2} placeholder="Any special provisions, options, or notes..." />
            </FieldWithHelp>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────

function SimpleTransactionWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get('type');

  const initialType =
    preselectedType === 'residential' ? 'residential_real_estate' :
    preselectedType === 'commercial'  ? 'commercial_real_estate'  : '';

  const [step, setStep] = useState(initialType ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  const [data, setData] = useState<FormData>({
    assetTypeKey: initialType,
    assetFields: {},
    tenants: [],
    sellerName: '', sellerEmail: '',
    buyerName: '', buyerEmail: '',
    titleCompanyName: '', titleCompanyEmail: '',
    price: '', earnestMoney: '',
    inspectionDays: initialType === 'residential_real_estate' ? '10' : initialType === 'commercial_real_estate' ? '30' : '',
    closingDate: '', notes: '',
    covenants: initialType ? buildDefaultCovenants(initialType, {}) : {},
  });

  const isCommercial = data.assetTypeKey === 'commercial_real_estate';
  const isRealEstate = data.assetTypeKey === 'residential_real_estate' || isCommercial;
  const STEPS = isCommercial ? STEPS_COMMERCIAL : STEPS_BASE;
  const totalSteps = STEPS.length;

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setData(prev => ({ ...prev, [field]: value }));

  const updateAssetField = (key: string, value: string) =>
    setData(prev => ({ ...prev, assetFields: { ...prev.assetFields, [key]: value } }));

  const updateCovenant = (key: string, checked: boolean) =>
    setData(prev => ({ ...prev, covenants: { ...prev.covenants, [key]: checked } }));

  const selectAssetType = (typeKey: string) => {
    const isComm = typeKey === 'commercial_real_estate';
    setData(prev => ({
      ...prev,
      assetTypeKey: typeKey,
      covenants: buildDefaultCovenants(typeKey, prev.assetFields),
      inspectionDays: typeKey === 'residential_real_estate' ? '10' : isComm ? '30' : '',
    }));
  };

  const handleStateChange = (val: string) => {
    updateAssetField('state', val);
    const newFields = { ...data.assetFields, state: val };
    setData(prev => ({ ...prev, assetFields: newFields, covenants: buildDefaultCovenants(prev.assetTypeKey, newFields) }));
  };

  const typeDef = data.assetTypeKey ? ASSET_TYPES[data.assetTypeKey] : null;
  const selectedState = data.assetFields['state'];
  const showStateCovs = isRealEstate && selectedState && !!STATE_COVENANTS[selectedState];
  const price = parseFloat(data.price) || 0;
  const earnest = parseFloat(data.earnestMoney) || 0;
  const assetDescription = buildAssetDescription(data.assetTypeKey, data.assetFields);

  const agreedCovenantLabels = (): string[] => {
    const all: CovenantDef[] = [...STANDARD_COVENANTS];
    if (data.assetTypeKey === 'residential_real_estate') all.push(...RESIDENTIAL_COVENANTS);
    if (isCommercial) all.push(...COMMERCIAL_COVENANTS);
    if (selectedState && STATE_COVENANTS[selectedState]) all.push(...STATE_COVENANTS[selectedState]);
    return all.filter(c => data.covenants[c.key]).map(c => c.label);
  };

  // Step numbers shift for commercial (has extra Tenant Schedule step)
  const partiesStep  = isCommercial ? 4 : 3;
  const termsStep    = isCommercial ? 5 : 4;
  const reviewStep   = isCommercial ? 6 : 5;
  const confirmStep  = isCommercial ? 7 : 6;
  const doneStep     = isCommercial ? 8 : 7;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const contractType = isRealEstate ? 'REAL_ESTATE_PURCHASE' : 'SIMPLE_TRANSACTION';
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contractType,
          state: selectedState || null,
          titleCompany: data.titleCompanyName || null,
          titleCompanyEmail: data.titleCompanyEmail || null,
          wizardData: {
            assetTypeKey: data.assetTypeKey,
            assetFields: data.assetFields,
            tenants: isCommercial ? data.tenants : undefined,
            sellerName: data.sellerName, sellerEmail: data.sellerEmail,
            buyerName: data.buyerName, buyerEmail: data.buyerEmail,
            titleCompanyName: data.titleCompanyName || undefined,
            titleCompanyEmail: data.titleCompanyEmail || undefined,
            covenants: data.covenants,
            notes: data.notes,
            inspectionDays: data.inspectionDays,
            earnestMoney: data.earnestMoney,
            assetDescription,
            propertyAddress: data.assetFields.propertyAddress
              ? [data.assetFields.propertyAddress, data.assetFields.city, data.assetFields.state, data.assetFields.zipCode].filter(Boolean).join(', ')
              : undefined,
          },
          purchasePrice: price,
          earnestMoneyAmount: earnest || null,
          closingDate: data.closingDate ? new Date(data.closingDate) : null,
        }),
      });
      const contract = await res.json();
      setContractId(contract.id);
      toast.success('Agreement created! Both parties will receive email invitations.');
      setStep(doneStep);
    } catch {
      toast.error('Failed to create agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WizardProgress steps={STEPS} currentStep={step} estimatedMinutesRemaining={Math.max(1, (totalSteps - step) * 2)} />

      {/* Step 1 — Asset type (skipped if preselected) */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">What are you selling?</h1>
            <p className="text-muted-foreground mt-1">Select the type of asset being transferred.</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Real Estate</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(['residential_real_estate', 'commercial_real_estate'] as const).map(key => {
                const type = ASSET_TYPES[key];
                return (
                  <button key={key} type="button" onClick={() => selectAssetType(key)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/60 hover:bg-primary/5 ${data.assetTypeKey === key ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card'}`}>
                    <div className="text-2xl mb-2">{type.emoji}</div>
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Other Assets</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(['vehicle', 'business', 'personal_property', 'equipment', 'intellectual_property', 'other'] as const).map(key => {
                const type = ASSET_TYPES[key];
                return (
                  <button key={key} type="button" onClick={() => selectAssetType(key)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/60 hover:bg-primary/5 ${data.assetTypeKey === key ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card'}`}>
                    <div className="text-2xl mb-2">{type.emoji}</div>
                    <p className="font-semibold text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Asset details */}
      {step === 2 && typeDef && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{typeDef.emoji} {typeDef.label}</h1>
            <p className="text-muted-foreground mt-1">These details will appear in the agreement.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {typeDef.fields.map(field => (
                field.type === 'state-select' ? (
                  <FieldWithHelp key={field.key} label={field.label} helpText={field.help || field.label} required={field.required} htmlFor={`field-${field.key}`}>
                    <Select value={data.assetFields[field.key] || ''} onValueChange={handleStateChange}>
                      <SelectTrigger id={`field-${field.key}`}><SelectValue placeholder="Select a state..." /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        <SelectItem value="Outside US">Outside US</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldWithHelp>
                ) : (
                  <DynamicField key={field.key} field={field} value={data.assetFields[field.key] || ''} onChange={val => updateAssetField(field.key, val)} />
                )
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3 — Tenant schedule (commercial only) */}
      {isCommercial && step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">🏢 Tenant Schedule</h1>
            <p className="text-muted-foreground mt-1">List all current tenants and their lease details. This becomes part of the purchase agreement.</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <TenantEditor tenants={data.tenants} onChange={t => update('tenants', t)} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Parties step */}
      {step === partiesStep && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Who's involved?</h1>
            <p className="text-muted-foreground mt-1">We'll send each party an email link to review and confirm the agreement.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Seller</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldWithHelp label="Seller's full legal name" helpText="Full legal name of the seller" required htmlFor="sellerName">
                  <Input id="sellerName" placeholder="Jane Smith" value={data.sellerName} onChange={e => update('sellerName', e.target.value)} />
                </FieldWithHelp>
                <FieldWithHelp label="Seller's email" helpText="We'll send them a review link" required htmlFor="sellerEmail">
                  <Input id="sellerEmail" type="email" placeholder="jane@example.com" value={data.sellerEmail} onChange={e => update('sellerEmail', e.target.value)} />
                </FieldWithHelp>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Buyer</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FieldWithHelp label="Buyer's full legal name" helpText="Full legal name of the buyer" required htmlFor="buyerName">
                    <Input id="buyerName" placeholder="John Doe" value={data.buyerName} onChange={e => update('buyerName', e.target.value)} />
                  </FieldWithHelp>
                  <FieldWithHelp label="Buyer's email" helpText="We'll send them a review link" required htmlFor="buyerEmail">
                    <Input id="buyerEmail" type="email" placeholder="john@example.com" value={data.buyerEmail} onChange={e => update('buyerEmail', e.target.value)} />
                  </FieldWithHelp>
                </div>
              </div>
              {isRealEstate && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Title Company</p>
                    <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 rounded px-2 py-0.5">Recommended</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">The title company verifies title is clear, confirms funding, and coordinates closing. They'll receive a dedicated checklist of their required steps.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FieldWithHelp label="Title company name" helpText="Name of the title/escrow company" htmlFor="titleCompanyName">
                      <Input id="titleCompanyName" placeholder="Acme Title & Escrow" value={data.titleCompanyName} onChange={e => update('titleCompanyName', e.target.value)} />
                    </FieldWithHelp>
                    <FieldWithHelp label="Title company email" helpText="They'll receive their steps and can mark conditions as met" htmlFor="titleCompanyEmail">
                      <Input id="titleCompanyEmail" type="email" placeholder="closer@acmetitle.com" value={data.titleCompanyEmail} onChange={e => update('titleCompanyEmail', e.target.value)} />
                    </FieldWithHelp>
                  </div>
                </div>
              )}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-800"><strong>No account yet?</strong> No problem — parties can create a free ChainDeed account when they click the email link.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Terms & Legal step */}
      {step === termsStep && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Terms &amp; Legal</h1>
            <p className="text-muted-foreground mt-1">Set the price, timeline, and agree to applicable warranties.</p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FieldWithHelp label="Sale price" helpText="Total purchase price" required htmlFor="price" example="$450,000">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input id="price" type="number" className="pl-7" placeholder="450000" value={data.price} onChange={e => update('price', e.target.value)} />
                </div>
              </FieldWithHelp>

              {isRealEstate && (
                <FieldWithHelp label="Earnest money deposit" helpText="Initial deposit held in escrow. Applied toward purchase price at closing." htmlFor="earnestMoney">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="earnestMoney" type="number" className="pl-7" placeholder={isCommercial ? '45000' : '5000'} value={data.earnestMoney} onChange={e => update('earnestMoney', e.target.value)} />
                  </div>
                </FieldWithHelp>
              )}

              <FieldWithHelp label={`${isCommercial ? 'Due diligence' : 'Inspection'} period`} helpText={isCommercial ? 'Days for buyer to complete all physical, financial, legal, and environmental due diligence.' : 'Days for buyer to inspect the property.'} htmlFor="inspectionDays">
                <div className="flex items-center gap-2">
                  <Input id="inspectionDays" type="number" className="w-28" placeholder={isCommercial ? '30' : '10'} value={data.inspectionDays} onChange={e => update('inspectionDays', e.target.value)} />
                  <span className="text-sm text-muted-foreground">calendar days</span>
                </div>
              </FieldWithHelp>

              <FieldWithHelp label="Closing / completion deadline" helpText="Target date to close the transaction." htmlFor="closingDate">
                <Input id="closingDate" type="date" value={data.closingDate} onChange={e => update('closingDate', e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </FieldWithHelp>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-5">
              <CovenantSection title="Standard Warranties" covenants={STANDARD_COVENANTS} values={data.covenants} onChange={updateCovenant} />
              {data.assetTypeKey === 'residential_real_estate' && (
                <div className="border-t pt-5">
                  <CovenantSection title="Residential Real Estate Covenants" covenants={RESIDENTIAL_COVENANTS} values={data.covenants} onChange={updateCovenant} />
                </div>
              )}
              {isCommercial && (
                <div className="border-t pt-5">
                  <CovenantSection title="Commercial Real Estate Covenants" covenants={COMMERCIAL_COVENANTS} values={data.covenants} onChange={updateCovenant} />
                </div>
              )}
              {showStateCovs && selectedState && STATE_COVENANTS[selectedState] && (
                <div className="border-t pt-5">
                  <CovenantSection title={`${selectedState} State-Specific Requirements`} covenants={STATE_COVENANTS[selectedState]} values={data.covenants} onChange={updateCovenant} legalTag={`${selectedState} Law`} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FieldWithHelp label="Additional notes / special terms" helpText="Any other terms, conditions, or information both parties should know." htmlFor="notes">
                <Textarea id="notes" placeholder="Any additional terms..." rows={3} value={data.notes} onChange={e => update('notes', e.target.value)} />
              </FieldWithHelp>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Review step */}
      {step === reviewStep && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Review Your Agreement</h1>
            <p className="text-muted-foreground mt-1">Plain English summary — review carefully before confirming.</p>
          </div>
          <PlainEnglishSummary
            title="Plain English Summary"
            state={isRealEstate && ['OH', 'KY', 'IN'].includes(selectedState || '') ? selectedState : undefined}
            summary={`${data.sellerName || 'The seller'} agrees to transfer "${assetDescription || typeDef?.label || 'the asset'}" to ${data.buyerName || 'the buyer'} for ${formatCurrency(price)}.${earnest ? ` Earnest money deposit: ${formatCurrency(earnest)}.` : ''} The buyer's payment will be held securely until both parties confirm the transaction.${data.closingDate ? ` Closing deadline: ${new Date(data.closingDate).toLocaleDateString()}.` : ''}`}
            items={[
              { label: 'Asset type', value: typeDef?.label || '—' },
              { label: 'Asset', value: assetDescription || '—' },
              { label: 'Seller', value: data.sellerName ? `${data.sellerName} (${data.sellerEmail})` : '—' },
              { label: 'Buyer', value: data.buyerName ? `${data.buyerName} (${data.buyerEmail})` : '—' },
              { label: 'Purchase price', value: formatCurrency(price), highlight: true },
              ...(earnest ? [{ label: 'Earnest money', value: formatCurrency(earnest) }] : []),
              { label: isCommercial ? 'Due diligence period' : 'Inspection period', value: data.inspectionDays ? `${data.inspectionDays} days` : 'Not specified' },
              { label: 'Closing deadline', value: data.closingDate ? new Date(data.closingDate).toLocaleDateString() : 'No deadline set' },
              ...(isCommercial ? [{ label: 'Tenants on schedule', value: `${data.tenants.length}` }] : []),
              { label: 'Warranties agreed', value: `${agreedCovenantLabels().length} covenants` },
            ]}
            fees={[
              { label: 'Purchase price', amount: price, paidBy: 'buyer' },
              ...(earnest ? [{ label: 'Earnest money deposit', amount: earnest, paidBy: 'buyer' as const, note: 'Applied to purchase price at closing' }] : []),
              { label: 'Network processing fee', amount: 0.01, paidBy: 'buyer', note: '≈$0.01 — one-time fee for the digital record' },
            ]}
            whatHappensNext={[
              { step: 'Both parties receive email invitations to review', timeline: 'Within minutes' },
              { step: 'Buyer deposits earnest money into secure escrow', timeline: 'After both parties confirm' },
              ...(isCommercial ? [{ step: 'Due diligence period begins', timeline: `${data.inspectionDays || 30} calendar days` }] : [{ step: 'Inspection period begins', timeline: `${data.inspectionDays || 10} calendar days` }]),
              { step: 'Close transaction and confirm completion', timeline: `On or before ${data.closingDate ? new Date(data.closingDate).toLocaleDateString() : 'agreed closing date'}` },
              { step: 'Both parties receive executed PDF contract', timeline: 'Automatically at closing' },
            ]}
          />
        </div>
      )}

      {/* Confirm step */}
      {step === confirmStep && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Confirm and Create</h1>
            <p className="text-muted-foreground mt-1">Ready to create your digital agreement? Both parties will receive invitations.</p>
          </div>
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2 text-sm">
                {[
                  `Asset: ${assetDescription || typeDef?.label}`,
                  `From ${data.sellerName || 'seller'} to ${data.buyerName || 'buyer'}`,
                  `Price: ${formatCurrency(price)}`,
                  ...(earnest ? [`Earnest money: ${formatCurrency(earnest)}`] : []),
                  `Covenants agreed: ${agreedCovenantLabels().length}`,
                  ...(isCommercial ? [`Tenants on schedule: ${data.tenants.length}`] : []),
                ].map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">By creating this agreement, you confirm all details are correct and agree to ChainDeed's terms of service.</p>
              <Button size="lg" className="w-full" onClick={handleCreate} loading={loading}>
                Create Agreement — {formatCurrency(price)}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Done step */}
      {step === doneStep && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agreement Created!</h1>
              <p className="text-muted-foreground">Invitations sent to {data.sellerEmail}, {data.buyerEmail}{data.titleCompanyEmail ? `, and ${data.titleCompanyEmail}` : ''}</p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="font-semibold">What happens next:</p>
              {[
                { done: true, text: '✅ Digital agreement created and recorded' },
                { done: false, text: `📧 Email sent to ${data.sellerEmail} to confirm` },
                { done: false, text: `📧 Email sent to ${data.buyerEmail} to confirm` },
                ...(data.titleCompanyEmail ? [{ done: false, text: `📧 Email sent to ${data.titleCompanyEmail} (title company) with their checklist` }] : []),
                { done: false, text: '💰 Buyer deposits earnest money into secure escrow' },
                { done: false, text: isCommercial ? `🔍 ${data.inspectionDays || 30}-day due diligence period begins` : '🔍 Inspection period begins' },
                { done: false, text: '✅ Both parties confirm completion at closing' },
                { done: false, text: '📄 Both parties receive executed PDF contract automatically' },
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm ${item.done ? 'text-green-700' : 'text-muted-foreground'}`}>
                  {item.text}
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            {contractId && (
              <Button asChild className="flex-1">
                <a href={`/contracts/${contractId}`}>View Agreement <ArrowRight className="h-4 w-4 ml-2" /></a>
              </Button>
            )}
            <Button variant="outline" asChild className="flex-1">
              <a href="/account">My Account</a>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < doneStep && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1 || (!!initialType && step === 2)}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          {step < confirmStep && (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !data.assetTypeKey}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function SimpleTransactionPage() {
  return (
    <Suspense>
      <SimpleTransactionWizard />
    </Suspense>
  );
}
