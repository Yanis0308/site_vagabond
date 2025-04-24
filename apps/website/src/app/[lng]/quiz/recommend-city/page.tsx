"use client";

import { logger } from "@vagabond/shared-utils";
import Image from "next/image";
import { type ReactElement, useEffect, useState } from "react";
import React from "react";
import useLocalStorageState from "use-local-storage-state";

import { useTranslationClient } from "@/app/i18n/client";

import { questions, type QuestionType } from "./data/questions";

// Type pour la réponse de l'API
interface CityRecommendation {
  city: string;
  rowId: number; // ID de la ligne dans Supabase
}

// Fonction pour obtenir les options (toujours dans l'ordre original)
const getOptions = (question: QuestionType): string[] => {
  // Retourner les options dans leur ordre original sans mélange
  return [...question.options];
};

interface HoneyOneProps {
  params: Promise<{ lng: string }>;
}

export default function HoneyOne({ params }: HoneyOneProps): ReactElement {
  // Résoudre la Promise params
  const resolvedParams = React.use(params);
  const { lng } = resolvedParams;

  const { t } = useTranslationClient(lng, ["questions"]);

  // États pour gérer le quiz
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedCity, setRecommendedCity] = useState<string | null>(null);
  const [recommendedCities, setRecommendedCities] = useLocalStorageState<
    string[]
  >("recommendedCities", { defaultValue: [] });
  const [cityData, setCityData] = useState<CityRecommendation | null>(null);
  const [formRowId, setFormRowId] = useState<string | number | null>(null); // Nouvel état pour stocker l'ID de la ligne
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState<boolean>(false); // Nouvel état pour gérer la soumission d'email
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Nouvel état pour suivre si le quiz est terminé
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  // Nouvel état pour suivre si l'intro a été passée
  const [introSkipped, setIntroSkipped] = useState<boolean>(false);

  // Utiliser les options non mélangées pour l'initialisation pour éviter les erreurs d'hydratation
  const [shuffledOptions, setShuffledOptions] = useState<
    QuestionType["options"]
  >([]);

  // Variable pour suivre si le composant est monté côté client
  const [isMounted, setIsMounted] = useState(false);

  // Effet qui s'exécute une seule fois après le premier rendu
  useEffect(() => {
    // Marquer que le composant est monté côté client
    setIsMounted(true);
  }, []); // Dépendance vide pour ne s'exécuter qu'une fois

  // Effet pour initialiser les options de la première question
  useEffect(() => {
    if (isMounted && questions.length > 0) {
      setShuffledOptions(getOptions(questions[0]));
    }
  }, [isMounted]); // Dépend seulement de isMounted et questions

  // Effet pour mélanger les options quand la question change
  useEffect(() => {
    if (isMounted && currentStep < questions.length) {
      // Obtenir les options (mélangées ou non) de la question courante
      setShuffledOptions(getOptions(questions[currentStep]));
    }
  }, [currentStep, isMounted]);

  // Fonction pour commencer le quiz
  const startQuiz = (): void => {
    setIntroSkipped(true);
  };

  // Fonction pour formater les réponses pour l'envoi à l'API
  const getFormattedAnswersForAPI = (
    currentAnswers = answers,
  ): Array<{
    question: string;
    answer: string;
    raw_question: string;
    raw_answer: string;
  }> => {
    return questions.map((question) => {
      const answerKey = currentAnswers[question.id];

      return {
        question: t(`questions:${question.id}.question`, { ns: "questions" }),
        answer: t(`questions:${question.id}.options.${answerKey}`, {
          ns: "questions",
        }),
        raw_question: question.id,
        raw_answer: answerKey,
      };
    });
  };

  // Fonction pour passer à la question suivante
  const handleOptionSelect = (questionId: string, answer: string): void => {
    // Créer un objet temporaire avec toutes les réponses, y compris la dernière
    const updatedAnswers = { ...answers, [questionId]: answer };

    // Mettre à jour les réponses
    setAnswers(updatedAnswers);

    // Vérifier si c'est la dernière question
    if (currentStep === questions.length - 1) {
      // Marquer le quiz comme terminé
      setQuizCompleted(true);
      // Activer l'état de soumission pour afficher l'écran de chargement
      setIsSubmitting(true);
      // Lancer la recherche avec les réponses mises à jour
      void submitAnswers(updatedAnswers);
    } else {
      // Sinon, passer à la question suivante
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Fonction pour soumettre les réponses à l'IA
  const submitAnswers = async (currentAnswers = answers): Promise<void> => {
    setApiError(null);

    try {
      // Préparation des données pour l'API avec les réponses actualisées
      const userResponses = getFormattedAnswersForAPI(currentAnswers);

      // Appel à l'API OpenAI avec les villes précédemment recommandées
      const response = await fetch("/api/recommend-city", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses: userResponses,
          locale: lng,
          previousCities: recommendedCities, // Envoyer le tableau des villes précédentes
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = (await response.json()) as {
        city: string;
        rowId: number;
      };

      logger.info(
        "city:",
        data.city,
        "previously recommended:",
        recommendedCities,
      );

      // Ajouter la nouvelle ville au tableau des villes recommandées seulement si elle n'y est pas déjà
      if (!recommendedCities.includes(data.city)) {
        setRecommendedCities([...recommendedCities, data.city]);
      }

      if (recommendedCities.length > 2) {
        setRecommendedCities(recommendedCities.slice(1));
      }

      setRecommendedCity(data.city);
      setCityData({
        city: data.city,
        rowId: data.rowId,
      });
      setFormRowId(data.rowId); // Stocker l'ID de la ligne
      setIsSubmitting(false);
    } catch (error) {
      logger.error("Erreur lors de la soumission des réponses", error);
      setApiError(t("quiz.error_api", { ns: "questions" }));
      setIsSubmitting(false);
    }
  };

  // Fonction pour soumettre l'email
  const handleEmailSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Empêcher la double soumission
    if (isEmailSubmitting) return;

    // Activer l'état de soumission
    setIsEmailSubmitting(true);

    try {
      // Envoyer l'email et l'ID de ligne à Supabase via une API
      const response = await fetch("/api/save-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          rowId: formRowId,
          locale: lng,
          citySlug: cityData?.city,
        }),
      });

      if (!response.ok) {
        throw new Error(t("quiz.error_email", { ns: "questions" }));
      }

      // Afficher le message de confirmation
      setShowDetails(true);
    } catch (error) {
      logger.error("Erreur lors de la soumission de l'email", error);
      alert(t("quiz.error_generic", { ns: "questions" }));
    } finally {
      // Désactiver l'état de soumission, que la requête réussisse ou échoue
      setIsEmailSubmitting(false);
    }
  };

  // Fonction pour réessayer en cas d'erreur
  const handleRetry = async (): Promise<void> => {
    setApiError(null);
    setIsSubmitting(true);
    await submitAnswers();
  };

  // Affichage du composant basé sur l'étape actuelle
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-primary-50 md:py-10">
      <div className="mx-auto min-h-screen max-w-3xl bg-white p-8 shadow-lg md:min-h-0 md:rounded-xl">
        {!introSkipped ? (
          // Page d'introduction
          <div className="pb-8 text-center">
            <div className="mb-8">
              <Image
                src={
                  "https://res.cloudinary.com/dkkyl2gjb/image/upload/v1743522684/vagabond-invert-color_bmrqw2.png"
                }
                width={300}
                height={300}
                alt="Vagabond"
                className="mx-auto pb-4"
              />
              <h2 className="mb-6 text-3xl font-semibold text-primary-500">
                {t("description", { ns: "questions" })}
              </h2>
            </div>

            <div className="mb-10">
              <p
                className="mb-6 text-xl"
                dangerouslySetInnerHTML={{
                  __html: t("quiz.intro_text", {
                    questionCount: questions.length.toString(),
                    ns: "questions",
                  }),
                }}
              />

              <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-primary-50 p-4">
                  <div className="mb-2 text-3xl">{"⏱️"}</div>
                  <h3 className="font-semibold">
                    {t("quiz.features.quick.title", { ns: "questions" })}
                  </h3>
                  <p>
                    {t("quiz.features.quick.description", { ns: "questions" })}
                  </p>
                </div>
                <div className="rounded-lg bg-primary-50 p-4">
                  <div className="mb-2 text-3xl">🎯</div>
                  <h3 className="font-semibold">
                    {t("quiz.features.custom.title", { ns: "questions" })}
                  </h3>
                  <p>
                    {t("quiz.features.custom.description", { ns: "questions" })}
                  </p>
                </div>
                <div className="rounded-lg bg-primary-50 p-4">
                  <div className="mb-2 text-3xl">🔮</div>
                  <h3 className="font-semibold">
                    {t("quiz.features.magic.title", { ns: "questions" })}
                  </h3>
                  <p>
                    {t("quiz.features.magic.description", { ns: "questions" })}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="rounded-full bg-primary px-10 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:bg-primary-600"
            >
              {t("quiz.start_button", { ns: "questions" })}
            </button>
          </div>
        ) : !quizCompleted &&
          !isSubmitting &&
          currentStep < questions.length ? (
          // Affichage des questions (seulement si le quiz n'est pas terminé et pas en train de soumettre)
          <div>
            <div className="mb-6">
              <div className="h-2 rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{
                    width: `${(currentStep / questions.length) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {t("quiz.question_progress", {
                  current: (currentStep + 1).toString(),
                  total: questions.length.toString(),
                  ns: "questions",
                })}
              </p>
            </div>

            {/* Affichage de la question actuelle */}
            <div>
              <h2 className="mb-6 text-center text-xl font-semibold">
                {t(`questions:${questions[currentStep].id}.question`, {
                  ns: "questions",
                })}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {shuffledOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      handleOptionSelect(questions[currentStep].id, option);
                    }}
                    className="rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-primary-500 hover:bg-primary-50"
                  >
                    <span className="font-medium">
                      {t(
                        `questions:${questions[currentStep].id}.options.${option}`,
                        { ns: "questions" },
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : quizCompleted && recommendedCity !== null ? (
          // Affichage du résultat et formulaire d'email (seulement si le quiz est terminé)
          <div className="text-center">
            <h1 className="mb-6 text-3xl font-bold">
              {t("quiz.result_title", { ns: "questions" })}
            </h1>
            <div className="mb-8">
              {cityData?.city !== undefined && (
                <h2 className="text-7xl font-bold text-primary">
                  <span className="blur-md">
                    {t("quiz.lurenberg", { ns: "questions" })}
                  </span>
                  <span className="pl-8 blur-sm">
                    {t("quiz.city-emoji", { ns: "questions" })}
                  </span>
                </h2>
              )}
              <p className="mt-4">
                {t("quiz.perfect_match", { ns: "questions" })}
              </p>
            </div>

            {!showDetails ? (
              <div>
                <h3 className="mb-4 text-xl font-semibold">
                  {t("quiz.email_form_title", { ns: "questions" })}
                </h3>
                <form
                  onSubmit={(e) => void handleEmailSubmit(e)}
                  className="mt-6"
                >
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                      placeholder={t("quiz.email_placeholder", {
                        ns: "questions",
                      })}
                      required
                      disabled={isEmailSubmitting}
                      className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:w-1/2"
                    />
                    <button
                      type="submit"
                      disabled={isEmailSubmitting}
                      className={`bg-primary ${
                        isEmailSubmitting
                          ? "cursor-not-allowed opacity-70"
                          : "hover:bg-primary-600"
                      } rounded-lg px-6 py-3 font-medium text-white transition-colors`}
                    >
                      {isEmailSubmitting
                        ? t("quiz.email_submitting", { ns: "questions" })
                        : t("quiz.email_submit", { ns: "questions" })}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h3 className="mb-4 text-xl font-semibold text-green-600">
                  {t("quiz.email_thanks", { ns: "questions" })}
                </h3>
                <div className="mt-6 rounded-lg bg-primary-50 p-6">
                  <div className="mb-4 flex justify-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-green-500 text-2xl text-white">
                      {t("quiz.checkmark", { ns: "questions" })}
                    </div>
                  </div>
                  <h4 className="mb-4 text-xl font-semibold text-primary">
                    {t("quiz.confirmation_title", { ns: "questions" })}
                  </h4>
                  <p className="mb-2">
                    {t("quiz.confirmation_intro", { ns: "questions" })}
                  </p>
                  <ul className="mb-4 list-disc pl-8 text-left">
                    <li>{t("quiz.confirmation_city", { ns: "questions" })}</li>
                    <li>
                      {t("quiz.confirmation_activities", { ns: "questions" })}
                    </li>
                    <li>{t("quiz.confirmation_tips", { ns: "questions" })}</li>
                  </ul>
                  <p className="mt-4 text-sm text-gray-600">
                    {t("quiz.check_spam", { ns: "questions" })}
                  </p>
                </div>

                <p className="mb-4 mt-8">
                  {t("quiz.email_sent", { ns: "questions" })}
                </p>
              </div>
            )}
          </div>
        ) : (
          // Écran de chargement pendant l'analyse des réponses
          <div className="py-10 text-center">
            <h2 className="mb-4 text-2xl font-bold">
              {t("quiz.loading", { ns: "questions" })}
            </h2>
            <div className="mx-auto size-16 animate-spin rounded-full border-4 border-primary-200 border-t-primary"></div>

            {apiError !== null && (
              <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-600">
                ❌ {apiError}
                <button
                  onClick={() => void handleRetry()}
                  className="mx-auto mt-4 block rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-600"
                >
                  {t("quiz.retry_button", { ns: "questions" })} 🔄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
