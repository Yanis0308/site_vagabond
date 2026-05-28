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
          <h2
            className="
              mb-16 text-center font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {title}
          </h2>
        </BlurFade>

        <div className="flex flex-col gap-8">
          {steps.map((step, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <BlurFade key={step.number} delay={index * 0.15}>
                <div className="relative overflow-hidden rounded-2xl border border-background-300 bg-background-50">
                  <BorderBeam size={120} duration={8} delay={index * 2} />
                  <div
                    className={`
                      flex flex-col items-center gap-6 p-8
                      md:flex-row md:gap-10 md:p-10
                      ${isReversed ? `md:flex-row-reverse` : ""}
                    `}
                  >
                    {/* Number + Icon */}
                    <div className="flex shrink-0 flex-col items-center">
                      <span
                        className="
                          bg-linear-to-br from-primary-500 to-secondary-500 bg-clip-text font-display text-7xl
                          font-black text-transparent
                          md:text-8xl
                        "
                      >
                        {step.number}
                      </span>
                      <span className="mt-1 text-3xl">{step.icon}</span>
                    </div>

                    {/* Content */}
                    <div
                      className={`
                        text-center
                        ${isReversed ? "md:text-right" : `md:text-left`}
                      `}
                    >
                      <h3
                        className="
                          font-display text-2xl font-bold tracking-wide text-foreground
                          md:text-3xl
                        "
                      >
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-md text-base/relaxed text-typography-600">
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
