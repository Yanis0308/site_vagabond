"use client";

import { motion } from "motion/react";
import { type KeyboardEvent, type ReactNode } from "react";

import { useRouter } from "@/i18n/navigation";
import { trackMapRegionClick } from "@/lib/analytics";
import { FRANCE_MAP_VIEWBOX, FRANCE_REGIONS } from "@/lib/france-map-data";

const REGION_CENTROIDS: Record<
  string,
  { cx: number; cy: number; lx: number; ly: number }
> = {
  "hauts-de-france": { cx: 320, cy: 80, lx: 420, ly: -20 },
  normandie: { cx: 215, cy: 125, lx: 30, ly: 30 },
  "ile-de-france": { cx: 315, cy: 148, lx: 510, ly: 30 },
  "grand-est": { cx: 445, cy: 145, lx: 640, ly: 130 },
  bretagne: { cx: 105, cy: 175, lx: -80, ly: 100 },
  "pays-de-la-loire": { cx: 175, cy: 245, lx: -80, ly: 270 },
  "centre-val-de-loire": { cx: 280, cy: 215, lx: -80, ly: 185 },
  "bourgogne-franche-comte": { cx: 420, cy: 235, lx: 640, ly: 240 },
  "nouvelle-aquitaine": { cx: 235, cy: 345, lx: -80, ly: 390 },
  "auvergne-rhone-alpes": { cx: 420, cy: 330, lx: 640, ly: 350 },
  occitanie: { cx: 300, cy: 430, lx: 160, ly: 560 },
  "provence-alpes-cote-dazur": { cx: 470, cy: 395, lx: 660, ly: 410 },
  corse: { cx: 545, cy: 490, lx: 660, ly: 590 },
};

const REGION_COLORS: Record<string, { fill: string; hover: string }> = {
  "hauts-de-france": { fill: "#7C6EE6", hover: "#5B4ECF" },
  normandie: { fill: "#E67E5A", hover: "#D0603A" },
  "ile-de-france": { fill: "#F4A940", hover: "#E09020" },
  "grand-est": { fill: "#4EAEE0", hover: "#2E90C4" },
  bretagne: { fill: "#E05A8D", hover: "#C43A6D" },
  "pays-de-la-loire": { fill: "#5BC4A0", hover: "#3AAE84" },
  "centre-val-de-loire": { fill: "#A0D65B", hover: "#84BC3E" },
  "bourgogne-franche-comte": { fill: "#D4A0E0", hover: "#B87CC8" },
  "nouvelle-aquitaine": { fill: "#E0C44E", hover: "#C8A830" },
  "auvergne-rhone-alpes": { fill: "#5AADE0", hover: "#3A90C4" },
  occitanie: { fill: "#E06A6A", hover: "#C44A4A" },
  "provence-alpes-cote-dazur": { fill: "#6ECAD4", hover: "#4EB0BA" },
  corse: { fill: "#C49AE0", hover: "#A87CC4" },
};

interface RegionData {
  slug: string;
  nom: string;
  nbPois: number;
}

interface Props {
  regions: RegionData[];
  placesLabel?: string;
}

export function FranceMap({
  regions,
  placesLabel = "lieux",
}: Props): ReactNode {
  const router = useRouter();
  const regionDataMap = new Map(regions.map((r) => [r.slug, r]));

  function getRegionColor(slug: string): string {
    return REGION_COLORS[slug]?.fill ?? "#F8EAD7";
  }

  function handleRegionClick(slug: string): void {
    trackMapRegionClick(slug);
    router.push(`/explorer/${slug}`);
  }

  return (
    <div className="relative">
      <svg
        viewBox={FRANCE_MAP_VIEWBOX}
        className="h-auto w-full"
        role="img"
        aria-label="Carte interactive des régions de France"
      >
        {/* Region paths with staggered entrance */}
        {FRANCE_REGIONS.map((region, index) => (
          <motion.path
            key={region.slug}
            d={region.d}
            fill={getRegionColor(region.slug)}
            stroke="#ffffff"
            strokeWidth="2"
            className="cursor-pointer"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.4,
              delay: index * 0.06,
              ease: "easeOut",
            }}
            onClick={(): void => {
              handleRegionClick(region.slug);
            }}
            onKeyDown={(e: KeyboardEvent): void => {
              if (e.key === "Enter" || e.key === " ") {
                handleRegionClick(region.slug);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={region.nom}
          />
        ))}

        {/* Annotation dots + lines + labels with staggered fade-in */}
        {FRANCE_REGIONS.map((region, index) => {
          const centroid = REGION_CENTROIDS[region.slug];
          const data = regionDataMap.get(region.slug);
          if (centroid === undefined || data === undefined) return null;
          const displayName = data.nom;
          const color = REGION_COLORS[region.slug]?.hover ?? "#9B4DCA";
          const bgWidth = Math.max(displayName.length * 10, 120) + 24;
          return (
            <motion.g
              key={`annot-${region.slug}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: 0.5 + index * 0.08,
                ease: "easeOut",
              }}
            >
              <line
                x1={centroid.cx}
                y1={centroid.cy}
                x2={centroid.lx}
                y2={centroid.ly}
                stroke={color}
                strokeWidth="1.5"
                opacity="0.7"
                className="pointer-events-none"
              />
              <circle
                cx={centroid.cx}
                cy={centroid.cy}
                r="4"
                fill={color}
                className="pointer-events-none"
              />
              <g
                className="cursor-pointer"
                onClick={(): void => {
                  handleRegionClick(region.slug);
                }}
                role="link"
                tabIndex={0}
                onKeyDown={(e: KeyboardEvent): void => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleRegionClick(region.slug);
                  }
                }}
                aria-label={`${displayName} — ${data.nbPois.toLocaleString("fr-FR")} ${placesLabel}`}
              >
                <rect
                  x={centroid.lx - bgWidth / 2}
                  y={centroid.ly - 22}
                  width={bgWidth}
                  height="46"
                  rx="8"
                  fill="white"
                  opacity="0.92"
                  style={{ transition: "opacity 0.2s ease" }}
                />
                <text
                  x={centroid.lx}
                  y={centroid.ly - 3}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="800"
                  fill="#3a3a3a"
                >
                  {displayName}
                </text>
                <text
                  x={centroid.lx}
                  y={centroid.ly + 15}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="600"
                  fill={color}
                >
                  {data.nbPois.toLocaleString("fr-FR")} {placesLabel}
                </text>
              </g>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
