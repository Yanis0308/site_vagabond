"use client";

import { type ReactNode } from "react";

import { AppStoreBadges } from "@/components/app-store-badges";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { DotPattern } from "@/components/ui/dot-pattern";
import { IphoneMockup } from "@/components/ui/iphone-mockup";

interface Props {
  badge: string;
  title: string;
  subtitle: string;
  socialProof: string;
  qrLabel: string;
  qrDataUrl: string;
  qrAlt: string;
  mention: string;
}

export function HeroSection({
  badge,
  title,
  subtitle,
  socialProof,
  qrLabel,
  qrDataUrl,
  qrAlt,
  mention,
}: Props): ReactNode {
  return (
    <section className="bg-background-100 relative overflow-hidden px-6 pt-12 pb-20">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Text content */}
        <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <BlurFade delay={0.05}>
            <Badge
              variant="secondary"
              className="mb-6 rounded-full px-4 py-1.5 text-sm"
            >
              <AnimatedShinyText>{badge}</AnimatedShinyText>
            </Badge>
          </BlurFade>

          <BlurFade delay={0.1}>
            <h1 className="font-display text-4xl leading-tight font-bold md:text-5xl lg:text-6xl">
              <AnimatedGradientText>{title}</AnimatedGradientText>
            </h1>
          </BlurFade>

          <BlurFade delay={0.2}>
            <div className="mt-6 flex items-start gap-6">
              <div className="flex flex-col">
                <p className="text-typography-600 max-w-md text-lg md:text-xl">
                  {subtitle}
                </p>
                <p className="text-typography-500 mt-4 flex items-center gap-2 text-sm">
                  <span className="text-yellow-500">★★★★★</span>
                  {socialProof}
                </p>
              </div>
              <div className="hidden shrink-0 flex-col items-center gap-1.5 lg:flex">
                <div className="border-background-300 w-[200px] rounded-xl border bg-white p-2.5 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL from server-generated QR */}
                  <img
                    src={qrDataUrl}
                    alt={qrAlt}
                    width={200}
                    height={200}
                    className="h-auto w-full"
                  />
                </div>
                <p className="text-typography-500 text-xs">{qrLabel}</p>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.35}>
            <div className="mt-6">
              <AppStoreBadges position="hero" />
              <p className="text-typography-500 mt-3 text-sm">{mention}</p>
            </div>
          </BlurFade>
        </div>

        {/* Phone mockup with MagicUI iPhone frame */}
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-float relative">
            <div className="from-primary-400/20 to-secondary-500/15 absolute top-1/4 left-1/2 h-[400px] w-[300px] -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl" />
            <div className="relative z-10 w-[280px] md:w-[340px]">
              <IphoneMockup src="/images/hero-mockup.png" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
