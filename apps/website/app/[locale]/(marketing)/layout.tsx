import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { generateTapItQrCodeDataUrl } from "@/lib/qr-code";

interface Props {
  children: ReactNode;
}

export default async function MarketingLayout({
  children,
}: Props): Promise<ReactNode> {
  const t = await getTranslations("home");
  const qrDataUrl = await generateTapItQrCodeDataUrl({ width: 150 });

  return (
    <>
      <MarketingNav />
      <main className="pt-16">{children}</main>
      <FinalCtaSection
        title={t("ctaTitle")}
        subtitle={t("ctaSubtitle")}
        qrLabel={t("ctaQrLabel")}
        qrDataUrl={qrDataUrl}
        qrAlt={t("deeplinkQrAlt")}
      />
      <MarketingFooter />
    </>
  );
}
