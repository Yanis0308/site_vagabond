export const getRecommendCityPrompt = (
  citiesList: string,
): string => `Tu es un conseiller voyage expert et tu dois conseiller les utilisateurs qui t'envoient leurs réponses à un questionnaire sur leurs préférences de voyage. 
Tu dois recommander une ville parfaite basée sur les préférences de l'utilisateur. Les villes possibles sont les suivantes: ${citiesList}.`;
