import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default async function ConfidentialitePage(): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <article className="prose prose-neutral max-w-none">
      <h1>{t("confTitle")}</h1>

      <h2>Données collectées</h2>
      <p>
        Lors de l&apos;utilisation de notre site, nous pouvons collecter les
        données suivantes : nom, adresse email, organisation (via les
        formulaires de contact).
      </p>

      <h2>Finalités</h2>
      <p>
        Les données collectées sont utilisées pour répondre à vos demandes de
        contact et vous fournir des informations sur nos services.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées pendant une durée maximale de 3 ans à
        compter du dernier contact.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
        rectification, de suppression et de portabilité de vos données. Pour
        exercer ces droits, contactez-nous à contact@vagabond.gg.
      </p>

      <h2>Cookies</h2>
      <p>
        Ce site n&apos;utilise pas de cookies de mesure d&apos;audience
        first-party au sens habituel du consentement bannière. Les statistiques
        de fréquentation sont traitées via Vercel Analytics (agrégées,
        respectueuses du RGPD) et ne nécessitent pas de consentement cookies
        équivalent à un traceur publicitaire.
      </p>
    </article>
  );
}
