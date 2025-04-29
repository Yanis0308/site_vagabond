import Image from "next/image";
import Link from "next/link";
import { type ReactNode } from "react";

interface HeroProps {
  lng: string;
  t: (key: string) => string;
}

export default function Hero({ lng, t }: HeroProps): ReactNode {
  return (
    <div className="text-center">
      <div className="mb-12">
        <Image
          src="https://res.cloudinary.com/dkkyl2gjb/image/upload/v1743522684/vagabond-invert-color_bmrqw2.png"
          alt="Vagabond Logo"
          width={300}
          height={300}
          className="mx-auto"
        />
      </div>

      <h1 className="mb-8 text-4xl font-bold text-primary md:text-5xl">
        {t("home.title")}
      </h1>

      <p className="mb-12 text-xl text-gray-600">{t("home.subtitle")}</p>

      <div className="mb-16 flex items-center justify-center">
        <div className="text-6xl">👉</div>
        <Link
          href={`/${lng}/quiz/recommend-city`}
          className="mx-5 inline-block rounded-full bg-primary px-10 py-4 text-xl font-bold text-white transition-all hover:scale-105 hover:bg-primary-600"
        >
          {t("home.cta")}
        </Link>
        <div className="text-6xl">👈</div>
      </div>
    </div>
  );
}
