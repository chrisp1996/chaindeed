'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WizardProgress } from '@/components/wizard/WizardProgress';
import { FieldWithHelp } from '@/components/wizard/FieldWithHelp';
import { PlainEnglishSummary } from '@/components/wizard/PlainEnglishSummary';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────
// Data definitions
// ─────────────────────────────────────────────────────────

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
};

const ASSET_TYPES: Record<string, AssetTypeDef> = {
  real_property: {
    label: 'Real Property',
    emoji: '🏠',
    description: 'House, land, condo, commercial building',
    fields: [
      { key: 'propertyAddress', label: 'Property Address', type: 'text', required: true, placeholder: '123 Main St' },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'state', label: 'State', type: 'state-select', required: true },
      { key: 'zipCode', label: 'ZIP Code', type: 'text', required: true },
      { key: 'apn', label: 'Parcel Number (APN)', type: 'text', help: 'Found on your tax bill or county records. Optional but recommended.' },
      { key: 'propertyType', label: 'Property Type', type: 'select', options: ['Single-family home', 'Multi-family (2-4 units)', 'Condo / Townhouse', 'Commercial', 'Land / Lot', 'Other'], required: true },
      { key: 'yearBuilt', label: 'Year Built', type: 'number', help: 'If built before 1978, federal lead paint disclosure is required.' },
      { key: 'legalDescription', label: 'Legal Description (optional)', type: 'textarea', help: 'Found on your current deed. Leave blank if unknown.' },
    ],
    hasStateCovenants: true,
  },
  vehicle: {
    label: 'Vehicle',
    emoji: '🚗',
    description: 'Car, truck, motorcycle, boat, RV, trailer',
    fields: [
      { key: 'vehicleYear', label: 'Year', type: 'number', required: true },
      { key: 'vehicleMake', label: 'Make', type: 'text', required: true, placeholder: 'Toyota' },
      { key: 'vehicleModel', label: 'Model', type: 'text', required: true, placeholder: 'Camry' },
      { key: 'vin', label: 'VIN / Serial Number', type: 'text', required: true, help: '17-character number found on dashboard or door jamb' },
      { key: 'odometer', label: 'Odometer Reading (miles)', type: 'number', required: true },
      { key: 'titleNumber', label: 'Title Number', type: 'text', help: 'Found on the paper title' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'For parts only'], required: true },
      { key: 'knownIssues', label: 'Known Issues (if any)', type: 'textarea', placeholder: 'List any known defects, damage, or issues...' },
    ],
    hasStateCovenants: false,
  },
  business: {
    label: 'Business / Business Assets',
    emoji: '💼',
    description: 'Business sale, asset purchase, inventory transfer',
    fields: [
      { key: 'businessName', label: 'Business Name', type: 'text', required: true },
      { key: 'businessType', label: 'Business Type', type: 'select', options: ['Sole proprietorship', 'LLC', 'Corporation (Inc.)', 'Partnership', 'Asset sale only'], required: true },
      { key: 'ein', label: 'EIN / Tax ID (optional)', type: 'text', help: 'Employer Identification Number from IRS' },
      { key: 'assetsIncluded', label: 'Assets Included in Sale', type: 'textarea', required: true, placeholder: 'List all assets: equipment, inventory, customer lists, intellectual property, furniture, vehicles...' },
      { key: 'liabilitiesAssumed', label: 'Liabilities Buyer is Assuming (if any)', type: 'textarea', placeholder: 'List any debts or obligations the buyer is taking on. Leave blank if none.' },
      { key: 'nonCompetePeriod', label: 'Seller Non-Compete Period', type: 'select', options: ['None', '6 months', '1 year', '2 years', '3 years', '5 years'] },
      { key: 'nonCompeteArea', label: 'Non-Compete Geographic Area', type: 'text', placeholder: 'e.g. Hamilton County, Ohio', help: 'Only required if a non-compete period is selected' },
      { key: 'transitionPeriod', label: 'Transition Assistance (days)', type: 'select', options: ['None', '7 days', '14 days', '30 days', '60 days', '90 days'], help: 'How long will the seller help train/transition the buyer?' },
    ],
    hasStateCovenants: false,
  },
  personal_property: {
    label: 'Personal Property',
    emoji: '📦',
    description: 'Furniture, art, jewelry, collectibles, antiques',
    fields: [
      { key: 'itemName', label: 'Item Name', type: 'text', required: true, placeholder: 'Antique oak dining table' },
      { key: 'itemDescription', label: 'Full Description', type: 'textarea', required: true, placeholder: 'Describe the item in detail: dimensions, materials, age, markings, provenance...' },
      { key: 'serialNumber', label: 'Serial Number (if applicable)', type: 'text' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['New (never used)', 'Like new', 'Good', 'Fair', 'Poor'], required: true },
      { key: 'photosCid', label: 'Photo Description (optional)', type: 'textarea', placeholder: 'Describe what photos are available or have been shared with the buyer...' },
    ],
    hasStateCovenants: false,
  },
  equipment: {
    label: 'Equipment / Machinery',
    emoji: '⚙️',
    description: 'Industrial equipment, tools, technology, farm equipment',
    fields: [
      { key: 'equipmentName', label: 'Equipment Name', type: 'text', required: true, placeholder: 'John Deere 5075E Tractor' },
      { key: 'manufacturer', label: 'Manufacturer / Brand', type: 'text', required: true },
      { key: 'modelNumber', label: 'Model Number', type: 'text', required: true },
      { key: 'serialNumber', label: 'Serial Number', type: 'text', required: true },
      { key: 'yearManufactured', label: 'Year Manufactured', type: 'number' },
      { key: 'hoursUsage', label: 'Hours / Usage', type: 'text', placeholder: 'e.g. 1,200 hours, 45,000 miles' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good — fully functional', 'Fair — minor issues', 'Poor — needs repair', 'For parts / as-is'], required: true },
      { key: 'knownIssues', label: 'Known Issues (if any)', type: 'textarea', placeholder: 'Describe any defects, required maintenance, or issues...' },
      { key: 'includesAccessories', label: 'Accessories / Attachments Included', type: 'textarea', placeholder: 'List any included accessories, attachments, manuals, spare parts...' },
    ],
    hasStateCovenants: false,
  },
  intellectual_property: {
    label: 'Intellectual Property',
    emoji: '💡',
    description: 'Patent, trademark, copyright, software, domain name',
    fields: [
      { key: 'ipType', label: 'Type of IP', type: 'select', options: ['Patent', 'Trademark', 'Copyright', 'Trade secret', 'Software / source code', 'Domain name', 'Brand / business name', 'Other'], required: true },
      { key: 'ipName', label: 'Name / Title', type: 'text', required: true, placeholder: 'Name of the patent, trademark, software, etc.' },
      { key: 'registrationNumber', label: 'Registration Number (if registered)', type: 'text', help: 'USPTO patent number, trademark registration, copyright registration, etc.' },
      { key: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe what is being transferred in detail...' },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', placeholder: 'e.g. United States', help: 'Where this IP is registered or protected' },
      { key: 'includesSourceCode', label: 'What Is Included', type: 'textarea', placeholder: 'List all included assets: code, documentation, domains, accounts, licenses...' },
    ],
    hasStateCovenants: false,
  },
  other: {
    label: 'Other',
    emoji: '📝',
    description: 'Something not listed above',
    fields: [
      { key: 'assetName', label: 'What is being sold?', type: 'text', required: true, placeholder: 'Brief name of the asset' },
      { key: 'assetDescription', label: 'Full Description', type: 'textarea', required: true, placeholder: 'Describe the item or asset in detail. Include any identifying information, condition, and what is included in the sale...' },
      { key: 'assetCategory', label: 'Category (helps us pick the right legal language)', type: 'text', placeholder: 'e.g. livestock, mineral rights, membership interest...' },
    ],
    hasStateCovenants: false,
  },
};

