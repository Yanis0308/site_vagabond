"use client";

import { type ReactNode } from "react";

import { IphoneMockup } from "@/components/ui/iphone-mockup";
import { Marquee } from "@/components/ui/marquee";

interface Screenshot {
  src: string;
  alt: string;
  caption: string;
}

interface Props {
  title: string;
  screenshots: Screenshot[];
}

export function ScreenshotsSection({ title, screenshots }: Props): ReactNode {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2
          className="
            mb-12 text-center font-display text-3xl font-bold text-foreground
            md:text-4xl
          "
        >
          {title}
        </h2>
        <div className="mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <Marquee pauseOnHover duration="50s" gap="1rem" repeat={4}>
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.src}
                className="
                  flex shrink-0 flex-col items-center px-6
                  md:px-8
                "
              >
                <span className="mb-2 text-sm font-medium text-typography-600">
                  {screenshot.caption}
                </span>
                <div
                  className="
                    w-[220px]
                    md:w-[260px]
                  "
                >
                  <IphoneMockup src={screenshot.src} />
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
}
