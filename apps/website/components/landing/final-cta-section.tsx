"use client";

import { type ReactNode } from "react";

import { AppStoreBadges } from "@/components/app-store-badges";
import { BlurFade } from "@/components/ui/blur-fade";
import { Particles } from "@/components/ui/particles";

interface Props {
  title: string;
  subtitle: string;
  qrLabel: string;
  qrDataUrl: string;
  qrAlt: string;
}

export function FinalCtaSection({
  title,
  subtitle,
  qrLabel,
  qrDataUrl,
  qrAlt,
}: Props): ReactNode {
  return (
    <section className="from-primary-500 to-primary-700 relative overflow-hidden bg-gradient-to-br px-6 py-20 text-center text-white">
      {/* Animated particles background */}
      <Particles quantity={40} color="#ffffff" size={2} speed={0.2} />

      {/* Subtle radial glow */}
      <div
        aria-hidden="true"
        className="animate-pulse-glow absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)]"
      />

      <BlurFade delay={0.2} className="relative z-10 mx-auto max-w-2xl">
        <h2 className="font-display text-3xl font-bold md:text-4xl">{title}</h2>
        <p className="mt-4 text-lg text-white/80">{subtitle}</p>
        <AppStoreBadges className="mt-8 justify-center" position="final_cta" />
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm text-white/60">{qrLabel}</p>
          <div className="inline-block w-[150px] rounded-xl bg-white p-3 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL from server-generated QR */}
            <img
              src={qrDataUrl}
              alt={qrAlt}
              width={150}
              height={150}
              className="h-auto w-full"
            />
          </div>
        </div>
      </BlurFade>
    </section>
  );
}