type CovenantDef = {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
  required?: boolean;
  legalBasis?: string;
  conditionalOn?: string;
};

const STANDARD_COVENANTS: CovenantDef[] = [
  { key: 'sellerOwnership', label: 'Seller warrants they own this asset free and clear', description: 'The seller confirms they have full legal right to sell this item and that no one else has a claim to it.', defaultOn: true, required: true },
  { key: 'noLiens', label: 'No undisclosed liens or encumbrances', description: 'The seller confirms there are no outstanding loans, judgments, or claims against this asset that the buyer has not been told about.', defaultOn: true, required: true },
  { key: 'asDescribed', label: 'Asset is as described above', description: 'The seller confirms the asset matches the description provided. Any known defects have been disclosed.', defaultOn: true, required: true },
  { key: 'buyerRightToInspect', label: "Buyer's right to inspect before payment releases", description: 'The buyer has the right to verify the asset matches the description before funds are released from escrow.', defaultOn: true, required: false },
];

const REAL_PROPERTY_COVENANTS: CovenantDef[] = [
  { key: 'titleWarranty', label: 'General warranty of title', description: 'Seller warrants and defends the title against all claims, both past and future. This is the strongest form of title protection for a buyer.', defaultOn: true },
  { key: 'sellerDisclosure', label: 'Seller disclosure of known defects', description: 'The seller has disclosed all known material defects affecting the property. A separate written disclosure form will be provided.', defaultOn: true, required: true },
  { key: 'leadPaintDisclosure', label: 'Lead paint disclosure (required if built before 1978)', description: 'Federal law requires sellers of homes built before 1978 to disclose known lead paint hazards and provide buyers with an EPA-approved pamphlet.', defaultOn: false, conditionalOn: 'yearBuilt<1978' },
  { key: 'inspectionContingency', label: 'Inspection contingency', description: 'The buyer has the right to have the property professionally inspected. If significant issues are found, the buyer may negotiate repairs or cancel the agreement.', defaultOn: true },
  { key: 'titleSearch', label: 'Title search required before closing', description: 'A title search will be performed to confirm the seller has clear title and identify any liens or encumbrances.', defaultOn: true, required: true },
  { key: 'prorationOfTaxes', label: 'Property taxes prorated at closing', description: 'Property taxes for the current year will be divided between buyer and seller based on the closing date.', defaultOn: true },
];

