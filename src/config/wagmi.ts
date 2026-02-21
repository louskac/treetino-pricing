import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mantleSepoliaTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Treetino',
    projectId: 'YOUR_PROJECT_ID', // Replaced with a placeholder or public one if needed, but 'YOUR_PROJECT_ID' warns. Ideally user should provide one. I'll use a placeholder for now.
    chains: [mantleSepoliaTestnet],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
