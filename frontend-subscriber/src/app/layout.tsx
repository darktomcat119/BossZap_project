import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

// Root layout is a pass-through for next-intl.
// The [locale]/layout.tsx provides the actual <html> and <body> tags.
// This avoids the "Only one element on document" hydration error.
export default function RootLayout({ children }: Props) {
  return children as JSX.Element;
}
