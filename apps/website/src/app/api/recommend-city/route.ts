import { CITIES } from "@/app/honey-one/data/cities";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Type pour les réponses
interface QuizResponse {
  question: string;
  answer: string;
}

// Type pour la réponse de l'API
interface CityRecommendation {
  city: string;
  country: string;
  activities: Array<{ activity: string }>;
}

// Créer un client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données de la requête
    const { responses } = await request.json();

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Format de données invalide" },
        { status: 400 },
      );
    }

    // Faire l'appel à l'API OpenAI
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: `Tu es un conseiller voyage expert et tu dois conseiller les utilisateurs qui t'envoient leurs réponses à un questionnaire sur leurs préférences de voyage. Tu dois recommander une ville parfaite basée sur les préférences de l'utilisateur. Les villes possibles sont les suivantes: ${CITIES.join(", ")}. Tu dois inclure le pays et les 10 meilleures activités à y faire dans ta réponse JSON.`,
        },
        {
          role: "user",
          content: responses
            .map(
              (item: QuizResponse) =>
                `Q: "${item.question}"\n A: "${item.answer}"`,
            )
            .join(""),
        },
      ],
      //   temperature: 0,
      text: {
        format: {
          type: "json_schema",
          name: "quizz_result",
          schema: {
            type: "object",
            properties: {
              city: { type: "string" },
              country: { type: "string" },
              activities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    activity: { type: "string" },
                  },
                  required: ["activity"],
                  additionalProperties: false,
                },
              },
            },
            required: ["city", "country", "activities"],
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

      //   if (!parsedResponse.city || !CITIES.includes(parsedResponse.city)) {
      //     throw new Error("Ville recommandée invalide");
      //   }

      // Retourner la ville recommandée avec les informations supplémentaires
      return NextResponse.json({
        city: parsedResponse.city,
        country: parsedResponse.country,
        activities: parsedResponse.activities,
      });
    } catch (jsonError) {
      console.error(
        "Erreur de parsing JSON:",
        jsonError,
        "Contenu:",
        response.output_text,
      );
      throw new Error("Format de réponse invalide");
    }
  } catch (error) {
    console.error("Erreur API OpenAI:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recommandation de ville" },
      { status: 500 },
    );
  }
}
