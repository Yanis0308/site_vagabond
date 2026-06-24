import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { Link } from "@/i18n/navigation";

export async function MarketingFooter(): Promise<ReactNode> {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-typography-900 text-background-200">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div
          className="
            grid grid-cols-1 gap-10
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <span className="font-display text-xl font-bold text-white">
              Vagabond
            </span>
            <p className="text-sm text-background-300">{t("tagline")}</p>
          </div>

          {/* Explorer column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">
              {t("explorer")}
            </h3>
            <nav className="flex flex-col gap-2">
              <FooterLink href="/explorer">{t("regions")}</FooterLink>
              <FooterLink href="/explorer">{t("departements")}</FooterLink>
              <FooterLink href="/explorer">{t("villesCles")}</FooterLink>
            </nav>

            <h3 className="mt-4 text-sm font-semibold text-white">
              {t("pourLesPros")}
            </h3>
            <nav className="flex flex-col gap-2">
              <FooterLink href="/pro">{t("vagabondPro")}</FooterLink>
              <FooterLink href="/pro">{t("demanderDemo")}</FooterLink>
            </nav>
          </div>

          {/* Blog column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">{t("blog")}</h3>
            <nav className="flex flex-col gap-2">
              <FooterLink href="/blog">{t("derniersArticles")}</FooterLink>
              <FooterLink href="/blog">{t("gamification")}</FooterLink>
              <FooterLink href="/blog">{t("guides")}</FooterLink>
              <FooterLink href="/blog">{t("destinations")}</FooterLink>
            </nav>
          </div>

          {/* Legal + Contact column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">{t("legal")}</h3>
            <nav className="flex flex-col gap-2">
              <FooterLink href="/mentions-legales">
                {t("mentionsLegales")}
              </FooterLink>
              <FooterLink href="/confidentialite">
                {t("confidentialite")}
              </FooterLink>
              <FooterLink href="/cgu">{t("cgu")}</FooterLink>
              <FooterLink href="/faq">{t("faqLink")}</FooterLink>
            </nav>

            <h3 className="mt-4 text-sm font-semibold text-white">
              {t("contact")}
            </h3>
            <nav className="flex flex-col gap-2">
              <a
                href="mailto:contact@vagabond.gg"
                className="
                  text-sm text-background-300 transition-colors
                  hover:text-primary-400
                "
              >
                contact@vagabond.gg
              </a>
              <FooterLink href="/contact">{t("contactPage")}</FooterLink>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-background-300">
          {t("copyright", { year: String(year) })}
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): ReactNode {
  return (
    <Link
      href={href}
      className="
        text-sm text-background-300 transition-colors
        hover:text-primary-400
      "
    >
      {children}
    </Link>
  );
}