const STATE_COVENANTS: Record<string, CovenantDef[]> = {
  OH: [
    { key: 'orc530230', label: 'Ohio ORC 5302.30 Residential Property Disclosure', description: 'Ohio law requires sellers of residential property to complete and deliver a Residential Property Disclosure Form (ORC 5302.30) to the buyer before the purchase agreement is signed.', defaultOn: true, required: true, legalBasis: 'Ohio Revised Code § 5302.30' },
    { key: 'ohConveyanceFee', label: 'Ohio conveyance fee acknowledged ($1 per $1,000 of sale price)', description: 'Ohio charges a conveyance fee (deed transfer tax) of approximately $1 per $1,000 of the sale price, split between buyer and seller per county custom.', defaultOn: true, legalBasis: 'Ohio Revised Code § 319.54' },
    { key: 'ohLeadPaint', label: 'Ohio lead paint pamphlet provided (if pre-1978)', description: 'For homes built before 1978, seller confirms the EPA "Protect Your Family from Lead in Your Home" pamphlet has been provided to the buyer.', defaultOn: false, legalBasis: 'EPA/HUD Lead Disclosure Rule 40 CFR 745' },
  ],
  KY: [
    { key: 'kyAttorneyClosing', label: 'Kentucky attorney-supervised closing required', description: 'Kentucky requires a licensed attorney to supervise real estate closings. The parties agree to use a Kentucky-licensed attorney to prepare and review closing documents.', defaultOn: true, required: true, legalBasis: 'KRS Chapter 324 — Kentucky Real Estate Law' },
    { key: 'kyTransferTax', label: 'Kentucky transfer tax acknowledged ($0.50 per $500)', description: "Kentucky's transfer tax of $0.50 per $500 of the sale price is paid by the seller and collected at closing.", defaultOn: true, legalBasis: 'KRS § 142.050' },
    { key: 'kyPVANotification', label: 'PVA notification after closing', description: 'The deed will be recorded with the County Clerk and a copy provided to the Property Valuation Administrator (PVA) for tax assessment purposes.', defaultOn: true, legalBasis: 'KRS § 132.220' },
    { key: 'kySellerDisclosure', label: "Kentucky Seller's Disclosure of Property Condition", description: "The seller has completed Kentucky's Seller's Disclosure of Property Condition form as required for residential real estate transactions.", defaultOn: true, required: true, legalBasis: 'KRS § 324.360' },
  ],
  IN: [
    { key: 'inSalesDisclosure', label: 'Indiana Sales Disclosure Form 46021 required', description: 'Indiana requires the seller to complete Sales Disclosure Form 46021 and file it with the county assessor at closing. This form must be completed before the deed can be recorded.', defaultOn: true, required: true, legalBasis: 'IC § 6-1.1-5.5' },
    { key: 'inSellerDisclosure', label: "Indiana Seller's Residential Real Estate Sales Disclosure", description: "The seller has completed Indiana's Seller's Residential Real Estate Sales Disclosure form and delivered it to the buyer.", defaultOn: true, required: true, legalBasis: 'IC § 32-21-5-7' },
    { key: 'inSalesFee', label: 'Indiana Sales Disclosure Fee acknowledged ($0.10 per $100)', description: 'Indiana charges a Sales Disclosure Fee of $0.10 per $100 of sale price, paid by the seller.', defaultOn: true, legalBasis: 'IC § 6-1.1-5.5-3' },
    { key: 'inHomesteadReminder', label: 'Indiana Homestead Deduction reminder', description: 'The buyer is advised to file for the Indiana Homestead Standard Deduction (up to 60% AV or $45,000) with the County Auditor by December 31 of the year of purchase, if using the home as a primary residence.', defaultOn: true, legalBasis: 'IC § 6-1.1-12-17' },
  ],
};

