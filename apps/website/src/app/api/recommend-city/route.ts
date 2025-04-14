import { createClient } from "@supabase/supabase-js";
import { logger } from "@vagabond/shared-utils";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { CITIES_WITH_COUNTRIES } from "@/app/[lng]/quizz/recommend-city/data/cities";
// Type pour les réponses
interface QuizResponse {
  question: string;
  answer: string;
  raw_question: string;
  raw_answer: string;
}

// Type pour la réponse de l'API
interface CityRecommendation {
  city: string;
  country: string;
}

// Créer un client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? "",
);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Récupérer les données de la requête
    const { responses, locale } = (await request.json()) as {
      responses: QuizResponse[];
      locale: string;
    };

    if (!Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Format de données invalide" },
        { status: 400 },
      );
    }

    const randomTemperature = Math.random();

    // Préparer la liste des villes pour le prompt
    const citiesList = CITIES_WITH_COUNTRIES.map(
      (item) => `${item.city} (${item.country})`,
    ).join(", ");

    // Faire l'appel à l'API OpenAI
    const response = await openai.responses.create({
      model: "gpt-4o",
      // model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `Tu es un conseiller voyage expert et tu dois conseiller les utilisateurs qui t'envoient leurs réponses à un questionnaire sur leurs préférences de voyage. Tu dois recommander une ville parfaite basée sur les préférences de l'utilisateur. Les villes possibles sont les suivantes: ${citiesList}.`,
        },
        {
          role: "user",
          content: responses
            .map(
              (item: QuizResponse) =>
                `Question: "${item.question}" Réponse: "${item.answer}"`,
            )
            .join("\n"),
        },
      ],
      temperature: randomTemperature,
      text: {
        format: {
          type: "json_schema",
          name: "quizz_result",
          schema: {
            type: "object",
            properties: {
              city: {
                type: "string",
                enum: CITIES_WITH_COUNTRIES.map((item) => item.id),
              },
            },
            required: ["city"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    try {
      const parsedResponse = JSON.parse(
        response.output_text,
      ) as CityRecommendation;

      const { data, error } = await supabase
        .from("form_answers")
        .insert({
          gender: responses[0].raw_answer,
          age: responses[1].raw_answer,
          raw_answers: responses,
          result: { ...parsedResponse, temperature: randomTemperature },
          locale: locale,
        })
        .select("id");

      if (error !== null) {
        logger.error(error);
      }

      // Récupérer l'ID de la ligne créée
      const rowId =
        data !== null && data.length > 0 ? (data[0].id as number) : null;

      // Retourner la ville recommandée avec les informations supplémentaires et l'ID de la ligne
      return NextResponse.json({
        city: parsedResponse.city,
        country: parsedResponse.country,
        rowId: rowId, // Inclure l'ID pour une utilisation ultérieure
      });
    } catch (jsonError) {
      logger.error(
        "Erreur de parsing JSON:",
        jsonError,
        "Contenu:",
        response.output_text,
      );
      throw new Error("Format de réponse invalide");
    }
  } catch (error) {
    logger.error("Erreur API OpenAI:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recommandation de ville" },
      { status: 500 },
    );
  }
}
