"use client";

import { useTranslations } from "next-intl";
import { type ComponentProps, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ContactForm({
  className,
  ...props
}: ComponentProps<typeof Card>): ReactNode {
  const t = useTranslations("contact");

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>{t("formTitle")}</CardTitle>
        <CardDescription>{t("formDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="contact-name">
                {t("formNameLabel")}
              </FieldLabel>
              <Input
                id="contact-name"
                name="name"
                type="text"
                placeholder={t("formNamePlaceholder")}
                autoComplete="name"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-company">
                {t("formCompanyLabel")}
              </FieldLabel>
              <Input
                id="contact-company"
                name="company"
                type="text"
                placeholder={t("formCompanyPlaceholder")}
                autoComplete="organization"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-email">
                {t("formEmailLabel")}
              </FieldLabel>
              <Input
                id="contact-email"
                name="email"
                type="email"
                placeholder={t("formEmailPlaceholder")}
                autoComplete="email"
                required
              />
              <FieldDescription>{t("formEmailDescription")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-message">
                {t("formMessageLabel")}
              </FieldLabel>
              <textarea
                id="contact-message"
                name="message"
                placeholder={t("formMessagePlaceholder")}
                required
                rows={10}
                className={cn(
                  `
                    min-h-56 w-full min-w-0 resize-y rounded-4xl border border-input bg-input/30 px-4 py-3 text-base
                    transition-colors outline-none
                    placeholder:text-muted-foreground
                    focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
                    disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50
                    aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20
                    md:text-sm
                    dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
                  `,
                )}
              />
            </Field>
            <Field>
              <Button
                type="submit"
                size="lg"
                className="
                  w-full
                  sm:w-auto
                "
              >
                {t("formSubmitButton")}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
