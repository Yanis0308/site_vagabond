import { logger } from "@vagabond/shared-utils";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useTranslationClient } from "@/app/i18n/client";
import { getBaseUrl } from "@/utils/getBaseUrl";

interface SharePopupProps {
  onClose: () => void;
  lng: string;
}

const SHARE_URL = `${getBaseUrl()}/quiz/recommend-city`;

export const SharePopup = ({ onClose, lng }: SharePopupProps): ReactNode => {
  const { t } = useTranslationClient(lng, ["cities-top-10"]);
  const [showTooltip, setShowTooltip] = useState(false);
  const shareApiIsAvailable =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.share === "function";

  useEffect(() => {
    // Bloquer le scroll sur le body quand la popup est ouverte
    document.body.classList.add("overflow-hidden");

    // Nettoyer quand la popup est fermée
    return (): void => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  useEffect(() => {
    // Masquer le tooltip après 2 secondes
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
        await navigator.share({
          url: SHARE_URL,
        });
      } else {
        void handleShareDesktop();
      }
    } catch (err) {
      logger.error("Erreur lors du partage mobile:", err);
    }
  };

  const handleShareDesktop = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setShowTooltip(true);
    } catch (err) {
      logger.error("Erreur lors de la copie du lien:", err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 max-w-md rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-primary-500">
            {t("share-popup.title", {
              ns: "cities-top-10",
            })}
          </h3>
          <button
            onClick={onClose}
            className="ml-4 text-2xl font-bold text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        <p className="mb-6 text-gray-600">
          {t("share-popup.description_share", {
            ns: "cities-top-10",
          })}
          <br />
          <br />
          {t("share-popup.description_retake", {
            ns: "cities-top-10",
          })}
        </p>

        <div className="grid grid-cols-1 gap-3">
          <div className="relative">
            <button
              onClick={(): void => {
                void handleShareMobile();
              }}
              className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-center text-white hover:bg-primary-600 md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 size-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
              </svg>
              {t("share-popup.share-button-mobile", {
                ns: "cities-top-10",
              })}
            </button>

            <button
              onClick={(): void => {
                void handleShareDesktop();
              }}
              className="hidden w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-center text-white hover:bg-primary-600 md:flex"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 size-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {t("share-popup.share-button-desktop", {
                ns: "cities-top-10",
              })}
            </button>

            {showTooltip && (
              <div className=" absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-sm text-white">
                {t("share-popup.copied", {
                  ns: "cities-top-10",
                })}
                <div className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-gray-800"></div>
              </div>
            )}
          </div>
          <Link
            href={SHARE_URL}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 text-center hover:bg-gray-300"
          >
            {t("share-popup.retake-test", { ns: "cities-top-10" })}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
};
