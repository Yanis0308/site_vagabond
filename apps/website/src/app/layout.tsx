import { type Metadata } from "next";
import { type ReactNode, Suspense } from "react";

import { FacebookPixelEvents } from "@/components/PixelEvent";

import { fallbackLng } from "./i18n/settings";
import { getMetadata } from "./metadata";

// Only used when the site is shared without locale in URL
export const generateMetadata = async (): Promise<Metadata> => {
  return await getMetadata({ lng: fallbackLng });
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <>
      <Suspense fallback={null}>
        <FacebookPixelEvents />
      </Suspense>{" "}
      {children}
    </>
  );
}
