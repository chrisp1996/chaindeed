import type { StateConfig } from './types';

export const kentuckyConfig: StateConfig = {
  state: 'Kentucky',
  abbreviation: 'KY',
  closingType: 'attorney',
  transferTax: {
    rate: 1.0, // $0.50 per $500 = $1 per $1,000
    paidBy: 'seller',
    exemptions: [
      'Transfers between spouses',
      'Transfers to/from governmental entities',
      'Transfers between parent and child (with limitations)',
      'Transfers by gift',
    ],
    notes:
      'Kentucky transfer tax is $0.50 per $500 of consideration (0.1% of sale price). Paid by seller unless otherwise negotiated. Tax stamps must be affixed to the deed or amount noted. Calculated on total consideration.',
  },
  requiredDisclosures: [
    {
      key: 'ky_material_defects',
      title: 'Known Material Defects Disclosure',
      description:
        'While Kentucky does not have a mandatory seller disclosure form, sellers must disclose known material defects that would not be discoverable by a reasonable inspection.',
      legalBasis: 'Kentucky Common Law — Sellers must disclose latent material defects',
      required: true,
      appliesTo: 'residential',
      buyerRescissionPeriodDays: 0,
    },
    {
      key: 'ky_residential_condition',
      title: 'Residential Property Condition Report (Recommended)',
      description:
        'The Kentucky Association of Realtors (KAR) recommends sellers complete a Residential Property Condition Report, though it is not legally required.',
      legalBasis: 'Kentucky Association of Realtors recommendation',
      required: false,
      appliesTo: 'residential',
      formUrl: 'https://www.kar.com',
    },
    {
      key: 'lead_paint_disclosure',
      title: 'Lead-Based Paint Disclosure',
      description:
        'For homes built before 1978, federal law requires disclosure of known lead-based paint and hazards.',
      legalBasis: 'Federal — 42 U.S.C. § 4852d',
      required: true,
      appliesTo: 'pre_1978',
    },
  ],
  mandatoryWaitingPeriods: [],
  requiredContractClauses: [
    {
      key: 'ky_preparer',
      title: 'Deed Preparer Identification',
      text: 'This deed was prepared by [Preparer Name], [Address].',
      required: true,
      legalBasis: 'KRS 382.335',
    },
    {
      key: 'ky_transfer_tax',
      title: 'Transfer Tax Acknowledgment',
      text: 'Kentucky transfer tax in the amount of $[amount] has been paid.',
      required: true,
    },
  ],
  recordingRequirements: {
    office: 'County Clerk',
    eRecordingAvailable: false,
    eRecordingNotes:
      'Kentucky does not have uniform statewide e-recording. Check with your specific county clerk for availability. Louisville/Jefferson County has separate systems.',
    baseFee: 13,
    additionalPageFee: 3,
    additionalForms: [
      'PVA (Property Valuation Administrator) copy required in most counties',
      'Transfer tax stamps or notation required',
    ],
    directoryUrl: 'https://www.kentuckycountyclerks.org',
  },
  offChainSteps: [
    {
      key: 'ky_inspection',
      title: 'Property Inspection',
      plainEnglishTitle: 'Get a Home Inspection',
      description:
        'Hire a qualified home inspector to evaluate the property. Kentucky does not license home inspectors at the state level.',
      whyRequired:
        'Kentucky follows "buyer beware" principles for many defects. A thorough inspection is your primary protection.',
      howToComplete: [
        'Look for inspectors who are members of ASHI or InterNACHI',
        'Consider also hiring a licensed KY contractor for structural concerns',
        'Schedule within your contingency period',
        'Review the full report before proceeding',
        'Negotiate repairs via an addendum if needed',
      ],
      responsibility: 'buyer',
      estimatedCost: '$300–$550',
      estimatedTime: '3–14 days',
      isRequired: false,
      isBlocker: false,
      sortOrder: 1,
      officialLinks: [
        { label: 'Find an ASHI Inspector', url: 'https://www.homeinspector.org/find-inspector' },
      ],
    },
    {
      key: 'ky_title_search',
      title: 'Title Search',
      plainEnglishTitle: 'Order a Title Search',
      description:
        'A Kentucky attorney or title company will search the County Clerk deed records to verify clear ownership.',
      whyRequired:
        'Kentucky deed books are indexed by grantor/grantee name (not parcel number), making title searches complex. Professional search is essential.',
      howToComplete: [
        'Hire a Kentucky licensed attorney or title company',
        "Kentucky deed books are indexed by grantor/grantee name — searches require tracing each owner back",
        'Louisville/Jefferson County uses a different indexing system',
        'Title insurance is strongly recommended',
        'Review the title commitment for exceptions and liens',
      ],
      responsibility: 'both',
      estimatedCost: '$400–$1,200',
      estimatedTime: '5–10 business days',
      isRequired: true,
      isBlocker: false,
      sortOrder: 2,
    },
    {
      key: 'ky_deed_preparation',
      title: 'Deed Preparation (Attorney Recommended)',
      plainEnglishTitle: 'Have the Deed Prepared',
      description:
        'While not legally required, Kentucky bar associations strongly recommend deed preparation by a licensed attorney.',
      whyRequired:
        'Errors in Kentucky deeds can cloud title for decades. An attorney ensures the deed is legally sufficient.',
      howToComplete: [
        'Hire a Kentucky licensed attorney (strongly recommended) or title company',
        'Deed must be in writing, identify grantor and grantee, and contain adequate property description',
        'Deed must be signed by the grantor',
        'Deed must be acknowledged before a notary public',
        'Deed must include the name and address of the preparer (KRS 382.335)',
        'Transfer tax stamps must be affixed or amount noted on the deed',
      ],
      responsibility: 'attorney',
      estimatedCost: '$200–$600',
      estimatedTime: '1–3 days',
      isRequired: true,
      isBlocker: true,
      sortOrder: 3,
      officialLinks: [
        {
          label: 'Kentucky Bar Association Attorney Search',
          url: 'https://www.kybar.org/page/PublicDirectory',
        },
      ],
    },
    {
      key: 'ky_transfer_tax',
      title: 'Transfer Tax Payment',
      plainEnglishTitle: 'Pay the Kentucky Transfer Tax (Seller)',
      description:
        'Kentucky charges a transfer tax of $0.50 per $500 of the sale price, paid by the seller at recording.',
      whyRequired: 'Required by Kentucky law. Due at time of recording.',
      legalBasis: 'KRS 142.050',
      howToComplete: [
        'Calculate: multiply sale price × 0.001 (0.1%)',
        'Example: $250,000 sale = $250 in transfer tax',
        'Tax is paid to the County Clerk at the time of recording',
        'Transfer tax stamps are affixed to the deed or amount is noted',
        'Seller is responsible unless otherwise negotiated in the contract',
      ],
      responsibility: 'seller',
      estimatedTime: 'At closing/recording',
      isRequired: true,
      isBlocker: false,
      sortOrder: 4,
    },
    {
      key: 'ky_recording',
      title: 'Recording',
      plainEnglishTitle: 'Record the Deed at the County Clerk',
      description:
        "The deed must be recorded with the County Clerk's office to complete the transfer of ownership.",
      whyRequired:
        'Recording provides public notice of ownership. Required for deed to be effective against third parties.',
      howToComplete: [
        "Bring the signed, notarized deed to your county clerk's office",
        'Pay the recording fee (approx. $13 for first page + $3/page after)',
        'Transfer tax stamps must be on the deed or amount noted',
        'Provide a PVA (Property Valuation Administrator) copy if required by your county',
        'After recording: upload the recorded deed to ChainDeed to trigger final settlement',
      ],
      responsibility: 'title_company',
      estimatedCost: '$15–$50',
      estimatedTime: 'Same day to 3 business days',
      isRequired: true,
      isBlocker: true,
      sortOrder: 5,
      officialLinks: [
        { label: 'Kentucky County Clerk Directory', url: 'https://www.kentuckycountyclerks.org' },
      ],
    },
    {
      key: 'ky_pva_notification',
      title: 'PVA Notification',
      plainEnglishTitle: 'Notify the Property Tax Assessor',
      description:
        "Notify the County PVA (Property Valuation Administrator) of the transfer for property tax assessment purposes.",
      whyRequired:
        'Ensures property taxes are assessed to the new owner. Some counties handle this automatically at recording.',
      howToComplete: [
        'Ask your county clerk if PVA notification is automatic upon recording',
        'Some counties require a separate form to be filed with the PVA',
        'Contact the County PVA office directly to confirm',
        "The PVA will update the assessment for next year's tax bill",
      ],
      responsibility: 'buyer',
      estimatedCost: 'Free',
      estimatedTime: '1–5 business days',
      isRequired: true,
      isBlocker: false,
      sortOrder: 6,
    },
  ],
  attorneyRequirement: false, // Recommended but not legally required
  homesteadExemption: {
    available: true,
    maxExemption: 36900,
    eligibility: 'Homeowners age 65+ or disabled with disability rating',
    deadline: 'December 31 (file with County PVA)',
    filingOffice: 'County PVA (Property Valuation Administrator)',
    notes:
      'Kentucky homestead exemption: $36,900 off assessed value for eligible seniors and disabled homeowners. Contact your County PVA to apply.',
  },
  deedTypes: [
    {
      key: 'general_warranty',
      name: 'General Warranty Deed',
      description: 'Warrants title against all claims, including those before seller\'s ownership.',
      covenants: 'Full warranty against all claims',
      commonUse: 'Standard residential sales',
    },
    {
      key: 'special_warranty',
      name: 'Special Warranty Deed',
      description: 'Warrants title only against claims arising during seller\'s ownership.',
      covenants: 'Warranty only for period of grantor\'s ownership',
      commonUse: 'Commercial sales, bank-owned properties',
    },
    {
      key: 'quitclaim',
      name: 'Quitclaim Deed',
      description: 'Transfers whatever interest grantor has, no warranties.',
      covenants: 'None',
      commonUse: 'Family transfers, clearing title issues',
    },
  ],
  notaryRequired: true,
  eRecordingEnabled: false,
  taxProrationCustom:
    'Kentucky property taxes are paid in arrears. Taxes are typically prorated based on the closing date.',
  additionalNotes:
    'Louisville/Jefferson County uses a separate deed indexing system. Attorney involvement is strongly recommended for all residential transactions in Kentucky.',
};
