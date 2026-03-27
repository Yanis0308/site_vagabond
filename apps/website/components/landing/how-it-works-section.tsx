"use client";

import { type ReactNode } from "react";

import { BlurFade } from "@/components/ui/blur-fade";
import { BorderBeam } from "@/components/ui/border-beam";

interface Step {
  icon: string;
  number: string;
  title: string;
  description: string;
}

interface Props {
  title: string;
  steps: Step[];
}

export function HowItWorksSection({ title, steps }: Props): ReactNode {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <BlurFade>
          <h2 className="font-display text-foreground mb-16 text-center text-3xl font-bold md:text-4xl">
            {title}
          </h2>
        </BlurFade>

        <div className="flex flex-col gap-8">
          {steps.map((step, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <BlurFade key={step.number} delay={index * 0.15}>
                <div className="border-background-300 bg-background-50 relative overflow-hidden rounded-2xl border">
                  <BorderBeam size={120} duration={8} delay={index * 2} />
                  <div
                    className={`flex flex-col items-center gap-6 p-8 md:flex-row md:gap-10 md:p-10 ${isReversed ? "md:flex-row-reverse" : ""}`}
                  >
                    {/* Number + Icon */}
                    <div className="flex shrink-0 flex-col items-center">
                      <span className="from-primary-500 to-secondary-500 font-display bg-linear-to-br bg-clip-text text-7xl font-black text-transparent md:text-8xl">
                        {step.number}
                      </span>
                      <span className="mt-1 text-3xl">{step.icon}</span>
                    </div>

                    {/* Content */}
                    <div
                      className={`text-center ${isReversed ? "md:text-right" : "md:text-left"}`}
                    >
                      <h3 className="font-display text-foreground text-2xl font-bold tracking-wide md:text-3xl">
                        {step.title}
                      </h3>
                      <p className="text-typography-600 mt-3 max-w-md text-base leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
