import React, { type ReactNode } from "react";

import { useTranslationClient } from "@/app/i18n/client";

import HoneyOneEmail from "./HoneyOneEmail";

interface HoneyOneEmailDevProps {
  citySlug: string;
  locale: string;
}

export const HoneyOneEmailDev = ({
  citySlug,
  locale,
}: HoneyOneEmailDevProps) => {
  const { t } = useTranslationClient(locale, ["emails"]);
  const tForEmails = (key: string): string => t(key, { ns: "emails" });
  return <HoneyOneEmail translate={tForEmails} citySlug={citySlug} />;
};

HoneyOneEmailDev.PreviewProps = {
  citySlug: "lisbon",
  locale: "fr",
} as HoneyOneEmailDevProps;

export default HoneyOneEmailDev;
