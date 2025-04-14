import { createClient } from "@supabase/supabase-js";
import { logger } from "@vagabond/shared-utils";
import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

import { useTranslationServer } from "@/app/i18n";

import { HoneyOneEmail } from "../../../../emails/HoneyOneEmail";
// Type pour la réponse de l'API
interface EmailSubmission {
  email: string;
  rowId: string | number; // ID de la ligne à mettre à jour
  locale: string;
  citySlug: string;
}

// Créer un client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? "",
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const data = (await request.json()) as EmailSubmission;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- not in a react component
  const { t } = await useTranslationServer(data.locale, ["emails"]);
  const tForEmails = (key: string): string => t(key, { ns: "emails" });

  try {
    const { error: emailError } = await resend.emails.send({
      from: "Vagabond <welcome@news.vagabond.gg>",
      replyTo: "contact@vagabond.gg",
      to: [data.email],
      subject: t("title", { ns: "emails" }),
      react: HoneyOneEmail({
        translate: tForEmails,
        citySlug: data.citySlug,
      }),
    });

    if (emailError !== null) {
      logger.error(emailError);
    }

    // Mettre à jour la ligne existante dans la table form_answers
    const { error } = await supabase
      .from("form_answers")
      .update({ email: data.email })
      .eq("id", data.rowId);

    if (error !== null) {
      logger.error(error);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour de l'email" },
        { status: 500 },
      );
    }

    // Succès
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur API:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement de la demande" },
      { status: 500 },
    );
  }
}
