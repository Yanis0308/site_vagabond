"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

import { FranceMap } from "@/components/france-map";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface RegionData {
  slug: string;
  nom: string;
  nbPois: number;
}

interface Props {
  title: string;
  description: string;
  ctaLabel: string;
  regions: RegionData[];
  placesLabel?: string;
}

export function MapSection({
  title,
  description,
  ctaLabel,
  regions,
  placesLabel,
}: Props): ReactNode {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="font-display text-foreground mb-8 text-3xl font-bold md:text-4xl">
          {title}
        </h2>
        <div className="relative mx-auto mb-8 max-w-3xl overflow-hidden">
          <div
            aria-hidden="true"
            className="from-primary-400/10 to-secondary-500/10 absolute top-1/2 left-1/2 -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br blur-2xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <FranceMap regions={regions} placesLabel={placesLabel} />
          </motion.div>
        </div>
        <p className="text-typography-600 mx-auto max-w-2xl text-lg">
          {description}
        </p>
        <Link href="/explorer" className="mt-6 inline-block">
          <Button variant="default" size="lg" className="rounded-full px-8">
            {ctaLabel}
          </Button>
        </Link>
      </div>
    </section>
  );
}
