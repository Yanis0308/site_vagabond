import { type ReactNode } from "react";

import { BlurFade } from "@/components/ui/blur-fade";
import {
  type CompareAppColumn,
  type CompareCriterionRow,
  type CompareLevel,
} from "@/lib/compare/types";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle: string;
  colCriterion: string;
  levelLabels: Record<CompareLevel, string>;
  apps: CompareAppColumn[];
  criteria: CompareCriterionRow[];
  className?: string;
}

function CompareCell({
  level,
  label,
}: {
  level: CompareLevel;
  label: string;
}): ReactNode {
  return (
    <td className="px-2 py-3 text-center md:px-3">
      <span
        aria-label={label}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full text-base font-semibold",
          level === "yes" && "bg-primary-100 text-primary-700",
          level === "no" && "bg-background-200 text-typography-400",
        )}
      >
        {level === "yes" ? "✓" : "X"}
      </span>
    </td>
  );
}

export function CompetitorComparisonTable({
  title,
  subtitle,
  colCriterion,
  levelLabels,
  apps,
  criteria,
  className,
}: Props): ReactNode {
  return (
    <section className={cn("bg-background-50 px-6 py-16", className)}>
      <div className="mx-auto max-w-7xl">
        <BlurFade delay={0}>
          <h2
            className="
              text-center font-display text-3xl font-bold text-foreground
              md:text-4xl
            "
          >
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-lg text-typography-600">
            {subtitle}
          </p>
        </BlurFade>

        <BlurFade delay={0.1}>
          <div
            className="
              mt-10 overflow-x-auto rounded-2xl border border-background-200 bg-background-50
              shadow-sm
            "
          >
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-background-200 bg-background-50">
                  <th
                    scope="col"
                    className="
                      sticky left-0 z-10 bg-background-50 px-4 py-4 font-semibold text-foreground
                      md:px-6
                    "
                  >
                    {colCriterion}
                  </th>
                  {apps.map((app) => (
                    <th
                      key={app.id}
                      scope="col"
                      className={cn(
                        "px-2 py-4 text-center font-semibold md:px-3",
                        app.isHighlight === true
                          ? "bg-primary-50/80 text-primary-700"
                          : "text-foreground",
                      )}
                    >
                      {app.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion) => (
                  <tr
                    key={criterion.id}
                    className="border-b border-background-200 last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="
                        sticky left-0 z-10 bg-background-50 px-4 py-3 font-medium text-foreground
                        md:px-6
                      "
                    >
                      {criterion.label}
                    </th>
                    {apps.map((app) => (
                      <CompareCell
                        key={`${criterion.id}-${app.id}`}
                        level={criterion.values[app.id] ?? "no"}
                        label={levelLabels[criterion.values[app.id] ?? "no"]}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
