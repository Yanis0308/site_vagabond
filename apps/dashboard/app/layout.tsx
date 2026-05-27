import "./globals.css";

import { type Metadata } from "next";
import { type ReactNode } from "react";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Vagagond Dashboard",
  description: "Internal dashboard",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
