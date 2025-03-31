"use client";

import { type ReactElement, useState, useEffect } from "react";
import { QUESTIONS } from "./data/questions";

// Type pour la réponse de l'API
interface CityRecommendation {
  city: string;
  country: string;
  activities: Array<{ activity: string }>;
}

// Fonction pour mélanger un tableau (algorithme de Fisher-Yates)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function HoneyOne(): ReactElement {
  // États pour gérer le questionnaire
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [recommendedCity, setRecommendedCity] = useState<string | null>(null);
  const [cityData, setCityData] = useState<CityRecommendation | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  // Nouvel état pour suivre si le quiz est terminé
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  // Nouvel état pour suivre si l'intro a été passée
  const [introSkipped, setIntroSkipped] = useState<boolean>(false);

  // Initialiser avec les options non mélangées pour éviter l'erreur d'hydratation
  const [shuffledOptions, setShuffledOptions] = useState(QUESTIONS[0].options);

  // Effet qui s'exécute une seule fois après le premier rendu (côté client uniquement)
  useEffect(() => {
    // Mélanger les options de la première question
    setShuffledOptions(shuffleArray(QUESTIONS[0].options));
  }, []);

  // Fonction pour commencer le quiz
  const startQuiz = () => {
    setIntroSkipped(true);
  };

  // Fonction pour formater les réponses pour l'envoi à l'API
  const getFormattedAnswersForAPI = () => {
    return QUESTIONS.map((question) => {
      const selectedOption = question.options.find(
        (option) => option.value === answers[question.id],
      );

      return {
        question: question.question,
        answer: selectedOption?.label || "Non répondu",
      };
    });
  };

  // Effet pour mélanger les options quand la question change
  useEffect(() => {
    if (currentStep < QUESTIONS.length) {
      setShuffledOptions(shuffleArray(QUESTIONS[currentStep].options));
    }
  }, [currentStep]);

  // Fonction pour passer à la question suivante
  const handleOptionSelect = (questionId: string, answer: string) => {
    // Mettre à jour les réponses
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    // Vérifier si c'est la dernière question
    if (currentStep === QUESTIONS.length - 1) {
      // Marquer le quiz comme terminé
      setQuizCompleted(true);
      // Activer l'état de soumission pour afficher l'écran de chargement
      setIsSubmitting(true);
      // Lancer la recherche
      submitAnswers();
    } else {
      // Sinon, passer à la question suivante
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Fonction pour soumettre les réponses à l'IA
  const submitAnswers = async () => {
    setApiError(null);

    try {
      // Préparation des données pour l'API
      const userResponses = getFormattedAnswersForAPI();

      // Appel à l'API OpenAI
      const response = await fetch("/api/recommend-city", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses: userResponses,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();

      if (data.city) {
        setRecommendedCity(data.city);
        setCityData({
          city: data.city,
          country: data.country || "Non spécifié",
          activities: data.activities || [],
        });
        setIsSubmitting(false);
      } else {
        throw new Error("Pas de ville recommandée reçue");
      }
    } catch (error) {
      console.error("Erreur lors de la soumission des réponses", error);
      setApiError(
        "Nous n'avons pas pu déterminer ta destination idéale. Essaie à nouveau plus tard.",
      );
      setIsSubmitting(false);
    }
  };

  // Fonction pour soumettre l'email
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implémenter la sauvegarde de l'email
    setShowDetails(true);
  };

  // Fonction pour réessayer en cas d'erreur
  const handleRetry = () => {
    setApiError(null);
    setIsSubmitting(true);
    submitAnswers();
  };

  // Affichage du composant basé sur l'étape actuelle
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        {!introSkipped ? (
          // Page d'introduction
          <div className="intro-container text-center py-8">
            <div className="intro-header mb-8">
              <h1 className="text-5xl font-bold text-blue-600 mb-4">
                ✨ DÉCOUVRE TA DESTINATION IDÉALE ✨
              </h1>
              <h2 className="text-3xl font-semibold text-blue-500 mb-6">
                Et si ton prochain voyage était écrit dans tes réponses ? 🌍
              </h2>
            </div>

            <div className="intro-content mb-10">
              <p className="text-xl mb-6">
                En seulement{" "}
                <span className="font-bold text-blue-500">10 questions</span>,
                notre IA va analyser ton profil voyageur et te recommander la
                destination parfaite pour tes prochaines vacances.
              </p>

              <div className="features grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                <div className="feature p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-2">⏱️</div>
                  <h3 className="font-semibold">Rapide</h3>
                  <p>2 minutes pour découvrir ta destination idéale</p>
                </div>
                <div className="feature p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold">Personnalisé</h3>
                  <p>Une recommandation basée sur tes préférences uniques</p>
                </div>
                <div className="feature p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-2">🔮</div>
                  <h3 className="font-semibold">Magique</h3>
                  <p>Laisse-toi surprendre par la pertinence de notre IA</p>
                </div>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="start-quiz-btn bg-blue-600 hover:bg-blue-700 text-white text-xl px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105"
            >
              COMMENCER L&apos;AVENTURE 🚀
            </button>
          </div>
        ) : !quizCompleted &&
          !isSubmitting &&
          currentStep < QUESTIONS.length ? (
          // Affichage des questions (seulement si le quiz n'est pas terminé et pas en train de soumettre)
          <div className="quiz-container">
            <h1 className="text-3xl font-bold text-center mb-8">
              ✈️ Quelle destination te correspond pour cet été ? 🏝️
            </h1>
            <div className="progress-bar mb-6">
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{
                    width: `${(currentStep / QUESTIONS.length) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Question {currentStep + 1} sur {QUESTIONS.length}
              </p>
            </div>

            {/* Affichage de la question actuelle */}
            <div className="question-container">
              <h2 className="text-xl font-semibold mb-6 text-center">
                {QUESTIONS[currentStep].question}
              </h2>
              <div className="options-container grid grid-cols-1 gap-3 mt-4">
                {shuffledOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleOptionSelect(
                        QUESTIONS[currentStep].id,
                        option.value,
                      )
                    }
                    className="option-button bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 text-left transition-all"
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : quizCompleted && recommendedCity ? (
          // Affichage du résultat et formulaire d'email (seulement si le quiz est terminé)
          <div className="result-container text-center">
            <h1 className="text-3xl font-bold mb-6">
              🎉 Ta destination idéale est :
            </h1>
            <div className="city-result mb-8">
              <h2 className="text-4xl font-bold text-blue-600">
                {recommendedCity} 🌟
              </h2>
              {cityData?.country && (
                <h3 className="text-xl text-blue-500 mt-1">
                  {cityData.country} 🗺️
                </h3>
              )}
              <p className="mt-4">
                Cette ville correspond parfaitement à tes préférences de voyage
                ! ✨
              </p>
            </div>

            {!showDetails ? (
              <div className="email-form-container">
                <h3 className="text-xl font-semibold mb-4">
                  📧 Pour découvrir les lieux incontournables et les trésors
                  cachés de {recommendedCity}
                </h3>
                <form onSubmit={handleEmailSubmit} className="mt-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ton adresse email"
                      required
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Recevoir mon guide 📚
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="city-details">
                <h3 className="text-xl font-semibold mb-4">
                  🙏 Merci ! Voici quelques informations sur {recommendedCity}
                </h3>

                {cityData?.activities && cityData.activities.length > 0 && (
                  <div className="activities-section mt-6">
                    <h4 className="text-lg font-medium mb-3 text-blue-600">
                      🏆 Top 10 des activités à {recommendedCity}
                    </h4>
                    <div className="activities-list grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      {cityData.activities.map((activity, index) => (
                        <div
                          key={index}
                          className="activity p-3 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <div className="flex items-start">
                            <span className="text-blue-500 font-bold mr-2">
                              {index + 1}.
                            </span>
                            <span>{activity.activity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="mt-8 mb-4">
                  📨 Nous t&apos;avons envoyé un guide complet par email avec
                  tous les détails sur les lieux à visiter et nos conseils
                  d&apos;initiés !
                </p>
              </div>
            )}
          </div>
        ) : (
          // Écran de chargement pendant l'analyse des réponses
          <div className="loading-container text-center py-10">
            <h2 className="text-2xl font-bold mb-4">
              🔍 Nous analysons tes réponses...
            </h2>
            <p className="text-gray-600 mb-6">
              🧠 Notre IA recherche la destination parfaite pour toi !
            </p>
            <div className="loader mx-auto w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>

            {apiError && (
              <div className="error-message bg-red-50 text-red-600 p-4 rounded-lg mt-6">
                ❌ {apiError}
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-auto block mt-4"
                >
                  Réessayer 🔄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
