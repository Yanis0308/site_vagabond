import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React, { type ReactNode } from "react";

import { getBaseUrl } from "@/utils/getBaseUrl";

interface HoneyOneEmailProps {
  translate?: (key: string, options?: Record<string, string>) => string;
  citySlug: string;
}

/**
 * Composant email pour Vagabond
 * @param translate - Fonction de traduction fournie par le serveur
 * @param citySlug - Slug de la ville recommandée
 * @param locale - Paramètre conservé pour la compatibilité avec l'interface mais non utilisé directement
 */
export const HoneyOneEmail = ({
  translate,
  citySlug,
}: HoneyOneEmailProps): ReactNode => {
  const t = translate ?? ((key: string): string => key);
  const url = `${getBaseUrl()}/city-guides/${citySlug}?from=quiz`;
  const copyrightText = `${t("copyright")} ${new Date().getFullYear()} ${t("vagabond")}`;

  return (
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              theme: "#f1512a",
              primary: "#f1512a",
              "primary-50": "#fff0ed",
              "primary-100": "#ffe1da",
              "primary-200": "#ffc2b5",
              "primary-300": "#ff9a84",
              "primary-400": "#ff6e4e",
              "primary-500": "#f1512a",
              "primary-600": "#e53817",
              "primary-700": "#bf2812",
              "primary-800": "#9c2314",
              "primary-900": "#7e2318",
            },
          },
        },
      }}
    >
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>{t("title")}</Preview>
          <Container className="mx-auto max-w-[600px] p-5">
            <Section className="mb-5 text-center">
              <Img
                src={
                  "https://res.cloudinary.com/dkkyl2gjb/image/upload/v1743522684/vagabond-invert-color_bmrqw2.png"
                }
                height="120"
                alt="Vagabond"
                className="mx-auto"
              />
            </Section>
            <Text className="mb-5 text-base leading-6 text-gray-700">
              {t("description")}
            </Text>
            <Text className="mb-5 text-base leading-6 text-gray-700">
              {t("thanks")}
            </Text>
            <Section className="my-8 text-center">
              <Button
                className="block rounded-md bg-primary px-2 py-3 text-center text-base font-bold text-white no-underline hover:bg-primary-600"
                href={url}
              >
                <span className="mr-2 text-[30px]">👉</span>
                <span className="text-[20px]">{t("seeDestination")}</span>
                <span className="ml-2 text-[30px]">👈</span>
              </Button>
            </Section>
            <Text className="mb-6 text-center text-sm italic text-gray-500">
              {t("promise")}
            </Text>

            <Hr className="my-8 border-gray-200" />

            <Text className="mb-5 mt-8 text-xl font-bold text-primary">
              {t("whatIsVagabond")}
            </Text>

            <Text className="mb-5 text-base leading-6 text-gray-700">
              {t("appDescription")}
            </Text>

            <Text className="mb-5 text-base leading-6 text-gray-700">
              📅 <strong>{t("goodNews")}</strong>
            </Text>

            <Text className="mb-3 text-base leading-6 text-gray-700">
              📲{" "}
              <Link
                href="https://www.instagram.com/vagabondapp_fr/"
                className="text-primary no-underline hover:underline"
              >
                {t("instagram")}
              </Link>
            </Text>

            <Text className="mb-3 text-base leading-6 text-gray-700">
              🎥{" "}
              <Link
                href="https://www.tiktok.com/@vagabond_app"
                className="text-primary no-underline hover:underline"
              >
                {t("tiktok")}
              </Link>
            </Text>

            <Text className="mb-3 text-base leading-6 text-gray-700">
              📢{" "}
              <Link
                href="https://www.linkedin.com/company/vagabond-app"
                className="text-primary no-underline hover:underline"
              >
                {t("linkedin")}
              </Link>
            </Text>

            <Text className="mb-5 text-base leading-6 text-gray-700">
              {t("excited")}
            </Text>

            <Text className="mt-8 text-base font-bold text-gray-700">
              {t("team")}
            </Text>

            <Hr className="my-8 border-gray-200" />

            <Text className="text-center text-xs text-gray-500">
              {copyrightText}
            </Text>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};

HoneyOneEmail.PreviewProps = {
  citySlug: "lisbon",
} as HoneyOneEmailProps;

export default HoneyOneEmail;
