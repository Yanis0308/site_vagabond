import "../globals.css";

import { Analytics } from "@vercel/analytics/react";
import { dir } from "i18next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import React, { type ReactNode } from "react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import { languages } from "../i18n/settings";
import { getMetadata } from "../metadata";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lng: string }>;
}): Promise<Metadata> => {
  const { lng } = await params;
  return await getMetadata({ lng });
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
        className={`${geistSans.variable} ${geistMono.variable} bg-gradient-to-b from-primary-100 to-primary-50 antialiased`}
      >
        <Navbar lng={lng} />
        <div className="min-h-screen pt-16">{children}</div>
        <Footer lng={lng} />
        <Analytics />
      </body>
    </html>
  );
}
