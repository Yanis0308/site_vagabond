"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ShimmerBorder } from "@/components/ui/shimmer-border";
import { Link } from "@/i18n/navigation";

interface Props {
  title: string;
  description: string;
  features: string;
  ctaLabel: string;
}

export function B2bTeaserSection({
  title,
  description,
  features,
  ctaLabel,
}: Props): ReactNode {
  const featureItems = features
    .split("·")
    .map((f) => f.trim())
    .filter(Boolean);

  return (
    <section className="px-6 py-20">
      <motion.div
        className="mx-auto max-w-5xl"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <ShimmerBorder
          shimmerColor="#c084fc"
          borderWidth={2}
          duration="4s"
          background="#9b4dca"
        >
          <div className="relative px-8 py-16 text-center text-white md:px-16">
            <div
              aria-hidden="true"
              className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:40px_40px]"
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                {title}
              </h2>
              <p className="mt-4 text-lg text-white/80">{description}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {featureItems.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-purple-700"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              <Link href="/pro">
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-8 rounded-full px-8"
                >
                  {ctaLabel}
                </Button>
              </Link>
            </div>
          </div>
        </ShimmerBorder>
      </motion.div>
    </section>
  );
}
