import Image from "next/image";
import { type ReactNode } from "react";

import { Marquee } from "@/components/ui/marquee";

interface Props {
  label: string;
  subtitle?: string;
}

const LOGO_CLASS =
  "h-16 md:h-20 w-auto opacity-80 transition-opacity hover:opacity-100 shrink-0";

const LOGOS = [
  {
    src: "/images/logo-french-tech.webp",
    alt: "La French Tech Lille",
    width: 200,
    height: 200,
  },
  {
    src: "/images/logo-hit.jpeg",
    alt: "HIT Hauts-de-France Innovation Tourisme",
    width: 200,
    height: 200,
  },
  {
    src: "/images/logo-hdfid.webp",
    alt: "HDFID Hauts-de-France Innovation Developpement",
    width: 260,
    height: 130,
  },
  {
    src: "/images/logo-spark.png",
    alt: "Spark Innovation",
    width: 260,
    height: 100,
  },
  {
    src: "/images/logo-ovhcloud-startup.png",
    alt: "OVHcloud Startup Program",
    width: 812,
    height: 131,
  },
] as const;

export function TrustBar({ label, subtitle }: Props): ReactNode {
  return (
    <section className="overflow-hidden bg-background-200 px-6 py-5">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4">
        <span className="text-sm font-medium text-typography-500">{label}</span>
        <div className="mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <Marquee duration="30s" pauseOnHover gap="3rem" repeat={6}>
            {LOGOS.map((logo) => (
              <Image
                key={logo.src}
                src={logo.src}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
                className={LOGO_CLASS}
              />
            ))}
          </Marquee>
        </div>
        {subtitle !== undefined && (
          <p className="mx-auto max-w-2xl text-center text-sm/relaxed text-typography-500">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
