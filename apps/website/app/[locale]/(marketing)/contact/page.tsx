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
        <h1
          className="
            font-display text-3xl font-bold text-foreground
            md:text-4xl
          "
        >
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-typography-600">{t("subtitle")}</p>

        <div className="mt-10 rounded-2xl bg-background-200 p-8">
          <p className="text-sm text-typography-600">{t("emailLabel")}</p>
          <ContactEmailMailtoLink
            href="mailto:contact@vagabond.gg"
            page="contact"
            className="mt-3 block text-2xl font-bold text-foreground"
          >
            contact@vagabond.gg
          </ContactEmailMailtoLink>
          <CopyEmailButton
            email="contact@vagabond.gg"
            label={t("copyButton")}
            copiedLabel={t("copiedButton")}
            analyticsPage="contact"
          />
          <p className="mt-6 text-sm text-typography-500">
            {t("responseTime")}
          </p>
        </div>

        <p className="mt-8 text-sm text-typography-500">
          {t("proLink")}{" "}
          <Link
            href="/pro"
            className="
              font-medium text-primary-500 underline underline-offset-4
              hover:text-primary-600
            "
          >
            {t("proLinkText")}
          </Link>
        </p>
      </div>
    </section>
  );
}
