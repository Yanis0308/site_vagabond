"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface Props {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  className?: string;
  locale?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  className,
  locale = "fr-FR",
  suffix = "",
}: Props): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  const springValue = useSpring(motionValue, {
    damping: 210,
    stiffness: 210,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value);
      }, delay * 1000);
      return (): void => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [motionValue, isInView, delay, value, direction, startValue]);

  useEffect(
    () =>
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent, react-you-might-not-need-an-effect/no-pass-ref-to-parent -- motion value subscription, not a parent data pass
      springValue.on("change", (latest) => {
        if (ref.current !== null) {
          ref.current.textContent =
            Intl.NumberFormat(locale, {
              minimumFractionDigits: decimalPlaces,
              maximumFractionDigits: decimalPlaces,
            }).format(Number(latest.toFixed(decimalPlaces))) + suffix;
        }
      }),
    [springValue, decimalPlaces, locale, suffix],
  );

  return (
    <span
      ref={ref}
      className={cn("inline-block tracking-wider tabular-nums", className)}
    >
      {startValue}
    </span>
  );
}
