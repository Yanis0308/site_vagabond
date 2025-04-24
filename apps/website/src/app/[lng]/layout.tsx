import "../globals.css";

import { Analytics } from "@vercel/analytics/react";
import { dir } from "i18next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React, { type ReactNode } from "react";

import Navbar from "@/components/Navbar";

import { languages } from "../i18n/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vagabond",
};
export function generateStaticParams(): Array<{ lng: string }> {
  return languages.map((lng) => ({ lng }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lng: string }>;
}

export default function RootLayout({
  children,
  params,
}: RootLayoutProps): ReactNode {
  // On utilise directement params.lng au lieu de React.use() qui peut causer des problèmes d'hydratation
  const resolvedParams = React.use(params);
  const { lng } = resolvedParams;

  // On utilise un ID statique pour le HTML afin d'assurer une consistance entre serveur et client
  return (
    <html lang={lng} dir={dir(lng)} suppressHydrationWarning>
      <head>
        {/* <script src="https://unpkg.com/react-scan/dist/auto.global.js" async /> */}
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar lng={lng} />
        <div className="pt-16">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
