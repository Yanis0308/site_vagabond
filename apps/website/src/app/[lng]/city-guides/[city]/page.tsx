"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import React from "react";

import { useTranslationClient } from "@/app/i18n/client";
import { FlagIconCustom } from "@/components/FlagIconCustom";
import { ShareContent } from "@/components/ShareContent";
import { SharePopup } from "@/components/SharePopup";

import { SUPPORTED_CITIES } from "../../quiz/recommend-city/data/cities";

const TitleAndInfo = ({
  title,
  info,
}: {
  title: string;
  info: string;
}): ReactNode => {
  return (
    <li className="grid grid-cols-4">
      <span className="col-span-4 font-bold md:col-span-1">{title}</span>
      <span className="col-span-4 md:col-span-3">{info}</span>
    </li>
  );
};

export default function CityPage() {
  const { lng, city } = useParams<{ lng: string; city: string }>();

  const [showPopup, setShowPopup] = useState(false);

  const searchParams = useSearchParams();
  const fromQuiz = searchParams.get("from") === "quiz";

  const { t } = useTranslationClient(lng, ["cities-top-10"]);
  const tWithCity = (str: string): string =>
    t(`${city}.${str}`, { ns: "cities-top-10" });

  const error = SUPPORTED_CITIES.includes(city)
    ? null
    : t("error-title", { ns: "cities-top-10" });

  useEffect(() => {
    // Configuration du popup si l'utilisateur vient du quiz
    if (fromQuiz) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 5000);

      return (): void => {
        clearTimeout(timer);
      };
    }
  }, [fromQuiz]);

  const handleClosePopup = (): void => {
    setShowPopup(false);
  };

  if (error !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600">{error}</h2>
          <p className="mb-4">{t("error-message", { ns: "cities-top-10" })}</p>
          <Link
            href={`/${lng}`}
            className="inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-600"
          >
            {t("back-home", { ns: "cities-top-10" })}
          </Link>
        </div>
      </div>
    );
  }

  // Récupérer les données de traduction pour les lieux à visiter
  const topPlaces = new Array(6).fill(null).map((_, i) => {
    return {
      name: tWithCity(`top-places.${i}.name`),
      image: tWithCity(`top-places.${i}.image`),
    };
  });

  // Récupérer les données de traduction pour les plats
  const dishes = new Array(3).fill(null).map((_, i) => {
    return {
      name: tWithCity(`dishes.${i}.name`),
      image: tWithCity(`dishes.${i}.image`),
    };
  });

  return (
    <div className="min-h-screen bg-primary-50 md:py-4">
      {showPopup && (
        <SharePopup onClose={handleClosePopup} lng={lng} city={city} />
      )}

      <div className="mx-auto max-w-4xl overflow-hidden bg-white shadow-lg md:rounded-xl">
        {/* En-tête avec image de couverture */}
        <div
          className="relative min-h-64 bg-cover bg-center"
          style={{
            backgroundImage: `url(${tWithCity("image")})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <div className="absolute bottom-0 left-0 z-10 p-6 text-white">
            <h1 className="mb-2 text-3xl font-bold md:text-5xl">
              {tWithCity("name")}, {tWithCity("country")}{" "}
              <FlagIconCustom code={tWithCity("country-code")} size={48} />
            </h1>
            <h2 className="text-xl italic md:text-2xl">{tWithCity("title")}</h2>
          </div>
        </div>

        {/* Corps */}
        <div className="p-8">
          {/* Description */}
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col items-center justify-center">
              <p className="leading-relaxed text-gray-500">
                {tWithCity("description")}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <ShareContent lng={lng} city={city} />
            </div>
          </div>

          {/* Incontournables */}
          <div className="mb-10">
            <h3 className="mb-6 border-b-2 border-primary-200 pb-2 text-2xl font-bold text-primary-500">
              {t("top-6-places", { ns: "cities-top-10" })}
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {topPlaces.map((item, index) => (
                <div
                  key={`must-see-${index}`}
                  className="overflow-hidden rounded-lg bg-white shadow-lg transition-shadow hover:shadow-xl"
                >
                  <div className="h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- useless */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="flex items-start p-4">
                    <span className="mr-2 text-lg font-bold text-primary-500">
                      {index + 1}.
                    </span>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* À goûter */}
          <div className="mb-10">
            <h3 className="mb-6 border-b-2 border-primary-200 pb-2 text-2xl font-bold text-primary-500">
              {t("taste", { ns: "cities-top-10" })}
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {dishes.map((item, index) => (
                <div
                  key={`food-${index}`}
                  className="overflow-hidden rounded-lg shadow-lg transition-shadow hover:shadow-xl"
                >
                  <div className="h-48 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element -- useless */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start">
                      <span className="mr-2 text-yellow-500">
                        {t("taste-emoji", { ns: "cities-top-10" })}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* À savoir */}
          <div className="mb-10">
            <h3 className="mb-4 border-b-2 border-primary-200 pb-2 text-2xl font-bold text-primary-500">
              {t("to-know.title", { ns: "cities-top-10" })}
            </h3>
            <ul className="space-y-3">
              <TitleAndInfo
                title={t("to-know.language", { ns: "cities-top-10" })}
                info={tWithCity("to-know.language")}
              />
              <TitleAndInfo
                title={t("to-know.weather", { ns: "cities-top-10" })}
                info={tWithCity("to-know.weather")}
              />
              <TitleAndInfo
                title={t("to-know.currency", { ns: "cities-top-10" })}
                info={tWithCity("to-know.currency")}
              />
              <TitleAndInfo
                title={t("to-know.airport", { ns: "cities-top-10" })}
                info={tWithCity("to-know.airport")}
              />
              <TitleAndInfo
                title={t("to-know.transport", { ns: "cities-top-10" })}
                info={tWithCity("to-know.transport")}
              />
            </ul>
          </div>

          {/* Astuces */}
          <div className="mb-10">
            <h3 className="mb-4 border-b-2 border-primary-200 pb-2 text-2xl font-bold text-primary-500">
              {t("tips.title", { ns: "cities-top-10" })}
            </h3>
            <ul className="space-y-2">
              <TitleAndInfo
                title={t("tips.time-zone", { ns: "cities-top-10" })}
                info={tWithCity("tips.time-zone")}
              />
              <TitleAndInfo
                title={t("tips.payment", { ns: "cities-top-10" })}
                info={tWithCity("tips.payment")}
              />
              <TitleAndInfo
                title={t("tips.meal-hours", { ns: "cities-top-10" })}
                info={tWithCity("tips.meal-hours")}
              />
              <TitleAndInfo
                title={t("tips.water", { ns: "cities-top-10" })}
                info={tWithCity("tips.water")}
              />
              <TitleAndInfo
                title={t("tips.electric-plugs", { ns: "cities-top-10" })}
                info={tWithCity("tips.electric-plugs")}
              />
            </ul>
          </div>

          {/* Urgences */}
          <div>
            <h3 className="mb-4 border-b-2 border-primary-200 pb-2 text-2xl font-bold text-primary-500">
              {t("emergency-numbers.title", { ns: "cities-top-10" })}
            </h3>
            <ul className="space-y-2">
              <TitleAndInfo
                title={t("emergency-numbers.police", { ns: "cities-top-10" })}
                info={tWithCity("emergency-numbers.police")}
              />
              <TitleAndInfo
                title={t("emergency-numbers.ambulance", {
                  ns: "cities-top-10",
                })}
                info={tWithCity("emergency-numbers.ambulance")}
              />
            </ul>
          </div>
        </div>

        {/* Pied de page */}
        <div className="bg-gray-100 p-6 text-center">
          <Link
            href={`/${lng}/quiz/recommend-city`}
            className="mx-2 text-primary hover:underline"
          >
            {t("retake-test", { ns: "cities-top-10" })}
          </Link>
          <span className="mx-2 text-gray-300">|</span>
          <Link href={`/${lng}`} className="mx-2 text-primary hover:underline">
            {t("home", { ns: "cities-top-10" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
