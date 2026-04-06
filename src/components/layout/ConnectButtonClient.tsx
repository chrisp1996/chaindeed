'use client';

import dynamic from 'next/dynamic';

const ConnectButtonDynamic = dynamic(
  () => import('@rainbow-me/rainbowkit').then(m => ({ default: m.ConnectButton })),
  { ssr: false }
);

export function ConnectButtonClient() {
  return (
    <ConnectButtonDynamic
      label="Connect Secure Account"
      accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
      chainStatus={{ smallScreen: 'icon', largeScreen: 'full' }}
      showBalance={{ smallScreen: false, largeScreen: true }}
    />
  );
}
