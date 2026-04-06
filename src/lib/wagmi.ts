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

const polygonMumbai = {
  id: 80001,
  name: 'Polygon Mumbai',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-mumbai.maticvigil.com'] },
    public: { http: ['https://rpc-mumbai.maticvigil.com'] },
  },
  blockExplorers: { default: { name: 'Mumbai PolygonScan', url: 'https://mumbai.polygonscan.com' } },
  testnet: true,
} as const;

export { polygon, polygonMumbai };

export const wagmiConfig = createConfig({
  chains: [polygon, polygonMumbai, mainnet],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'ChainDeed', appLogoUrl: 'https://chaindeed.io/logo.png' }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo_project_id',
      metadata: { name: 'ChainDeed', description: 'Digital Real Estate Agreements', url: 'https://chaindeed.io', icons: ['https://chaindeed.io/logo.png'] },
    }),
  ],
  transports: {
    [137]: http('https://polygon-rpc.com'),
    [80001]: http('https://rpc-mumbai.maticvigil.com'),
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
