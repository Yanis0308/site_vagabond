import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function LegalLayout({ children }: Props): ReactNode {
  return <main className="mx-auto max-w-3xl px-6 py-16">{children}</main>;
}
