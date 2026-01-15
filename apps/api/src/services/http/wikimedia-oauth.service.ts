import type { FastifyInstance } from "fastify";
import ky from "ky";

interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface OAuthErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Service complet pour gérer l'authentification OAuth 2.0 Wikimedia
 * Gère le cache des tokens, le renouvellement automatique et la thread-safety
 */
export class WikimediaOAuthService {
  private readonly oauthEndpoint =
    "https://meta.wikimedia.org/w/rest.php/oauth2/access_token";
  private accessToken: string | null = null;
  private expiresAt: Date | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private readonly refreshBufferMinutes = 60; // Renouveler 1 heure avant expiration

  /**
   * Vérifier si OAuth est configuré
   */
  isConfigured(fastify: FastifyInstance): boolean {
    const config = fastify.config.wikimedia.oauth2;
    return config.clientId !== "" && config.clientSecret !== "";
  }

  /**
   * Obtenir un access token valide
   * Renouvelle automatiquement si nécessaire
   * @param fastify Instance Fastify pour le logging et la config
   * @returns Access token ou null en cas d'erreur
   */
  async getAccessToken(fastify: FastifyInstance): Promise<string | null> {
    // Vérifier si OAuth est correctement configuré
    if (!this.isConfigured(fastify)) {
      fastify.log.error("OAuth credentials are missing or invalid");
      return null;
    }

    // Vérifier si le token actuel est valide
    if (this.accessToken !== null && this.isTokenValid()) {
      return this.accessToken;
    }

    // Si un renouvellement est déjà en cours, attendre sa completion
    if (this.refreshPromise !== null) {
      fastify.log.debug("Waiting for ongoing token refresh");
      return await this.refreshPromise;
    }

    // Lancer un nouveau renouvellement
    this.refreshPromise = this.refreshAccessToken(fastify);
    const token = await this.refreshPromise;
    this.refreshPromise = null;

    return token;
  }

  /**
   * Vérifier si le token actuel est valide (non expiré et avec buffer)
   */
  private isTokenValid(): boolean {
    if (this.expiresAt === null) {
      return false;
    }

    // Vérifier si le token expire dans moins d'1 heure
    const bufferTime = new Date(
      Date.now() + this.refreshBufferMinutes * 60 * 1000,
    );
    return this.expiresAt > bufferTime;
  }

  /**
   * Renouveler l'access token via client credentials flow
   * Utilise un mutex (refreshPromise) pour éviter les renouvellements simultanés
   */
  private async refreshAccessToken(
    fastify: FastifyInstance,
  ): Promise<string | null> {
    const config = fastify.config.wikimedia.oauth2;

    fastify.log.info("Refreshing OAuth access token");

    try {
      // Créer les paramètres URL-encoded
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
      });

      fastify.log.debug("Requesting OAuth access token");

      const response = await ky
        .post(this.oauthEndpoint, {
          body: params.toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 30000, // 30 seconds timeout
        })
        .json<OAuthTokenResponse>();

      if (response.access_token === "") {
        fastify.log.error({ response }, "OAuth response missing access_token");
        this.accessToken = null;
        this.expiresAt = null;
        return null;
      }

      // Les tokens Wikimedia expirent après 4 heures selon la documentation
      const expiresInSeconds = response.expires_in ?? 4 * 60 * 60; // 4 heures par défaut
      this.expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      this.accessToken = response.access_token;

      fastify.log.info(
        {
          tokenPrefix: this.maskToken(response.access_token),
          expiresAt: this.expiresAt.toISOString(),
          expiresIn: expiresInSeconds,
        },
        "OAuth access token refreshed successfully",
      );

      return response.access_token;
    } catch (error) {
      // Tenter d'extraire le message d'erreur de la réponse
      let errorMessage = "Unknown error";
      let errorDetails: unknown = error;

      if (
        error !== undefined &&
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const httpError = error as {
          response?: { json?: () => Promise<OAuthErrorResponse> };
        };
        try {
          const errorBody =
            httpError.response?.json !== undefined
              ? await httpError.response.json()
              : undefined;
          if (errorBody?.error !== undefined) {
            errorMessage = errorBody.error;
            errorDetails = {
              error: errorBody.error,
              error_description: errorBody.error_description,
            };
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }

      fastify.log.error(
        {
          error: errorMessage,
          details: errorDetails,
        },
        "Failed to refresh OAuth access token",
      );

      // Réinitialiser le cache en cas d'erreur
      this.accessToken = null;
      this.expiresAt = null;
      return null;
    }
  }

  /**
   * Masquer un token pour le logging
   */
  private maskToken(token: string): string {
    if (token.length <= 8) {
      return "***";
    }
    return `${token.slice(0, 8)}...`;
  }

  /**
   * Réinitialiser le cache (utile pour les tests ou en cas d'erreur critique)
   */
  reset(): void {
    this.accessToken = null;
    this.expiresAt = null;
    this.refreshPromise = null;
  }
}

// Instance singleton partagée
export const wikimediaOAuthService = new WikimediaOAuthService();
