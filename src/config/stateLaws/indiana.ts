import type { StateConfig } from './types';

export const indianaConfig: StateConfig = {
  state: 'Indiana',
  abbreviation: 'IN',
  closingType: 'title_company',
  transferTax: {
    rate: 1.0, // $0.10 per $100 = $1 per $1,000
    paidBy: 'seller',
    exemptions: [
      'Transfers between spouses',
      'Transfers to governmental entities',
      'Transfers by inheritance or devise',
      'Transfers pursuant to divorce',
      'Certain business entity transfers',
    ],
    notes:
      'Indiana Sales Disclosure Fee: $0.10 per $100 of consideration (0.1% of sale price). Filed with and paid to the County Assessor with the Sales Disclosure Form. Seller\'s obligation unless otherwise negotiated.',
  },
  requiredDisclosures: [
    {
      key: 'in_seller_disclosure',
      title: "Seller's Residential Real Estate Sales Disclosure",
      description:
        "Indiana law requires sellers to complete the Seller's Residential Real Estate Sales Disclosure before or when accepting an offer. Buyer has 2 business days after receipt to rescind.",
      legalBasis: 'IC 32-21-5',
      required: true,
      appliesTo: 'residential',
      formUrl: 'https://www.in.gov/dlgf/2440.htm',
      buyerRescissionPeriodDays: 2,
    },
    {
      key: 'in_sales_disclosure_form',
      title: 'Sales Disclosure Form (Form 46021)',
      description:
        'MANDATORY: Indiana requires the Sales Disclosure Form to be filed with the County Assessor at or before recording. Both buyer and seller (or agents) must sign. This is separate from the seller\'s disclosure. THIS BLOCKS RECORDING.',
      legalBasis: 'IC 6-1.1-5.5',
      required: true,
      appliesTo: 'all',
      formUrl: 'https://www.in.gov/dlgf/files/Sales-Disclosure-Form.pdf',
    },
    {
      key: 'lead_paint_disclosure',
      title: 'Lead-Based Paint Disclosure',
      description:
        'For homes built before 1978, federal law requires disclosure of known lead-based paint.',
      legalBasis: 'Federal — 42 U.S.C. § 4852d',
      required: true,
      appliesTo: 'pre_1978',
    },
  ],
  mandatoryWaitingPeriods: [
    {
      key: 'in_buyer_rescission',
      description:
        "Buyer has 2 business days after receiving Seller's Disclosure to rescind the contract without penalty.",
      days: 2,
      afterEvent: "Receipt of Seller's Residential Real Estate Sales Disclosure",
    },
  ],
  requiredContractClauses: [
    {
      key: 'in_sales_disclosure',
      title: 'Sales Disclosure Condition',
      text: 'This transaction is conditioned upon the completion and filing of the Indiana Sales Disclosure Form (Form 46021) with the County Assessor prior to recording.',
      required: true,
      legalBasis: 'IC 6-1.1-5.5',
    },
    {
      key: 'in_grantee_address',
      title: 'Grantee Mailing Address',
      text: 'The mailing address of the Grantee is: [Address].',
      required: true,
    },
  ],
  recordingRequirements: {
    office: 'County Recorder',
    eRecordingAvailable: true,
    eRecordingNotes:
      'Indiana has robust e-recording. Most counties accept electronic recording through services like Simplifile or CSC.',
    baseFee: 25,
    additionalPageFee: 5,
    additionalForms: [
      "Auditor's Sales Disclosure stamp required on deed BEFORE recording",
      'Sales Disclosure Form must be filed with County Assessor before recording',
    ],
    directoryUrl: 'https://www.in.gov/courts/iocs/recorder/county-recorders/',
  },
  offChainSteps: [
    {
      key: 'in_inspection',
      title: 'Property Inspection',
      plainEnglishTitle: 'Get a Home Inspection',
      description:
        'Hire a qualified home inspector. Indiana does not license home inspectors at the state level. Also consider radon testing — Indiana has elevated radon in many counties.',
      whyRequired:
        "Protects buyer from hidden defects. Indiana's mandatory seller disclosure helps, but an independent inspection is essential.",
      howToComplete: [
        'Look for ASHI or InterNACHI member inspectors',
        'Schedule within your inspection contingency period',
        'Strongly consider a radon test — Indiana has elevated radon in many areas',
        'Review the inspection report and negotiate repairs if needed',
      ],
      responsibility: 'buyer',
      estimatedCost: '$300–$600 + $100–$150 for radon test',
      estimatedTime: '3–14 days',
      isRequired: false,
      isBlocker: false,
      sortOrder: 1,
      officialLinks: [
        {
          label: 'Indiana Radon Program (IDEM)',
          url: 'https://www.in.gov/idem/cleanwater/radon/',
        },
        { label: 'Find an ASHI Inspector', url: 'https://www.homeinspector.org/find-inspector' },
      ],
    },
    {
      key: 'in_seller_disclosure',
      title: "Seller's Disclosure Form — REQUIRED",
      plainEnglishTitle: "Complete the Indiana Seller's Disclosure (Seller) — REQUIRED",
      description:
        "Indiana law (IC 32-21-5) requires you to complete the Seller's Residential Real Estate Sales Disclosure before accepting an offer. The buyer has 2 business days after receipt to cancel.",
      whyRequired:
        'Required by Indiana law. Failure to provide can void the contract or result in liability for undisclosed defects.',
      legalBasis: 'IC 32-21-5',
      howToComplete: [
        'Download the current Indiana Seller\'s Disclosure form (link below)',
        'Complete all sections honestly — disclose all known defects',
        'Sign and date the form',
        'Deliver to buyer BEFORE accepting the offer (or simultaneously)',
        'Upload the signed form to ChainDeed — required before the digital agreement can advance',
      ],
      responsibility: 'seller',
      estimatedCost: 'Free',
      estimatedTime: '1–2 hours',
      documents: ["Seller's Residential Real Estate Sales Disclosure"],
      isRequired: true,
      isBlocker: true,
      sortOrder: 2,
      officialLinks: [
        {
          label: "Indiana Seller's Disclosure Form",
          url: 'https://www.in.gov/dlgf/2440.htm',
        },
      ],
    },
    {
      key: 'in_sales_disclosure',
      title: 'Indiana Sales Disclosure Form — MANDATORY BLOCKER',
      plainEnglishTitle: 'File the Indiana Sales Disclosure Form — BLOCKS RECORDING',
      description:
        'Indiana requires both buyer and seller to sign a Sales Disclosure Form (Form 46021) and file it with the County Assessor BEFORE or at recording. This is separate from the seller\'s disclosure and MUST be completed before the deed can be recorded.',
      whyRequired:
        'Required by Indiana law (IC 6-1.1-5.5). The County Recorder cannot record the deed without the Auditor\'s stamp showing the Sales Disclosure was filed.',
      legalBasis: 'IC 6-1.1-5.5',
      howToComplete: [
        'Download the Indiana Sales Disclosure Form (Form 46021) — link below',
        'Both buyer and seller (or their authorized agents) must sign the form',
        'File the completed form with the County Assessor\'s office',
        'Pay the filing fee: $25 (+ $10 if filed after recording)',
        'Receive the Assessor\'s stamp/approval on the form',
        "Upload the stamped Sales Disclosure to ChainDeed — this unblocks recording",
      ],
      responsibility: 'both',
      estimatedCost: '$25 filing fee (+ $10 late fee)',
      estimatedTime: '1–3 business days',
      documents: ['Sales Disclosure Form 46021 (Assessor-stamped)'],
      isRequired: true,
      isBlocker: true,
      sortOrder: 3,
      officialLinks: [
        {
          label: 'Indiana Sales Disclosure Form (DLGF)',
          url: 'https://www.in.gov/dlgf/files/Sales-Disclosure-Form.pdf',
        },
        {
          label: 'Indiana Department of Local Government Finance',
          url: 'https://www.in.gov/dlgf/',
        },
      ],
      notes: '⚠️ THIS STEP BLOCKS RECORDING. The deed cannot be recorded until this form is filed and the assessor stamps the deed.',
    },
    {
      key: 'in_deed_preparation',
      title: 'Deed Preparation',
      plainEnglishTitle: 'Have the Deed Prepared',
      description:
        'Indiana deeds must meet specific requirements including grantor/grantee addresses, legal description, notarization, and auditor\'s release statement.',
      whyRequired:
        'Required for a valid transfer. The deed must contain the auditor\'s release after the Sales Disclosure is approved.',
      howToComplete: [
        'Your title company or attorney will prepare the deed',
        'Deed must include: grantor and grantee names with mailing addresses, legal description, signature of grantor, notary acknowledgment',
        "Deed must include the Auditor's release statement (after Sales Disclosure approval)",
        "The deed cannot be recorded until it bears the County Assessor/Auditor's stamp",
        'Indiana Sales Disclosure Fee must be paid',
      ],
      responsibility: 'title_company',
      estimatedCost: 'Included in title/closing fees',
      estimatedTime: '1–3 days (after Sales Disclosure approved)',
      isRequired: true,
      isBlocker: true,
      sortOrder: 4,
    },
    {
      key: 'in_sales_disclosure_fee',
      title: 'Sales Disclosure Fee Payment',
      plainEnglishTitle: 'Pay the Indiana Sales Disclosure Fee (Seller)',
      description:
        'Indiana charges $0.10 per $100 of sale price as a Sales Disclosure Fee. Paid at time of Sales Disclosure filing.',
      whyRequired: 'Required by Indiana law as part of the Sales Disclosure filing.',
      legalBasis: 'IC 6-1.1-5.5',
      howToComplete: [
        'Calculate: multiply sale price × 0.001 (0.1%)',
        'Example: $250,000 sale = $250 fee',
        'Paid to the County Assessor when filing the Sales Disclosure Form',
        "Seller's obligation unless otherwise negotiated",
      ],
      responsibility: 'seller',
      estimatedTime: 'At Sales Disclosure filing',
      isRequired: true,
      isBlocker: false,
      sortOrder: 5,
    },
    {
      key: 'in_recording',
      title: 'Recording',
      plainEnglishTitle: 'Record the Deed at the County Recorder',
      description:
        "The deed must be recorded with the County Recorder's Office. Indiana requires the Assessor's stamp (from the Sales Disclosure) before recording is possible.",
      whyRequired:
        'Recording provides public notice of ownership. Required for deed to be effective against third parties.',
      howToComplete: [
        'Ensure the deed has the County Assessor/Auditor\'s stamp (from Sales Disclosure filing)',
        'Submit to County Recorder via e-recording or in person',
        'Pay recording fee (approx. $25 first page + $5/page after)',
        'Indiana has robust e-recording — most counties accept electronic recording',
        "Upload the recorded deed to ChainDeed after recording to trigger final settlement",
      ],
      responsibility: 'title_company',
      estimatedCost: '$30–$75',
      estimatedTime: '1–3 business days',
      isRequired: true,
      isBlocker: true,
      sortOrder: 6,
      officialLinks: [
        {
          label: 'Indiana County Recorders Directory',
          url: 'https://www.in.gov/courts/iocs/recorder/county-recorders/',
        },
      ],
    },
    {
      key: 'in_homestead_exemption',
      title: 'Homestead Deduction Application',
      plainEnglishTitle: 'Apply for Indiana Homestead Tax Savings',
      description:
        "If this is your primary residence, apply for Indiana's Homestead Deduction to reduce your property taxes significantly.",
      whyRequired:
        'Indiana\'s homestead deduction can save hundreds to thousands of dollars per year on property taxes.',
      howToComplete: [
        "File with the County Auditor by January 5 of the year after you move in",
        'Primary residence only — you can only claim this for one property',
        'Reduces assessed value by up to 60% or $45,000 (whichever is less)',
        'Also claim the Supplemental Homestead Deduction for additional savings',
        "ChainDeed will send you an email reminder in November if you haven't filed yet",
      ],
      responsibility: 'buyer',
      estimatedCost: 'Free',
      estimatedTime: 'File by January 5',
      isRequired: false,
      isBlocker: false,
      sortOrder: 7,
      officialLinks: [
        {
          label: 'Indiana Homestead Deduction Form',
          url: 'https://www.in.gov/dlgf/files/State_Form_5473.pdf',
        },
        {
          label: 'Indiana Property Tax Deductions',
          url: 'https://www.in.gov/dlgf/2362.htm',
        },
      ],
      notes: 'ChainDeed will automatically send you a reminder email in November to file for the homestead deduction if you have not already done so.',
    },
  ],
  attorneyRequirement: false,
  homesteadExemption: {
    available: true,
    maxExemption: 45000,
    eligibility: 'Primary residence owners — available to all homeowners, not just seniors',
    deadline: 'January 5 of the year after establishing residence',
    filingOffice: 'County Auditor',
    formUrl: 'https://www.in.gov/dlgf/files/State_Form_5473.pdf',
    notes:
      'Indiana Homestead Deduction reduces assessed value by up to 60% of AV or $45,000 (whichever is less). Additional Supplemental Homestead Deduction available. This is NOT limited to seniors — any primary residence owner qualifies.',
  },
  deedTypes: [
    {
      key: 'general_warranty',
      name: 'General Warranty Deed',
      description: 'Full warranty of title against all claims.',
      covenants: 'Full warranty against all claims',
      commonUse: 'Standard residential sales',
    },
    {
      key: 'special_warranty',
      name: 'Special Warranty Deed',
      description: "Warrants title only against claims arising during seller's ownership.",
      covenants: "Warranty only for seller's period of ownership",
      commonUse: 'Commercial sales, bank-owned properties',
    },
    {
      key: 'quitclaim',
      name: 'Quitclaim Deed',
      description: 'Transfers whatever interest grantor has, no warranties.',
      covenants: 'None',
      commonUse: 'Family transfers, clearing title',
    },
  ],
  notaryRequired: true,
  eRecordingEnabled: true,
  taxProrationCustom:
    'Indiana property taxes are paid in arrears in two installments (May and November). Taxes are typically prorated to the closing date.',
  additionalNotes:
    "Indiana's Sales Disclosure process is unique among states. Allow extra time for the Assessor's approval — this is the most common cause of closing delays in Indiana.",
};
