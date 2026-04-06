export { ohioConfig } from './ohio';
export { kentuckyConfig } from './kentucky';
export { indianaConfig } from './indiana';
export type {
  StateConfig,
  TransferTax,
  Disclosure,
  WaitingPeriod,
  ContractClause,
  RecordingRequirement,
  OffChainStep,
  HomesteadInfo,
  DeedType,
} from './types';

import { ohioConfig } from './ohio';
import { kentuckyConfig } from './kentucky';
import { indianaConfig } from './indiana';

export const STATE_CONFIGS = {
  OH: ohioConfig,
  KY: kentuckyConfig,
  IN: indianaConfig,
} as const;

export const SUPPORTED_STATES = ['OH', 'KY', 'IN'] as const;
export type SupportedState = typeof SUPPORTED_STATES[number];

export function getStateConfig(abbreviation: string) {
  const upper = abbreviation.toUpperCase();
  if (upper in STATE_CONFIGS) {
    return STATE_CONFIGS[upper as SupportedState];
  }
  return null;
}

export function isStateSupported(abbreviation: string): boolean {
  return SUPPORTED_STATES.includes(abbreviation.toUpperCase() as SupportedState);
}

export function calculateTransferTax(state: SupportedState, salePrice: number): {
  total: number;
  buyerShare: number;
  sellerShare: number;
  notes: string;
} {
  const config = STATE_CONFIGS[state];
  const { rate, paidBy } = config.transferTax;
  const total = (salePrice / 1000) * rate;

  let buyerShare = 0;
  let sellerShare = 0;

  switch (paidBy) {
    case 'buyer':
      buyerShare = total;
      break;
    case 'seller':
      sellerShare = total;
      break;
    case 'split':
      buyerShare = total / 2;
      sellerShare = total / 2;
      break;
    case 'negotiable':
      sellerShare = total; // default to seller
      break;
  }

  return { total, buyerShare, sellerShare, notes: config.transferTax.notes };
}