// ─────────────────────────────────────────────────────────
// Wizard step definitions
// ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, name: 'Asset type' },
  { id: 2, name: 'Asset details' },
  { id: 3, name: "Who's involved" },
  { id: 4, name: 'Terms & legal' },
  { id: 5, name: 'Review' },
  { id: 6, name: 'Confirm' },
  { id: 7, name: 'Done' },
];

// ─────────────────────────────────────────────────────────
// Form data interface
// ─────────────────────────────────────────────────────────

interface FormData {
  assetTypeKey: string;
  assetFields: Record<string, string>;
  sellerName: string;
  sellerEmail: string;
  buyerName: string;
  buyerEmail: string;
  price: string;
  inspectionDays: string;
  closingDate: string;
  notes: string;
  covenants: Record<string, boolean>;
}

function buildDefaultCovenants(typeKey: string, assetFields: Record<string, string>): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const c of STANDARD_COVENANTS) {
    result[c.key] = c.defaultOn;
  }

  if (typeKey === 'real_property') {
    for (const c of REAL_PROPERTY_COVENANTS) {
      if (c.conditionalOn === 'yearBuilt<1978') {
        const yr = parseInt(assetFields['yearBuilt'] || '9999', 10);
        result[c.key] = yr < 1978;
      } else {
        result[c.key] = c.defaultOn;
      }
    }

    const state = assetFields['state'];
    if (state && STATE_COVENANTS[state]) {
      for (const c of STATE_COVENANTS[state]) {
        result[c.key] = c.defaultOn;
      }
    }
  }

  return result;
}

function getInspectionDefault(typeKey: string): string {
  if (typeKey === 'real_property') return '10';
  if (typeKey === 'vehicle') return '3';
  return '';
}

// ─────────────────────────────────────────────────────────
// Covenant checkbox section component
// ─────────────────────────────────────────────────────────

