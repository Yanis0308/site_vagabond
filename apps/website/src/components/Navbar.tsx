"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

import { useTranslationClient } from "@/app/i18n/client";
import { languages } from "@/app/i18n/settings";

import { FlagIconCustom } from "./FlagIconCustom";
interface NavbarProps {
  lng: string;
}

export default function Navbar({ lng }: NavbarProps): React.JSX.Element {
  const { t } = useTranslationClient(lng, ["common"]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const pathname = usePathname();

  const toggleDropdown = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
    if (isLangDropdownOpen) setIsLangDropdownOpen(false);
  };

  const toggleLangDropdown = (): void => {
    setIsLangDropdownOpen(!isLangDropdownOpen);
    if (isDropdownOpen) setIsDropdownOpen(false);
  };

  // Fonction pour obtenir le chemin dans une autre langue
  const getPathInLanguage = (newLang: string): string => {
    const pathSegments = pathname.split("/");
    // Remplacer le segment de langue par la nouvelle langue
    if (pathSegments.length > 1) {
      pathSegments[1] = newLang;
    }
    return pathSegments.join("/");
  };

  // Noms des langues pour l'affichage
  const languageNames: Record<string, string> = {
    fr: "Français",
    en: "English",
  };

  // Codes de pays pour les drapeaux
  const countryFlags: Record<string, string> = {
    fr: "FR",
    en: "GB",
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white shadow-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={`/${lng}`} className="flex items-center">
              <Image
                src="https://res.cloudinary.com/dkkyl2gjb/image/upload/v1743522684/vagabond-invert-color_bmrqw2.png"
                width={100}
                height={100}
                alt="Vagabond"
                className="mr-2"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden items-center space-x-8 md:flex">
            <Link
              href={`/${lng}/quiz/recommend-city`}
              className="text-gray-700 transition-colors hover:text-primary"
            >
              {t("navbar.quiz", { defaultValue: "Quiz" })}
            </Link>

            <Link
              href={`/${lng}/city-guides`}
              className="text-gray-700 transition-colors hover:text-primary"
            >
              {t("navbar.cities")}
            </Link>

            {/* Sélecteur de langue (desktop) */}
            <div className="relative">
              <button
                onClick={toggleLangDropdown}
                className="flex items-center text-gray-700 transition-colors hover:text-primary"
              >
                <FlagIconCustom
                  className="mr-2"
                  code={countryFlags[lng]}
                  size={32}
                />
                {languageNames[lng]}
                <svg
                  className="ml-1 size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isLangDropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
                  />
                </svg>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg">
                  {languages.map((langCode) => (
                    <Link
                      key={langCode}
                      href={getPathInLanguage(langCode)}
                      className={`flex items-center px-4 py-2 hover:bg-primary-50 hover:text-primary ${langCode === lng ? "bg-gray-100 font-medium" : "text-gray-700"}`}
                      onClick={() => {
                        setIsLangDropdownOpen(false);
                      }}
                    >
                      <FlagIconCustom
                        className="mr-2"
                        code={countryFlags[langCode]}
                        size={32}
                      />
                      {languageNames[langCode]}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile language and menu buttons */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Sélecteur de langue mobile (en dehors du menu principal) */}
            <div className="relative">
              <button
                onClick={toggleLangDropdown}
                className="flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 hover:text-primary focus:outline-none"
                aria-label="Change language"
              >
                <FlagIconCustom
                  className="mr-2"
                  code={countryFlags[lng]}
                  size={32}
                />
                <span className="ml-1 text-sm font-medium">
                  {lng.toUpperCase()}
                </span>
              </button>

              {isLangDropdownOpen && (
                <div className="absolute left-0 z-10 mt-2 w-36 rounded-md bg-white py-1 shadow-lg">
                  {languages.map((langCode) => (
                    <Link
                      key={langCode}
                      href={getPathInLanguage(langCode)}
                      className={`flex items-center px-4 py-2 hover:bg-primary-50 hover:text-primary ${langCode === lng ? "bg-gray-100 font-medium" : "text-gray-700"}`}
                      onClick={() => {
                        setIsLangDropdownOpen(false);
                      }}
                    >
                      <FlagIconCustom
                        className="mr-2"
                        code={countryFlags[langCode]}
                        size={32}
                      />
                      <span>{langCode.toUpperCase()}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Menu burger button */}
            <button
              onClick={toggleDropdown}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-primary focus:outline-none"
            >
              <svg
                className="size-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isDropdownOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isDropdownOpen && (
        <div className="md:hidden">
          <div className="space-y-1 bg-white px-2 pb-3 pt-2 shadow-lg">
            <Link
              href={`/${lng}/quiz/recommend-city`}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary"
              onClick={() => {
                setIsDropdownOpen(false);
              }}
            >
              {t("navbar.quiz", { defaultValue: "Quiz" })}
            </Link>

            <Link
              href={`/${lng}/city-guides`}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary"
              onClick={() => {
                setIsDropdownOpen(false);
              }}
            >
              {t("navbar.cities", { defaultValue: "Villes" })}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
