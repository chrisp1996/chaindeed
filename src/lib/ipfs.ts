export interface IpfsUploadResult { cid: string; url: string; }

export async function uploadToIpfs(file: File | Blob, fileName = 'document'): Promise<IpfsUploadResult> {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) {
    const mockCid = `bafybeig${Math.random().toString(36).slice(2, 15)}`;
    return { cid: mockCid, url: `https://ipfs.io/ipfs/${mockCid}` };
  }
  const formData = new FormData();
  formData.append('file', file, fileName);
  const res = await fetch('https://api.web3.storage/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`IPFS upload failed: ${res.statusText}`);
  const { cid } = await res.json();
  return { cid, url: `https://${cid}.ipfs.w3s.link` };
}

export async function uploadJsonToIpfs(data: Record<string, unknown>, fileName = 'metadata.json'): Promise<IpfsUploadResult> {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  return uploadToIpfs(blob, fileName);
}

export function getIpfsUrl(cid: string): string {
  if (!cid) return '';
  if (cid.startsWith('http')) return cid;
  return `https://ipfs.io/ipfs/${cid}`;
}

export function buildDeedMetadata(params: {
  propertyAddress: string; apn: string; state: string; buyer: string; seller: string;
  purchasePrice: number; closingDate: string; contractAddress: string; documentCids: string[];
}) {
  return {
    name: `ChainDeed — ${params.propertyAddress}`,
    description: `Digital deed record for ${params.propertyAddress}`,
    image: `https://chaindeed.io/deed-image/${params.contractAddress}`,
    external_url: `https://chaindeed.io/deeds/${params.contractAddress}`,
    attributes: [
      { trait_type: 'Property Address', value: params.propertyAddress },
      { trait_type: 'APN', value: params.apn },
      { trait_type: 'State', value: params.state },
      { trait_type: 'Buyer', value: params.buyer },
      { trait_type: 'Seller', value: params.seller },
      { trait_type: 'Purchase Price', value: `$${params.purchasePrice.toLocaleString()}` },
      { trait_type: 'Closing Date', value: params.closingDate },
      { trait_type: 'Contract Address', value: params.contractAddress },
    ],
    documents: params.documentCids.map((cid, i) => ({ index: i, cid, url: getIpfsUrl(cid) })),
    created_at: new Date().toISOString(),
    platform: 'ChainDeed', chain: 'Polygon', chain_id: 137,
  };
}
