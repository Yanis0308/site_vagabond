"use client";

import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { trackTaapDownloadClick } from "@/lib/analytics";
import { publicEnv } from "@/lib/config/public";

const LINK_CLASS =
  "text-foreground hover:bg-muted rounded-lg px-3 py-2 text-base font-medium transition-colors";

export function MobileNavDrawer(): ReactNode {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  function close(): void {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Image
            src="/images/logo-with-text.png"
            alt="Vagabond"
            width={140}
            height={36}
            className="h-14 w-auto self-start"
          />
        </SheetHeader>
        <nav className="flex flex-col gap-2 px-6 py-4">
          <Link href="/explorer" className={LINK_CLASS} onClick={close}>
            {t("explorer")}
          </Link>
          <Link href="/pro" className={LINK_CLASS} onClick={close}>
            {t("pro")}
          </Link>
          <Link href="/blog" className={LINK_CLASS} onClick={close}>
            {t("blog")}
          </Link>
          <Link href="/faq" className={LINK_CLASS} onClick={close}>
            FAQ
          </Link>
          <Link href="/contact" className={LINK_CLASS} onClick={close}>
            {t("contact")}
          </Link>
          <a
            href={publicEnv.TAAP_IT_MOBILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              mt-4 rounded-lg bg-primary-500 p-3 text-center text-base font-semibold text-primary-foreground
              transition-colors
              hover:bg-primary-600
            "
            onClick={(): void => {
              trackTaapDownloadClick("nav_mobile");
              close();
            }}
          >
            {t("download")}
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
