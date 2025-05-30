"use client";
import { usePathname, useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect } from "react";

// from https://github.com/zsajjad/react-facebook-pixel/issues/53#issuecomment-2164019562
export const FacebookPixelEvents: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    void import("react-facebook-pixel")
      .then((x) => x.default)
      .then((ReactPixel) => {
        ReactPixel.init(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? ""); //don't forget to change this
        ReactPixel.pageView();
      });
  }, [pathname, searchParams]);

  return null;
};