function CovenantSection({
  title,
  covenants,
  values,
  onChange,
  legalTag,
}: {
  title: string;
  covenants: CovenantDef[];
  values: Record<string, boolean>;
  onChange: (key: string, checked: boolean) => void;
  legalTag?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
        {legalTag && (
          <span className="text-xs bg-sky-100 text-sky-700 border border-sky-200 rounded px-2 py-0.5">{legalTag}</span>
        )}
      </div>
      <div className="space-y-3">
        {covenants.map((cov) => (
          <div key={cov.key} className="flex items-start gap-3 rounded-lg border bg-card p-3">
            <Checkbox
              id={`cov-${cov.key}`}
              checked={values[cov.key] ?? cov.defaultOn}
              onCheckedChange={(checked) => !cov.required && onChange(cov.key, Boolean(checked))}
              disabled={cov.required}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label
                htmlFor={`cov-${cov.key}`}
                className={`text-sm font-medium leading-snug ${cov.required ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {cov.label}
                {cov.required && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(required)</span>
                )}
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cov.description}</p>
              {cov.legalBasis && (
                <p className="text-xs text-sky-600 mt-1 font-medium">{cov.legalBasis}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Dynamic field renderer
// ─────────────────────────────────────────────────────────

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (val: string) => void;
}) {
  const id = `field-${field.key}`;

  const inner = (() => {
    if (field.type === 'textarea') {
      return (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      );
    }

    if (field.type === 'state-select') {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select a state..." />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
            <SelectItem value="Outside US">Outside US</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        id={id}
        type={field.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  })();

  return (
    <FieldWithHelp
      label={field.label}
      helpText={field.help || field.label}
      required={field.required}
      htmlFor={id}
    >
      {inner}
    </FieldWithHelp>
  );
}

// ─────────────────────────────────────────────────────────
// Build a human-readable asset description from fields
// ─────────────────────────────────────────────────────────

function buildAssetDescription(typeKey: string, fields: Record<string, string>): string {
  if (!typeKey) return '';
  const typeDef = ASSET_TYPES[typeKey];
  if (!typeDef) return '';

  switch (typeKey) {
    case 'real_property': {
      const addr = [fields.propertyAddress, fields.city, fields.state, fields.zipCode].filter(Boolean).join(', ');
      return `${fields.propertyType || 'Real property'} at ${addr || '(address not specified)'}`;
    }
    case 'vehicle':
      return `${fields.vehicleYear || ''} ${fields.vehicleMake || ''} ${fields.vehicleModel || ''}`.trim() || 'Vehicle';
    case 'business':
      return fields.businessName || 'Business';
    case 'personal_property':
      return fields.itemName || 'Personal property item';
    case 'equipment':
      return fields.equipmentName || 'Equipment';
    case 'intellectual_property':
      return `${fields.ipType ? fields.ipType + ': ' : ''}${fields.ipName || 'Intellectual property'}`;
    case 'other':
      return fields.assetName || 'Asset';
    default:
      return typeDef.label;
  }
}

// ─────────────────────────────────────────────────────────
// Main wizard component
// ─────────────────────────────────────────────────────────

export default function SimpleTransactionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);

  const [data, setData] = useState<FormData>({
    assetTypeKey: '',
    assetFields: {},
    sellerName: '',
    sellerEmail: '',
    buyerName: '',
    buyerEmail: '',
    price: '',
    inspectionDays: '',
    closingDate: '',
    notes: '',
    covenants: {},
  });

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const updateAssetField = (key: string, value: string) =>
    setData((prev) => ({ ...prev, assetFields: { ...prev.assetFields, [key]: value } }));

  const updateCovenant = (key: string, checked: boolean) =>
    setData((prev) => ({ ...prev, covenants: { ...prev.covenants, [key]: checked } }));

  const selectAssetType = (typeKey: string) => {
    const defaults = buildDefaultCovenants(typeKey, data.assetFields);
    const inspDays = getInspectionDefault(typeKey);
    setData((prev) => ({
      ...prev,
      assetTypeKey: typeKey,
      covenants: defaults,
      inspectionDays: inspDays,
    }));
  };

  const price = parseFloat(data.price) || 0;
  const networkFee = 0.01;

  const typeDef = data.assetTypeKey ? ASSET_TYPES[data.assetTypeKey] : null;
  const selectedState = data.assetFields['state'];
  const showStateCovs =
    data.assetTypeKey === 'real_property' &&
    selectedState &&
    !!STATE_COVENANTS[selectedState];

  // Rebuild covenant defaults when state changes for real_property
  const handleStateChange = (val: string) => {
    updateAssetField('state', val);
    if (data.assetTypeKey === 'real_property') {
      const newFields = { ...data.assetFields, state: val };
      const newCovenants = buildDefaultCovenants(data.assetTypeKey, newFields);
      setData((prev) => ({
        ...prev,
        assetFields: newFields,
        covenants: newCovenants,
      }));
    }
  };

  const agreedCovenantLabels = (): string[] => {
    const all: CovenantDef[] = [...STANDARD_COVENANTS];
    if (data.assetTypeKey === 'real_property') {
      all.push(...REAL_PROPERTY_COVENANTS);
      if (selectedState && STATE_COVENANTS[selectedState]) {
        all.push(...STATE_COVENANTS[selectedState]);
      }
    }
    return all.filter((c) => data.covenants[c.key]).map((c) => c.label);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SIMPLE_TRANSACTION',
          wizardData: {
            assetTypeKey: data.assetTypeKey,
            assetFields: data.assetFields,
            sellerName: data.sellerName,
            sellerEmail: data.sellerEmail,
            buyerName: data.buyerName,
            buyerEmail: data.buyerEmail,
            covenants: data.covenants,
            notes: data.notes,
            inspectionDays: data.inspectionDays,
          },
          purchasePrice: price,
          closingDate: data.closingDate ? new Date(data.closingDate) : null,
        }),
      });
      const contract = await res.json();
      setContractId(contract.id);
      toast.success('Agreement created! Both parties will receive email invitations.');
      setStep(7);
    } catch {
      toast.error('Failed to create agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const assetDescription = buildAssetDescription(data.assetTypeKey, data.assetFields);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <WizardProgress
        steps={STEPS}
        currentStep={step}
        estimatedMinutesRemaining={Math.max(1, (STEPS.length - step) * 2)}
      />

      {/* ── Step 1: Select asset type ── */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">What are you selling?</h1>
            <p className="text-muted-foreground mt-1">Select the type of asset being transferred.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(ASSET_TYPES).map(([key, type]) => (
              <button
                key={key}
                type="button"
                onClick={() => selectAssetType(key)}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/60 hover:bg-primary/5 ${
                  data.assetTypeKey === key
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border bg-card'
                }`}
              >
                <div className="text-2xl mb-2">{type.emoji}</div>
                <p className="font-semibold text-sm leading-snug">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Asset details ── */}
      {step === 2 && typeDef && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">
              {typeDef.emoji} {typeDef.label} Details
            </h1>
            <p className="text-muted-foreground mt-1">
              Tell us about the asset. These details will appear in the agreement.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {typeDef.fields.map((field) => {
                if (field.type === 'state-select') {
                  return (
                    <FieldWithHelp
                      key={field.key}
                      label={field.label}
                      helpText={field.help || field.label}
                      required={field.required}
                      htmlFor={`field-${field.key}`}
                    >
                      <Select
                        value={data.assetFields[field.key] || ''}
                        onValueChange={handleStateChange}
                      >
                        <SelectTrigger id={`field-${field.key}`}>
                          <SelectValue placeholder="Select a state..." />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                          <SelectItem value="Outside US">Outside US</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldWithHelp>
                  );
                }
                return (
                  <DynamicField
                    key={field.key}
                    field={field}
                    value={data.assetFields[field.key] || ''}
                    onChange={(val) => updateAssetField(field.key, val)}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 3: Who's involved ── */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Who's involved?</h1>
            <p className="text-muted-foreground mt-1">
              We'll send each party an email link to review and confirm the agreement.
            </p>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Seller (person transferring the asset)
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldWithHelp
                  label="Seller's name"
                  helpText="Full legal name of the person selling the asset"
                  required
                  htmlFor="sellerName"
                >
                  <Input
                    id="sellerName"
                    placeholder="Jane Smith"
                    value={data.sellerName}
                    onChange={(e) => update('sellerName', e.target.value)}
                  />
                </FieldWithHelp>
                <FieldWithHelp
                  label="Seller's email"
                  helpText="We'll email them a link to review and confirm"
                  required
                  htmlFor="sellerEmail"
                >
                  <Input
                    id="sellerEmail"
                    type="email"
                    placeholder="jane@example.com"
                    value={data.sellerEmail}
                    onChange={(e) => update('sellerEmail', e.target.value)}
                  />
                </FieldWithHelp>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Buyer (person receiving the asset)
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FieldWithHelp
                    label="Buyer's name"
                    helpText="Full legal name of the person buying the asset"
                    required
                    htmlFor="buyerName"
                  >
                    <Input
                      id="buyerName"
                      placeholder="John Doe"
                      value={data.buyerName}
                      onChange={(e) => update('buyerName', e.target.value)}
                    />
                  </FieldWithHelp>
                  <FieldWithHelp
                    label="Buyer's email"
                    helpText="We'll email them a link to review and confirm"
                    required
                    htmlFor="buyerEmail"
                  >
                    <Input
                      id="buyerEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={data.buyerEmail}
                      onChange={(e) => update('buyerEmail', e.target.value)}
                    />
                  </FieldWithHelp>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-800">
                  <strong>Don't have a wallet address yet?</strong> No problem. We'll send email
                  links — parties can create their secure account when they click the link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 4: Terms & Legal ── */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Terms &amp; Legal</h1>
            <p className="text-muted-foreground mt-1">
              Set the price, timeline, and agree to applicable warranties and covenants.
            </p>
          </div>

          {/* Financial terms */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FieldWithHelp
                label="Sale price"
                helpText="The total price the buyer will pay. Funds are held securely until both parties confirm completion."
                required
                htmlFor="price"
                example="$15,000"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="price"
                    type="number"
                    className="pl-7"
                    placeholder="15000"
                    value={data.price}
                    onChange={(e) => update('price', e.target.value)}
                  />
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label={`Inspection period${data.assetTypeKey === 'real_property' || data.assetTypeKey === 'vehicle' ? '' : ' (optional)'}`}
                helpText="How many days does the buyer have to inspect the asset before the sale is final?"
                htmlFor="inspectionDays"
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="inspectionDays"
                    type="number"
                    className="w-28"
                    placeholder={data.assetTypeKey === 'real_property' ? '10' : data.assetTypeKey === 'vehicle' ? '3' : '—'}
                    value={data.inspectionDays}
                    onChange={(e) => update('inspectionDays', e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </FieldWithHelp>

              <FieldWithHelp
                label="Completion deadline"
                helpText="If the transaction isn't completed by this date, the buyer can request an automatic refund."
                htmlFor="closingDate"
              >
                <Input
                  id="closingDate"
                  type="date"
                  value={data.closingDate}
                  onChange={(e) => update('closingDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FieldWithHelp>
            </CardContent>
          </Card>

          {/* Standard covenants */}
          <Card>
            <CardContent className="pt-6 space-y-5">
              <CovenantSection
                title="Standard Warranties"
                covenants={STANDARD_COVENANTS}
                values={data.covenants}
                onChange={updateCovenant}
              />

              {data.assetTypeKey === 'real_property' && (
                <>
                  <div className="border-t pt-5">
                    <CovenantSection
                      title="Real Property Covenants"
                      covenants={REAL_PROPERTY_COVENANTS}
                      values={data.covenants}
                      onChange={updateCovenant}
                    />
                  </div>

                  {showStateCovs && selectedState && STATE_COVENANTS[selectedState] && (
                    <div className="border-t pt-5">
                      <CovenantSection
                        title={`${selectedState} State-Specific Requirements`}
                        covenants={STATE_COVENANTS[selectedState]}
                        values={data.covenants}
                        onChange={updateCovenant}
                        legalTag={`${selectedState} Law`}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional notes */}
          <Card>
            <CardContent className="pt-6">
              <FieldWithHelp
                label="Additional notes"
                helpText="Any other terms, warranties, or information both parties should know."
                htmlFor="notes"
              >
                <Textarea
                  id="notes"
                  placeholder="Any additional terms or notes..."
                  rows={3}
                  value={data.notes}
                  onChange={(e) => update('notes', e.target.value)}
                />
              </FieldWithHelp>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Review Your Agreement</h1>
            <p className="text-muted-foreground mt-1">
              Here's what this agreement says in plain English. Review carefully before confirming.
            </p>
          </div>

          <PlainEnglishSummary
            title="Plain English Summary"
            state={
              data.assetTypeKey === 'real_property' && ['OH', 'KY', 'IN'].includes(selectedState || '')
                ? selectedState
                : undefined
            }
            summary={`${data.sellerName || 'The seller'} agrees to transfer "${assetDescription || typeDef?.label || 'the asset'}" to ${data.buyerName || 'the buyer'} for ${formatCurrency(price)}. The buyer's payment will be held securely until both parties confirm the transaction is complete.${data.closingDate ? ` The deadline for completion is ${new Date(data.closingDate).toLocaleDateString()}.` : ''}`}
            items={[
              { label: 'Asset type', value: typeDef?.label || '—' },
              { label: 'Asset', value: assetDescription || '—' },
              { label: 'Seller', value: data.sellerName && data.sellerEmail ? `${data.sellerName} (${data.sellerEmail})` : data.sellerName || '—' },
              { label: 'Buyer', value: data.buyerName && data.buyerEmail ? `${data.buyerName} (${data.buyerEmail})` : data.buyerName || '—' },
              { label: 'Sale price', value: formatCurrency(price), highlight: true },
              { label: 'Inspection period', value: data.inspectionDays ? `${data.inspectionDays} days` : 'Not specified' },
              { label: 'Deadline', value: data.closingDate ? new Date(data.closingDate).toLocaleDateString() : 'No deadline set' },
              { label: 'Warranties agreed', value: `${agreedCovenantLabels().length} covenant${agreedCovenantLabels().length !== 1 ? 's' : ''}` },
            ]}
            fees={[
              { label: 'Sale price', amount: price, paidBy: 'buyer' },
              { label: 'Network processing fee', amount: networkFee, paidBy: 'buyer', note: '≈$0.01 — one-time fee for creating the digital record' },
            ]}
            whatHappensNext={[
              { step: 'Both parties receive email invitations to review and confirm', timeline: 'Within minutes of creating the agreement' },
              { step: 'Buyer deposits funds into secure hold', timeline: 'After both parties confirm' },
              { step: 'Complete the transaction and confirm', timeline: 'Per your agreed conditions' },
              { step: 'Funds automatically release to seller', timeline: 'Once both parties confirm completion' },
            ]}
          />
        </div>
      )}

      {/* ── Step 6: Confirm & Create ── */}
      {step === 6 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold">Confirm and Create</h1>
            <p className="text-muted-foreground mt-1">
              Ready to create your digital agreement? This will send invitations to both parties.
            </p>
          </div>
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2 text-sm">
                {[
                  `Asset: ${assetDescription || typeDef?.label || data.assetTypeKey}`,
                  `From ${data.sellerName || 'seller'} to ${data.buyerName || 'buyer'}`,
                  `Price: ${formatCurrency(price)}`,
                  `Warranties agreed: ${agreedCovenantLabels().length}`,
                  `Network fee: ≈$0.01`,
                ].map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                By creating this agreement, you confirm all details are correct and you agree to
                ChainDeed's terms of service.
              </p>
              <Button size="lg" className="w-full" onClick={handleCreate} loading={loading}>
                Create Agreement — {formatCurrency(price)} + $0.01 fee
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 7: Success ── */}
      {step === 7 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agreement Created!</h1>
              <p className="text-muted-foreground">
                Invitations sent to {data.sellerEmail} and {data.buyerEmail}
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <p className="font-semibold">What happens next:</p>
              {[
                { done: true, text: '✅ Digital agreement created and recorded' },
                { done: false, text: `📧 Email sent to ${data.sellerEmail} to confirm` },
                { done: false, text: `📧 Email sent to ${data.buyerEmail} to confirm` },
                { done: false, text: '💰 Buyer deposits funds into secure hold' },
                { done: false, text: '✅ Both parties confirm completion' },
                { done: false, text: '🎉 Funds automatically released to seller' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-sm ${item.done ? 'text-green-700' : 'text-muted-foreground'}`}
                >
                  {item.text}
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            {contractId && (
              <Button asChild className="flex-1">
                <a href={`/contracts/${contractId}`}>
                  View Agreement <ArrowRight className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
            <Button variant="outline" asChild className="flex-1">
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      {step < 7 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          {step < 6 && (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !data.assetTypeKey}
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
