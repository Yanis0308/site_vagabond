import { type ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNav } from "@/components/marketing/marketing-nav";

interface Props {
  children: ReactNode;
}

export default function LegalLayout({ children }: Props): ReactNode {
  return (
    <>
      <MarketingNav />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </>
  );
}
