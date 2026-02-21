import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from "@/src/components/Providers";
import { Space_Grotesk } from "next/font/google";
import { TreeProvider } from "@/src/context/TreeContext";
import AppShell from "@/src/components/AppShell";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export const metadata = {
    title: "Treetino | RWA Energy",
    description: "Tokenizing the energy market, one tree at a time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                />
            </head>
            <body className={`${spaceGrotesk.className} antialiased`}>
                <Providers>
                    <TreeProvider>
                        <AppShell>
                            {children}
                        </AppShell>
                    </TreeProvider>
                </Providers>
            </body>
        </html>
    );
}