"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function CountUp({
  end,
  suffix = "",
  prefix = "",
  duration = 1500,
}: Props): ReactNode {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry !== undefined && entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return (): void => {
      observer.disconnect();
    };
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    let frameId: number;
    const startTime = performance.now();

    function animate(currentTime: number): void {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);

      setCount(Math.round(easedProgress * end));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);
    return (): void => {
      cancelAnimationFrame(frameId);
    };
  }, [hasStarted, end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("fr-FR")}
      {suffix}
    </span>
  );
}
