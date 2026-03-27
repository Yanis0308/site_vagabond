"use client";

import { motion } from "motion/react";
import { type ReactNode } from "react";

import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

interface Props {
  title: string;
  stats: Stat[];
}

export function StatsSection({ title, stats }: Props): ReactNode {
  return (
    <section className="bg-background-100 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-display text-foreground mb-10 text-center text-3xl font-bold md:text-4xl">
          {title}
        </h2>
        <div className="via-primary-400/30 mx-auto h-px max-w-2xl bg-gradient-to-r from-transparent to-transparent" />
        <div className="grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
          {stats.map((stat, index) => (
            <BlurFade key={stat.label} delay={index * 0.1}>
              <div className="border-background-300/50 bg-background-50/50 rounded-2xl border px-8 py-8">
                <div className="flex flex-col items-center gap-1">
                  <motion.span
                    className="font-display text-primary-500 text-4xl font-bold md:text-5xl"
                    whileInView={{ scale: [1, 1.08, 1] }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1 + 0.3,
                      ease: "easeOut",
                    }}
                  >
                    <NumberTicker
                      value={stat.value}
                      suffix={stat.suffix}
                      delay={index * 0.1 + 0.3}
                    />
                  </motion.span>
                  <motion.span
                    className="text-typography-600 text-sm"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1 + 0.4,
                    }}
                  >
                    {stat.label}
                  </motion.span>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
        <div className="via-primary-400/30 mx-auto h-px max-w-2xl bg-gradient-to-r from-transparent to-transparent" />
      </div>
    </section>
  );
}
