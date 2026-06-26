import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { Link } from "@/i18n/navigation";
import { publicEnv } from "@/lib/config/public";

import { LocaleSwitcher } from "./locale-switcher";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { NavScrollEffect } from "./nav-scroll-effect";
import { NavTaapLink } from "./nav-taap-link";
import { SocialLinks } from "./social-links";

const NAV_LINK_CLASS =
  "text-typography-600 hover:text-foreground relative cursor-pointer text-base font-medium transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-primary-500 after:transition-all after:duration-300 hover:after:w-full";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}): ReactNode {
  return (
    <Link href={href} className={NAV_LINK_CLASS}>
      {children}
    </Link>
  );
}

export async function MarketingNav(): Promise<ReactNode> {
  const t = await getTranslations("nav");

  return (
    <NavScrollEffect>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-with-text.png"
            alt="Vagabond"
            width={140}
            height={36}
            className="h-11 w-auto max-w-36 sm:h-12 md:h-14 md:max-w-none"
            priority
          />
        </Link>

        {/* Desktop links */}
        <div
          className="
            hidden items-center gap-4
            md:flex
            lg:gap-6
          "
        >
          <NavLink href="/explorer">{t("explorer")}</NavLink>
          <NavLink href="/pro">{t("pro")}</NavLink>
          <NavLink href="/blog">{t("blog")}</NavLink>
          <NavLink href="/faq">FAQ</NavLink>
          <NavLink href="/contact">{t("contact")}</NavLink>
        </div>

        {/* Desktop CTA + locale */}
        <div
          className="
            hidden items-center gap-3
            md:flex
          "
        >
          <SocialLinks variant="nav" />
          <LocaleSwitcher />
          <NavTaapLink
            href={publicEnv.TAAP_IT_DESKTOP_URL}
            surface="nav_desktop"
            className="px-4 text-sm"
          >
            {t("download")}
          </NavTaapLink>
        </div>

        {/* Mobile */}
        <div
          className="
            flex items-center gap-2
            md:hidden
          "
        >
          <LocaleSwitcher />
          <NavTaapLink
            href={publicEnv.TAAP_IT_MOBILE_URL}
            surface="nav_mobile"
            className="px-3 text-xs sm:text-sm"
          >
            {t("download")}
          </NavTaapLink>
          <MobileNavDrawer />
        </div>
      </nav>
    </NavScrollEffect>
  );
}
