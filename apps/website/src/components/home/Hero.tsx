import Image from "next/image";

interface HeroProps {
  t: (key: string) => string;
}

export default function Hero({ t }: HeroProps) {
  return (
    <div className="text-center">
      <div className="mb-6 md:mb-12">
        <Image
          src="https://res.cloudinary.com/dkkyl2gjb/image/upload/v1743522684/vagabond-invert-color_bmrqw2.png"
          alt="Vagabond Logo"
          width={300}
          height={300}
          className="mx-auto w-40 md:w-[300px]"
        />
      </div>

      <h1 className="mb-4 text-3xl font-bold text-primary md:mb-8 md:text-5xl">
        {t("home.title")}
      </h1>

      <p className="mb-8 text-lg text-gray-600 md:mb-16 md:text-xl">
        {t("home.subtitle")}
      </p>
    </div>
  );
}
