"use client";

import { Menu } from "@base-ui/react/menu";
import { useLocale } from "next-intl";
import { type ReactNode, useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { trackLocaleChange } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Locale = (typeof routing.locales)[number];

interface LocaleConfig {
  nativeName: string;
}

const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  fr: { nativeName: "Français" },
  en: { nativeName: "English" },
  de: { nativeName: "Deutsch" },
  nl: { nativeName: "Nederlands" },
  it: { nativeName: "Italiano" },
  es: { nativeName: "Español" },
  pt: { nativeName: "Português" },
  zh: { nativeName: "中文" },
  ja: { nativeName: "日本語" },
  pl: { nativeName: "Polski" },
  ko: { nativeName: "한국어" },
};

export function LocaleSwitcher(): ReactNode {
  const rawLocale = useLocale();
  const locale: Locale = (routing.locales as readonly string[]).includes(
    rawLocale,
  )
    ? (rawLocale as Locale)
    : routing.defaultLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(nextLocale: Locale): void {
    if (!routing.locales.includes(nextLocale) || nextLocale === locale) {
      return;
    }
    trackLocaleChange(locale, nextLocale);
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  const currentConfig = LOCALE_CONFIG[locale];

  return (
    <Menu.Root>
      <Menu.Trigger
        disabled={isPending}
        className={cn(
          `
            flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-typography-600
            transition-colors outline-none
            hover:text-foreground
          `,
          "hover:bg-background-100",
          isPending && "opacity-50",
        )}
      >
        <span aria-hidden="true">🌐</span>
        <span>{currentConfig.nativeName}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className="opacity-50"
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          className="z-50"
          side="bottom"
          align="end"
          sideOffset={6}
        >
          <Menu.Popup
            className="
              z-50 min-w-40 rounded-xl border border-background-200 bg-background-50 py-1.5 shadow-lg outline-none
            "
          >
            {routing.locales.map((loc) => {
              const config = LOCALE_CONFIG[loc];
              const isCurrent = loc === locale;
              return (
                <Menu.Item
                  key={loc}
                  onClick={(): void => {
                    handleLocaleChange(loc);
                  }}
                  className={cn(
                    `flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors outline-none`,
                    isCurrent
                      ? "font-semibold text-primary-500"
                      : `
                        text-typography-600
                        hover:bg-background-100 hover:text-foreground
                      `,
                  )}
                >
                  <span>{config.nativeName}</span>
                  {isCurrent && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </Menu.Item>
              );
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
