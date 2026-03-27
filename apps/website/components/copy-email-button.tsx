"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { trackContactEmailIntent } from "@/lib/analytics";

interface Props {
  email: string;
  label: string;
  copiedLabel: string;
  /** When set, fires `contact_email_intent` with action `copy`. */
  analyticsPage?: "contact" | "pro";
}

export function CopyEmailButton({
  email,
  label,
  copiedLabel,
  analyticsPage,
}: Props): ReactNode {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return (): void => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  function handleClick(): void {
    if (analyticsPage !== undefined) {
      trackContactEmailIntent("copy", analyticsPage);
    }
    void navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }

  return (
    <Button
      variant="secondary"
      size="lg"
      className="mt-4 rounded-full px-8"
      onClick={handleClick}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
