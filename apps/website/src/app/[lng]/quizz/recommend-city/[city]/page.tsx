"use client";

import { type ReactNode, useEffect, useState } from "react";
import React from "react";

import { useTranslationClient } from "@/app/i18n/client";

import { CITIES_WITH_COUNTRIES } from "../data/cities";

interface CityPageProps {
  params: Promise<{
    lng: string;
    city: string;
  }>;
}

const supportedCities = CITIES_WITH_COUNTRIES.map((city) => city.id);

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

export default function CityPage({ params }: CityPageProps): ReactNode {
  // Déballer la Promise params avec React.use()
  const resolvedParams = React.use(params);
  const { lng, city } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslationClient(lng, ["cities-top-10"]);
  const tWithCity = (str: string): string =>
    t(`${city}.${str}`, { ns: "cities-top-10" });

  useEffect(() => {
    // On vérifie si nous avons des données complètes pour cette ville
    if (supportedCities.includes(city)) {
      setLoading(false);
    } else {
      // Si la ville n'est pas dans nos données complètes, on affiche un message d'erreur
      setError(t("error-title"));
      setLoading(false);
    }
  }, [city, t]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg bg-red-50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-red-600">{error}</h2>
          <p className="mb-4">{t("error-message")}</p>
          <a
            href={`/${lng}`}
            className="inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary-600"
          >
            {t("back-home")}
          </a>
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
    <div className="min-h-screen bg-primary-50 md:py-12">
      <div className="mx-auto max-w-4xl overflow-hidden bg-white shadow-lg md:rounded-xl">
        {/* En-tête avec image de couverture */}
        <div
          className="relative h-64 bg-cover bg-center"
          style={{
            backgroundImage: `url(${tWithCity("image")})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <h1 className="mb-2 text-5xl font-bold">{tWithCity("name")}</h1>
            <h2 className="text-2xl italic">{tWithCity("title")}</h2>
          </div>
        </div>

        {/* Corps */}
        <div className="p-8">
          {/* Description */}
          <div className="mb-10">
            <p className="leading-relaxed text-gray-500">
              {tWithCity("description")}
            </p>
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
                      <span className="mr-2 text-yellow-500">🍽️</span>
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
          <a
            href={`/${lng}/honey-one`}
            className="mx-2 text-primary hover:underline"
          >
            {t("retake-test", { ns: "cities-top-10" })}
          </a>
          <span className="mx-2 text-gray-300">|</span>
          <a href={`/${lng}`} className="mx-2 text-primary hover:underline">
            {t("home", { ns: "cities-top-10" })}
          </a>
        </div>
      </div>
    </div>
  );
}
