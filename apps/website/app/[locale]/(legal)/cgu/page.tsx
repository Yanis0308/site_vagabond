import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
};

export default async function CguPage(): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <article className="prose max-w-none prose-neutral">
      <h1>{t("cguTitle")}</h1>

      <h2>Objet</h2>
      <p>
        Les présentes conditions générales d&apos;utilisation régissent
        l&apos;utilisation du site web www.vagabond.gg et de l&apos;application
        mobile Vagabond.
      </p>

      <h2>Accès au service</h2>
      <p>
        L&apos;application Vagabond est accessible gratuitement sur iOS et
        Android. L&apos;utilisation des fonctionnalités nécessite la création
        d&apos;un compte utilisateur.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les contenus, marques, logos et éléments graphiques de Vagabond sont
        protégés par le droit de la propriété intellectuelle.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Vagabond s&apos;efforce de fournir des informations exactes mais ne peut
        garantir l&apos;exhaustivité ou l&apos;exactitude des points
        d&apos;intérêt référencés.
      </p>

      <h2>Modification des CGU</h2>
      <p>
        Vagabond se réserve le droit de modifier les présentes CGU. Les
        utilisateurs seront informés de toute modification substantielle.
      </p>
    </article>
  );
}
