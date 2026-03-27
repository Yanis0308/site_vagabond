import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

export const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
