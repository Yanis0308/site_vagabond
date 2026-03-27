"use client";

import "smartbanner.js/dist/smartbanner.min.css";

import { type ReactNode, useEffect } from "react";

export function SmartBanner(): ReactNode {
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- smartbanner.js is a side-effect-only IIFE
    require("smartbanner.js/dist/smartbanner.min.js");
  }, []);

  return null;
}
