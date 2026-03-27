import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

import { ContactEmailMailtoLink } from "@/components/contact-email-mailto-link";
import { CopyEmailButton } from "@/components/copy-email-button";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'équipe Vagabond. Question, partenariat, demandes médias.",
};

export default async function ContactPage(): Promise<ReactNode> {
  const t = await getTranslations("contact");

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-foreground text-3xl font-bold md:text-4xl">
          {t("title")}
        </h1>
        <p className="text-typography-600 mt-4 text-lg">{t("subtitle")}</p>

        <div className="bg-background-200 mt-10 rounded-2xl p-8">
          <p className="text-typography-600 text-sm">{t("emailLabel")}</p>
          <ContactEmailMailtoLink
            href="mailto:contact@vagabond.gg"
            page="contact"
            className="text-foreground mt-3 block text-2xl font-bold"
          >
            contact@vagabond.gg
          </ContactEmailMailtoLink>
          <CopyEmailButton
            email="contact@vagabond.gg"
            label={t("copyButton")}
            copiedLabel={t("copiedButton")}
            analyticsPage="contact"
          />
          <p className="text-typography-500 mt-6 text-sm">
            {t("responseTime")}
          </p>
        </div>

        <p className="text-typography-500 mt-8 text-sm">
          {t("proLink")}{" "}
          <Link
            href="/pro"
            className="text-primary-500 hover:text-primary-600 font-medium underline underline-offset-4"
          >
            {t("proLinkText")}
          </Link>
        </p>
      </div>
    </section>
  );
}
