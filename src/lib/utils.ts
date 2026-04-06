import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatMaticWithUsd(weiAmount: bigint, maticUsdPrice = 0.85): string {
  const matic = Number(weiAmount) / 1e18;
  const usd = matic * maticUsdPrice;
  return `${matic.toFixed(4)} MATIC (≈$${usd.toFixed(2)})`;
}

export function calculateTransferTax(
  salePrice: number,
  state: string
): { total: number; buyerShare: number; sellerShare: number; label: string } {
  switch (state.toUpperCase()) {
    case 'KY':
      return { total: salePrice * 0.001, buyerShare: 0, sellerShare: salePrice * 0.001, label: 'Kentucky Transfer Tax (0.1%, seller)' };
    case 'IN':
      return { total: salePrice * 0.001, buyerShare: 0, sellerShare: salePrice * 0.001, label: 'Indiana Sales Disclosure Fee (0.1%, seller)' };
    case 'OH':
      return { total: salePrice * 0.001, buyerShare: salePrice * 0.0005, sellerShare: salePrice * 0.0005, label: 'Ohio County Conveyance Fee (≈0.1%, split)' };
    default:
      return { total: 0, buyerShare: 0, sellerShare: 0, label: 'Transfer tax varies by state' };
  }
}

export function stateAbbrevToName(abbrev: string): string {
  const states: Record<string, string> = {
    OH: 'Ohio', KY: 'Kentucky', IN: 'Indiana',
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
    CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
    IL: 'Illinois', IA: 'Iowa', KS: 'Kansas', LA: 'Louisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
    MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
    NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
    SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
    UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
    WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  };
  return states[abbrev.toUpperCase()] || abbrev;
}

export function getContractStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Being prepared',
    PENDING_SIGNATURES: 'Waiting for signatures',
    ACTIVE: 'Active — both parties signed',
    IN_ESCROW: 'Funds in secure hold',
    PENDING_CLOSING: 'Closing in progress',
    CLOSED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Under review',
  };
  return labels[status] || status;
}

export function estimateHomesteadSavings(assessedValue: number, state: string, taxRate = 0.012): number {
  switch (state.toUpperCase()) {
    case 'IN': return Math.min(assessedValue * 0.6, 45000) * taxRate;
    case 'OH': return 25000 * taxRate;
    case 'KY': return 36900 * taxRate;
    default: return 0;
  }
}

export function getIpfsUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}
