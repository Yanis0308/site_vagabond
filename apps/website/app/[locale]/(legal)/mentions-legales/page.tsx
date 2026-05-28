import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { type ReactNode } from "react";

export const metadata: Metadata = { title: "Mentions légales" };

export default async function MentionsLegalesPage(): Promise<ReactNode> {
  const t = await getTranslations("legal");

  return (
    <article className="prose max-w-none prose-neutral">
      <h1>{t("mentionsTitle")}</h1>

      <h2>Éditeur du site</h2>
      <p>
        Vagabond SAS
        <br />
        Adresse : [À compléter]
        <br />
        Email : contact@vagabond.gg
        <br />
        Directeur de la publication : [À compléter]
      </p>

      <h2>Hébergement</h2>
      <p>
        Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina,
        CA 91723, États-Unis.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus (textes, images, logos, illustrations)
        présents sur ce site sont la propriété exclusive de Vagabond SAS, sauf
        mention contraire. Toute reproduction, même partielle, est interdite
        sans autorisation préalable.
      </p>
    </article>
  );
}
