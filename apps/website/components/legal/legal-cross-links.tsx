import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { Link } from "@/i18n/navigation";

const LEGAL_PAGES = [
  {
    id: "mentions" as const,
    href: "/mentions-legales",
    labelKey: "linkMentions",
  },
  { id: "conf" as const, href: "/confidentialite", labelKey: "linkConf" },
  { id: "cgu" as const, href: "/cgu", labelKey: "linkCgu" },
];

interface Props {
  currentPage: "mentions" | "conf" | "cgu";
}

export async function LegalCrossLinks({
  currentPage,
}: Props): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <nav
      aria-label={t("seeAlsoTitle")}
      className="
        not-prose mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-8
        text-sm text-typography-600
      "
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
