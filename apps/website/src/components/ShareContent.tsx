"use client";
import { logger } from "@vagabond/shared-utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useTranslationClient } from "@/app/i18n/client";
import { getBaseUrl } from "@/utils/getBaseUrl";

import { CustomButton } from "./CustomButton";

interface ShareContentProps {
  lng: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  city: string;
}

const SHARE_URL = `${getBaseUrl()}/quiz/recommend-city`;

export const ShareContent = ({
  lng,
  onClose,
  showCloseButton = true,
  city,
}: ShareContentProps) => {
  const { t } = useTranslationClient(lng, ["cities-top-10"]);

  const shareImagePath = `/img/social-share/cities/${lng}/${city}.png`;

  const [showTooltip, setShowTooltip] = useState(false);
  const shareApiIsAvailable =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.share === "function";

  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 2000);

      return (): void => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [showTooltip]);

  const handleShareMobile = async (): Promise<void> => {
    try {
      if (shareApiIsAvailable) {
        const response = await fetch(shareImagePath);
        const blob = await response.blob();
        const file = new File([blob], `vagabond-${city}.png`, {
          type: "image/png",
        });

        await navigator.share({
          url: SHARE_URL,
          files: [file],
        });
      } else {
        void copyLink();
      }
    } catch (err) {
      logger.error("Erreur lors du partage mobile:", err);
    }
  };

  const copyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setShowTooltip(true);
    } catch (err) {
      logger.error("Erreur lors de la copie du lien:", err);
    }
  };

  const handleDownloadImage = async (): Promise<void> => {
    try {
      const response = await fetch(shareImagePath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vagabond-${city}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      logger.error("Erreur lors du téléchargement de l'image:", err);
    }
  };

  return (
    <div className="relative max-w-md rounded-xl bg-white p-8 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-primary-500">
          {t("share-popup.title", {
            ns: "cities-top-10",
          })}
        </h3>
        {showCloseButton && onClose !== undefined && (
          <button
            onClick={onClose}
            className="ml-4 text-2xl font-bold text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="relative mb-4 h-[300px] w-[210px] overflow-hidden">
          <Image
            src={shareImagePath}
            alt={"City guide share image"}
            fill
            className="object-cover"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Share in story button for Mobile */}
          <CustomButton
            onClick={() => void handleShareMobile()}
            variant="primary"
            hideOnDesktop
            ariaLabel={t("share-popup.share-button-mobile", {
              ns: "cities-top-10",
            })}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
              </svg>
            }
          >
            {t("share-popup.share-button-mobile", {
              ns: "cities-top-10",
            })}
          </CustomButton>

          {/* Copy link button with tooltip for Desktop */}
          <CustomButton
            onClick={() => void copyLink()}
            variant="primary"
            hideOnMobile
            ariaLabel={t("share-popup.share-button-desktop", {
              ns: "cities-top-10",
            })}
            showTooltip={showTooltip}
            tooltipText={t("share-popup.copied", {
              ns: "cities-top-10",
            })}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
            }
          >
            {t("share-popup.share-button-desktop", {
              ns: "cities-top-10",
            })}
          </CustomButton>

          {/* Download image button for Desktop */}
          <CustomButton
            onClick={() => void handleDownloadImage()}
            variant="outline"
            hideOnMobile
            ariaLabel={t("share-popup.download-image", {
              ns: "cities-top-10",
            })}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            }
          >
            {t("share-popup.download-image", {
              ns: "cities-top-10",
            })}
          </CustomButton>

          {/* Copy link button with tooltip for mobile */}
          <CustomButton
            onClick={() => void copyLink()}
            variant="outline"
            hideOnDesktop
            ariaLabel={t("share-popup.share-button-desktop", {
              ns: "cities-top-10",
            })}
            showTooltip={showTooltip}
            tooltipText={t("share-popup.copied", {
              ns: "cities-top-10",
            })}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
            }
          >
            {t("share-popup.share-button-desktop", {
              ns: "cities-top-10",
            })}
          </CustomButton>

          {/* Retake test button */}
          <Link
            href={SHARE_URL}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 text-center hover:bg-gray-300"
          >
            {t("share-popup.retake-test", { ns: "cities-top-10" })}
          </Link>
        </div>
      </div>
    </div>
  );
};
