import type { StateConfig } from './types';

export const ohioConfig: StateConfig = {
  state: 'Ohio',
  abbreviation: 'OH',
  closingType: 'either',
  transferTax: {
    rate: 1.0, // $1 per $1,000 — most counties, split 50/50
    paidBy: 'split',
    exemptions: [
      'Transfers between spouses',
      'Transfers to/from governmental entities',
      'Transfers pursuant to court order',
      'Transfers where consideration is $100 or less',
      'Certain corporate reorganizations',
    ],
    notes:
      'Ohio does not have a statewide conveyance fee. Most counties charge $1 per $1,000 of sale price, split 50/50 between buyer and seller. Some counties vary. Auditor Form DTE 100 or DTE 100EX (exempt) required at recording.',
  },
  requiredDisclosures: [
    {
      key: 'oh_residential_disclosure',
      title: 'Ohio Residential Property Disclosure Form',
      description:
        'Seller must complete and deliver the Ohio Residential Property Disclosure Form before or at time of purchase contract. Buyer has 3 days after receipt to rescind.',
      legalBasis: 'ORC 5302.30',
      required: true,
      appliesTo: 'residential',
      formUrl: 'https://www.ohiorealtors.org/wp-content/uploads/2023/01/ResidentialPropertyDisclosureForm.pdf',
      buyerRescissionPeriodDays: 3,
    },
    {
      key: 'lead_paint_disclosure',
      title: 'Lead-Based Paint Disclosure',
      description:
        'For homes built before 1978, seller must disclose known lead-based paint and provide EPA pamphlet. Buyer has 10 days for lead inspection.',
      legalBasis: 'Federal — 42 U.S.C. § 4852d',
      required: true,
      appliesTo: 'pre_1978',
      formUrl: 'https://www.hud.gov/sites/documents/DOC_12432.PDF',
    },
  ],
  mandatoryWaitingPeriods: [],
  requiredContractClauses: [
    {
      key: 'oh_property_description',
      title: 'Legal Description',
      text: 'The property shall be described by its full legal description as recorded in the office of the [County] County Recorder.',
      required: true,
    },
    {
      key: 'oh_disclosure_delivery',
      title: 'Disclosure Delivery',
      text: 'Seller shall deliver the Ohio Residential Property Disclosure Form to Buyer. Buyer shall have three (3) days after receipt to rescind this contract.',
      required: true,
      legalBasis: 'ORC 5302.30',
    },
    {
      key: 'oh_title_evidence',
      title: 'Title Evidence',
      text: 'Seller shall provide title evidence acceptable to Buyer, including an owner\'s title insurance policy.',
      required: true,
    },
  ],
  recordingRequirements: {
    office: 'County Recorder',
    eRecordingAvailable: true,
    eRecordingNotes: 'Most Ohio counties accept e-recording. Contact your county recorder to confirm.',
    baseFee: 28,
    additionalPageFee: 8,
    additionalForms: [
      'DTE 100 (Conveyance Fee Statement) or DTE 100EX (Exemption)',
      'Auditor Transfer',
    ],
    directoryUrl: 'https://www.ohioauditor.gov/counties.html',
  },
  offChainSteps: [
    {
      key: 'oh_inspection',
      title: 'Property Inspection',
      plainEnglishTitle: 'Get a Home Inspection',
      description:
        'Hire a licensed home inspector to evaluate the property before your inspection contingency deadline.',
      whyRequired:
        'Protects you from buying a property with hidden defects. Ohio does not license home inspectors at the state level.',
      howToComplete: [
        'Find an inspector who is a member of ASHI (American Society of Home Inspectors) or InterNACHI',
        'Schedule the inspection within 10-14 days of contract signing (check your contingency deadline)',
        'Be present during the inspection if possible',
        'Review the inspection report carefully',
        'Negotiate repairs via an addendum or waive your contingency',
      ],
      responsibility: 'buyer',
      estimatedCost: '$300–$600',
      estimatedTime: '3–14 days',
      documents: ['Inspection report', 'Repair addendum (if applicable)'],
      isRequired: false,
      isBlocker: false,
      sortOrder: 1,
      officialLinks: [
        { label: 'Find an ASHI Inspector', url: 'https://www.homeinspector.org/find-inspector' },
        { label: 'Find an InterNACHI Inspector', url: 'https://www.nachi.org/find-inspector.htm' },
      ],
    },
    {
      key: 'oh_title_search',
      title: 'Title Search & Insurance',
      plainEnglishTitle: 'Order Title Search and Insurance',
      description:
        'Your title company will search county recorder records going back 50+ years to verify a clear chain of ownership.',
      whyRequired:
        'Ensures no liens, judgments, or ownership disputes exist on the property. Required by most lenders.',
      howToComplete: [
        'Contact a licensed Ohio title company or attorney',
        'Provide the property address and legal description',
        'Title search typically takes 3–7 business days',
        "If financing: lender's title insurance is required",
        "Owner's title insurance is optional but strongly recommended",
        'Review the title commitment for any exceptions',
      ],
      responsibility: 'both',
      estimatedCost: '$500–$1,500',
      estimatedTime: '3–7 business days',
      documents: ['Title commitment', 'Title insurance policy'],
      isRequired: true,
      isBlocker: false,
      sortOrder: 2,
    },
    {
      key: 'oh_seller_disclosure',
      title: 'Ohio Residential Property Disclosure',
      plainEnglishTitle: 'Complete the Ohio Disclosure Form (Seller)',
      description:
        'Ohio law (ORC 5302.30) requires you to complete the Ohio Residential Property Disclosure Form and deliver it to the buyer.',
      whyRequired:
        'Required by Ohio law. Buyer has the right to rescind the contract within 3 days of receiving this form.',
      legalBasis: 'ORC 5302.30',
      howToComplete: [
        'Download the current Ohio Residential Property Disclosure Form (link below)',
        'Complete all sections honestly — disclose all known material defects',
        'Sign and date the form',
        'Deliver to buyer before or at contract signing',
        'Upload the signed form to ChainDeed — the document hash will be recorded on the permanent record',
      ],
      responsibility: 'seller',
      estimatedCost: 'Free',
      estimatedTime: '1–2 hours',
      documents: ['Ohio Residential Property Disclosure Form'],
      isRequired: true,
      isBlocker: true,
      sortOrder: 3,
      officialLinks: [
        {
          label: 'Ohio Residential Property Disclosure Form',
          url: 'https://www.ohiorealtors.org/wp-content/uploads/2023/01/ResidentialPropertyDisclosureForm.pdf',
        },
      ],
      notes: 'Upload the completed form to ChainDeed. This is required before the digital agreement can advance.',
    },
    {
      key: 'oh_deed_preparation',
      title: 'Deed Preparation',
      plainEnglishTitle: 'Have the Deed Prepared',
      description:
        'Your deed must be prepared by a licensed Ohio attorney or title company and signed before a notary.',
      whyRequired:
        'Ohio requires a deed with specific language (grantor/grantee, legal description, consideration, appropriate covenants) to be valid.',
      howToComplete: [
        'Your title company or closing attorney will prepare the deed',
        'Deed must include: grantor and grantee names, legal description, consideration, appropriate covenants',
        'For General Warranty Deed: Ohio uses the word "grants" to convey warranty',
        'Grantor must sign in the presence of a notary public',
        'Deed must include the name and address of the person who prepared it',
      ],
      responsibility: 'title_company',
      estimatedCost: 'Included in title/closing fees',
      estimatedTime: '1–3 days',
      documents: ['Signed and notarized deed'],
      isRequired: true,
      isBlocker: true,
      sortOrder: 4,
    },
    {
      key: 'oh_recording',
      title: 'Recording',
      plainEnglishTitle: 'Record the Deed at the County Recorder',
      description:
        'The deed must be recorded with the County Recorder\'s Office to complete the transfer of ownership.',
      whyRequired:
        'Recording provides public notice of ownership. Deed is not effective against third parties until recorded.',
      howToComplete: [
        "Bring or e-submit the signed deed to your county recorder's office",
        'Pay the recording fee (approx. $28 for first 2 pages + $8/page after)',
        'Submit the Auditor Transfer form (DTE 100 or DTE 100EX for exempt transfers)',
        'Pay the county conveyance fee (varies by county)',
        'After recording: upload the recorded deed with stamp to ChainDeed to trigger final settlement',
      ],
      responsibility: 'title_company',
      estimatedCost: '$30–$100 + conveyance fee',
      estimatedTime: '1–5 business days',
      documents: ['Recorded deed with stamp', 'DTE 100 or DTE 100EX form'],
      isRequired: true,
      isBlocker: true,
      sortOrder: 5,
      officialLinks: [
        { label: 'Ohio County Recorder Directory', url: 'https://www.ohiorecorders.com' },
        {
          label: 'DTE 100 Conveyance Fee Form',
          url: 'https://tax.ohio.gov/static/forms/real_estate/dte100.pdf',
        },
      ],
      notes: 'Upload the recorded deed to ChainDeed after recording to trigger final on-chain settlement.',
    },
    {
      key: 'oh_insurance',
      title: "Homeowner's Insurance",
      plainEnglishTitle: "Get Homeowner's Insurance",
      description:
        "If financing, your lender requires proof of homeowner's insurance before closing.",
      whyRequired: "Required by lenders. Protects your investment from damage and liability.",
      howToComplete: [
        'Get insurance quotes at least 2 weeks before closing',
        'Choose a policy with coverage equal to the replacement cost of the home',
        'Have your insurance agent send proof of insurance (binder) directly to the title company',
        "Bring proof of insurance to closing",
      ],
      responsibility: 'buyer',
      estimatedCost: '$800–$2,000/year',
      estimatedTime: '1–7 days',
      isRequired: false,
      isBlocker: false,
      sortOrder: 6,
    },
    {
      key: 'oh_final_walkthrough',
      title: 'Final Walkthrough',
      plainEnglishTitle: 'Do a Final Walkthrough',
      description:
        'Conduct a final walkthrough of the property within 24 hours of closing to verify the condition matches the contract.',
      whyRequired:
        'Ensures property is in the agreed condition and all agreed repairs were made.',
      howToComplete: [
        'Schedule with seller or listing agent within 24 hours of closing',
        'Bring your purchase contract and inspection report',
        'Check that all agreed repairs were completed',
        'Test all appliances, lights, plumbing, and HVAC',
        'Confirm all personal property included in the sale is present',
        'Document any issues with photos',
      ],
      responsibility: 'buyer',
      estimatedCost: 'Free',
      estimatedTime: '30–90 minutes',
      isRequired: false,
      isBlocker: false,
      sortOrder: 7,
    },
  ],
  attorneyRequirement: false,
  homesteadExemption: {
    available: true,
    maxExemption: 25000,
    eligibility:
      'Homeowners age 65+ or permanently disabled with income below $36,100 (adjusted annually)',
    deadline: 'December 31 of the year in which you turn 65 or become disabled',
    filingOffice: 'County Auditor',
    formUrl: 'https://tax.ohio.gov/static/forms/real_estate/dte105a.pdf',
    notes:
      'The Ohio Homestead Exemption reduces assessed value by up to $25,000 for eligible senior citizens and disabled homeowners.',
  },
  deedTypes: [
    {
      key: 'general_warranty',
      name: 'General Warranty Deed',
      description: 'Grants full warranty of title against all claims, including those arising before seller\'s ownership.',
      covenants: 'Seisin, quiet enjoyment, against encumbrances, further assurance, warranty forever',
      commonUse: 'Standard residential sales',
    },
    {
      key: 'limited_warranty',
      name: 'Limited Warranty Deed',
      description: 'Warrants title only against claims arising during seller\'s ownership.',
      covenants: 'Warranty against claims arising during grantor\'s ownership only',
      commonUse: 'Bank-owned properties, estate sales',
    },
    {
      key: 'quitclaim',
      name: 'Quitclaim Deed',
      description: 'Transfers whatever interest the grantor has, with no warranties.',
      covenants: 'None',
      commonUse: 'Transfers between family members, clearing title defects',
    },
  ],
  notaryRequired: true,
  eRecordingEnabled: true,
  taxProrationCustom:
    'Ohio property taxes are paid in arrears. Taxes are typically prorated to the date of closing based on the most recent tax bill.',
  additionalNotes:
    'Ohio title insurance rates are filed with the Ohio Department of Insurance. Shop multiple title companies for best rates.',
};
