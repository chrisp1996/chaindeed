import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';

const polygon = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://polygon-rpc.com'] },
    public: { http: ['https://polygon-rpc.com'] },
  },
  blockExplorers: { default: { name: 'PolygonScan', url: 'https://polygonscan.com' } },
} as const;

const polygonAmoy = {
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology'] },
    public: { http: ['https://rpc-amoy.polygon.technology'] },
  },
  blockExplorers: { default: { name: 'Amoy PolygonScan', url: 'https://amoy.polygonscan.com' } },
  testnet: true,
} as const;

export { polygon, polygonAmoy };

const connectors = [
  metaMask(),
  coinbaseWallet({ appName: 'ChainDeed', appLogoUrl: 'https://chaindeed.io/logo.png' }),
  ...(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    ? [walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
        metadata: { name: 'ChainDeed', description: 'Digital Real Estate Agreements', url: 'https://chaindeed.io', icons: ['https://chaindeed.io/logo.png'] },
      })]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [polygon, polygonAmoy, mainnet],
  connectors,
  transports: {
    [137]: http('https://polygon-rpc.com'),
    [80002]: http('https://rpc-amoy.polygon.technology'),
    [1]: http(),
  },
});

export async function addPolygonToWallet(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false;
  try {
    await (window.ethereum as any).request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x89',
        chainName: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        rpcUrls: ['https://polygon-rpc.com'],
        blockExplorerUrls: ['https://polygonscan.com'],
      }],
    });
    return true;
  } catch { return false; }
}

export async function getMaticUsdPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd', { next: { revalidate: 60 } });
    const data = await res.json();
    return data['matic-network']?.usd ?? 0.85;
  } catch { return 0.85; }
}
