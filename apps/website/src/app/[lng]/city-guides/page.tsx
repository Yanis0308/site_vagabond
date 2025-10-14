"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";

import { useTranslationClient } from "@/app/i18n/client";
import { FlagIconCustom } from "@/components/FlagIconCustom";

import { SUPPORTED_CITIES } from "../quiz/recommend-city/data/cities";

export default function CitiesPage() {
  const { lng } = useParams<{ lng: string }>();

  const { t } = useTranslationClient(lng, ["common", "cities-top-10"]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredCities, setFilteredCities] = useState<string[]>(
    [...SUPPORTED_CITIES].sort(),
  );

  // Mettre à jour les villes filtrées lorsque le terme de recherche change
  useEffect(() => {
    const filtered = [...SUPPORTED_CITIES]
      .sort()
      .filter((city) => city.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredCities(filtered);
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-primary-50 md:py-10">
      <div className="mx-auto min-h-screen max-w-5xl bg-white p-8 shadow-lg md:min-h-0 md:rounded-xl">
        <h1 className="mb-8 text-3xl font-bold text-primary-500">
          {t("cities.title")}
        </h1>

        {/* Barre de recherche */}
        <div className="mb-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="size-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-primary-500 focus:ring-primary-500"
              placeholder={t("cities.search_placeholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </div>

        {/* Liste des villes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredCities.map((city) => (
            <Link
              key={city}
              href={`/${lng}/city-guides/${city}`}
              className="block rounded-lg border border-gray-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-md"
            >
              <div className="flex flex-col items-center justify-center">
                <FlagIconCustom
                  className="mb-2"
                  code={t(`${city}.country-code`, {
                    ns: "cities-top-10",
                  })}
                  size={32}
                />
                <h3 className="font-medium">
                  {t(`${city}.name`, { ns: "cities-top-10" })}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        {filteredCities.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500">{t("cities.no_results")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
