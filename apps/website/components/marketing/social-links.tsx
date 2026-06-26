import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

const SOCIAL_LINKS = [
  {
    href: "https://www.tiktok.com/@vagabond_france",
    label: "TikTok",
    icon: (
      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.27 0 .53.04.78.1v-3.16a5.78 5.78 0 0 0-.78-.05 5.84 5.84 0 0 0-5.84 5.84 5.84 5.84 0 0 0 5.84 5.84 5.84 5.84 0 0 0 5.84-5.84V8.83a8.15 8.15 0 0 0 4.77 1.52V7.19a4.85 4.85 0 0 1-1.07-.37z" />
    ),
  },
  {
    href: "https://www.instagram.com/vagabond_france/",
    label: "Instagram",
    icon: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zm0 7.2a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4zm5.305-7.455a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0z" />
    ),
  },
  {
    href: "https://www.facebook.com/people/Vagabond-France/61566326317187/",
    label: "Facebook",
    icon: (
      <path d="M9.101 23.691v-9.707H6.116V9.684h2.985V7.377c0-2.925 1.751-4.527 4.407-4.527 1.275 0 2.326.095 2.641.138v3.059l-1.811.001c-1.42 0-1.695.675-1.695 1.662v2.974h3.393l-.443 3.3H12.663v9.707H9.101z" />
    ),
  },
  {
    href: "https://www.youtube.com/@Vagabond-App/shorts",
    label: "YouTube",
    icon: (
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
] as const;

interface Props {
  variant?: "footer" | "nav";
  className?: string;
}

export function SocialLinks({
  variant = "footer",
  className,
}: Props): ReactNode {
  const linkClass =
    variant === "footer"
      ? "inline-flex size-9 items-center justify-center rounded-full text-background-300 transition-colors hover:bg-white/10 hover:text-white"
      : "inline-flex size-8 items-center justify-center rounded-full text-typography-600 transition-colors hover:bg-background-100 hover:text-foreground";

  const iconClass = variant === "footer" ? "size-5" : "size-4";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.label}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.label}
          className={linkClass}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={iconClass}
            aria-hidden="true"
          >
            {social.icon}
          </svg>
        </a>
      ))}
    </div>
  );
}
