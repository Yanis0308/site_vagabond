import { createClient } from "@supabase/supabase-js";
import { logger } from "@vagabond/shared-utils";
import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
}

// Créer un client OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? "",
);

// ID de l'assistant OpenAI configuré pour la recommandation de ville
const ASSISTANT_ID = process.env.OPENAI_CITY_RECOMMENDATION_ASSISTANT_ID ?? "";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Récupérer les données de la requête
    const {
      responses,
      locale,
      previousCities = [],
    } = (await request.json()) as {
      responses: QuizResponse[];
      locale: string;
      previousCities?: string[];
    };

    if (!Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Format de données invalide" },
        { status: 400 },
      );
    }

    // Formatage des questions et réponses pour l'assistant
    let userContent = responses
      .map(
        (item: QuizResponse) =>
          `Question: "${item.question}" Réponse: "${item.answer}"`,
      )
      .join("\n");

    // Ajouter les villes à exclure si nécessaire
    if (previousCities.length > 0) {
      userContent += `\n\nForbidden Cities: ${previousCities.join(", ")}.`;
    }

    // Créer un thread
    const thread = await openai.beta.threads.create();

    // Ajouter un message au thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: userContent,
    });

    // Exécuter l'assistant sur le thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Attendre que l'exécution soit terminée
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    while (runStatus.status !== "completed") {
      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        throw new Error(
          `Exécution de l'assistant échouée: ${runStatus.status}`,
        );
      }

      // Attendre 1 seconde avant de vérifier à nouveau
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Récupérer les messages du thread pour obtenir la réponse
    const messages = await openai.beta.threads.messages.list(thread.id);

    // Le dernier message de l'assistant contient la réponse
    const assistantMessage = messages.data.find(
      (msg) => msg.role === "assistant" && msg.run_id === run.id,
    );

    if (assistantMessage?.content[0] === undefined) {
      throw new Error("Pas de réponse de l'assistant");
    }

    // Parser la réponse de l'assistant (supposée être au format JSON valide)
    try {
      const messageContent = assistantMessage.content[0];
      const content =
        messageContent.type === "text" ? messageContent.text.value : "";

      const parsedResponse = JSON.parse(content) as CityRecommendation;

      const { data, error } = await supabase
        .from("form_answers")
        .insert({
          locale: locale,
          raw_answers: responses.reduce<Record<string, string>>((acc, curr) => {
            acc[curr.raw_question] = curr.raw_answer;
            return acc;
          }, {}),
          result: {
            ...parsedResponse,
            previouslyRecommended: previousCities,
          },
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
        rowId: rowId, // Inclure l'ID pour une utilisation ultérieure
      });
    } catch (jsonError) {
      const contentForLogging = JSON.stringify(assistantMessage.content[0]);

      logger.error(
        "Erreur de parsing JSON:",
        jsonError,
        "Contenu:",
        contentForLogging,
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
