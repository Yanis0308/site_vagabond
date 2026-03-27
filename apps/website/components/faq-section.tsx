import { type ReactNode } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BlurFade } from "@/components/ui/blur-fade";
import { faqPageSchema, JsonLd } from "@/lib/json-ld";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  title?: string;
  items: FaqItem[];
  columns?: 1 | 2;
  className?: string;
  enableJsonLd?: boolean;
}

export function FaqSection({
  title,
  items,
  columns = 1,
  className,
  enableJsonLd = true,
}: Props): ReactNode {
  const midpoint = Math.ceil(items.length / 2);
  const leftItems = columns === 2 ? items.slice(0, midpoint) : items;
  const rightItems = columns === 2 ? items.slice(midpoint) : [];

  return (
    <section className={cn("px-6 py-20", className)}>
      {enableJsonLd ? <JsonLd data={faqPageSchema(items)} /> : null}
      <div className="mx-auto max-w-5xl">
        {title !== undefined ? (
          <h2 className="font-display text-foreground mb-10 text-center text-3xl font-bold md:text-4xl">
            {title}
          </h2>
        ) : null}
        <div
          className={cn(
            "grid gap-6",
            columns === 2 ? "md:grid-cols-2" : "grid-cols-1",
          )}
        >
          <BlurFade delay={0}>
            <FaqAccordion items={leftItems} startIndex={0} />
          </BlurFade>
          {rightItems.length > 0 ? (
            <BlurFade delay={0.2}>
              <FaqAccordion items={rightItems} startIndex={midpoint} />
            </BlurFade>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FaqAccordion({
  items,
  startIndex,
}: {
  items: FaqItem[];
  startIndex: number;
}): ReactNode {
  return (
    <Accordion>
      {items.map((item, index) => (
        <AccordionItem
          key={`faq-${String(startIndex + index)}`}
          value={`faq-${String(startIndex + index)}`}
        >
          <AccordionTrigger className="text-left text-base font-medium">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-typography-600">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
