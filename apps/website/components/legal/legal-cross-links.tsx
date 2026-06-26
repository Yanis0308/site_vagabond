import { type getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { type LegalLinkKey } from "@/lib/legal-sections";

type LegalTranslator = Awaited<ReturnType<typeof getTranslations>>;

const LEGAL_PAGES: Array<{
  id: "mentions" | "conf" | "cgu";
  href: string;
  labelKey: LegalLinkKey;
}> = [
  { id: "mentions", href: "/mentions-legales", labelKey: "linkMentions" },
  { id: "conf", href: "/confidentialite", labelKey: "linkConf" },
  { id: "cgu", href: "/cgu", labelKey: "linkCgu" },
];

interface Props {
  t: LegalTranslator;
  currentPage: "mentions" | "conf" | "cgu";
}

export function LegalCrossLinks({ t, currentPage }: Props): ReactNode {
  return (
    <nav
      aria-label={t("seeAlsoTitle")}
      className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8 text-sm text-typography-600"
    >
      <span className="font-medium text-foreground">{t("seeAlsoTitle")}</span>
      {LEGAL_PAGES.filter((page) => page.id !== currentPage).map((page) => (
        <Link
          key={page.id}
          href={page.href}
          className="
            text-primary-600 underline-offset-4 transition-colors
            hover:text-primary-700 hover:underline
          "
        >
          {t(page.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
