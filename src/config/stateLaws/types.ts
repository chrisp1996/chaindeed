export interface TransferTax {
  rate: number; // per $1,000 of sale price
  paidBy: 'buyer' | 'seller' | 'split' | 'negotiable';
  exemptions: string[];
  notes: string;
}

export interface Disclosure {
  key: string;
  title: string;
  description: string;
  legalBasis: string;
  required: boolean;
  appliesTo: 'all' | 'pre_1978' | 'residential' | 'commercial';
  formUrl?: string;
  buyerRescissionPeriodDays?: number;
}

export interface WaitingPeriod {
  key: string;
  description: string;
  days: number;
  afterEvent: string;
}

export interface ContractClause {
  key: string;
  title: string;
  text: string;
  required: boolean;
  legalBasis?: string;
}

export interface RecordingRequirement {
  office: string;
  eRecordingAvailable: boolean;
  eRecordingNotes: string;
  baseFee: number;
  additionalPageFee: number;
  additionalForms: string[];
  directoryUrl: string;
}

export interface OffChainStep {
  key: string;
  title: string;
  plainEnglishTitle: string;
  description: string;
  whyRequired: string;
  legalBasis?: string;
  howToComplete: string[];
  responsibility: 'buyer' | 'seller' | 'both' | 'title_company' | 'attorney';
  estimatedCost?: string;
  estimatedTime?: string;
  documents?: string[];
  isRequired: boolean;
  isBlocker: boolean; // blocks on-chain progress if not complete
  sortOrder: number;
  officialLinks?: { label: string; url: string }[];
  notes?: string;
}

export interface HomesteadInfo {
  available: boolean;
  maxExemption: number;
  eligibility: string;
  deadline: string;
  filingOffice: string;
  formUrl?: string;
  notes: string;
}

export interface DeedType {
  key: string;
  name: string;
  description: string;
  covenants: string;
  commonUse: string;
}

export interface StateConfig {
  state: string;
  abbreviation: string;
  closingType: 'title_company' | 'attorney' | 'either';
  transferTax: TransferTax;
  requiredDisclosures: Disclosure[];
  mandatoryWaitingPeriods: WaitingPeriod[];
  requiredContractClauses: ContractClause[];
  recordingRequirements: RecordingRequirement;
  offChainSteps: OffChainStep[];
  attorneyRequirement: boolean;
  homesteadExemption: HomesteadInfo;
  deedTypes: DeedType[];
  notaryRequired: boolean;
  eRecordingEnabled: boolean;
  taxProrationCustom: string;
  additionalNotes: string;
}
