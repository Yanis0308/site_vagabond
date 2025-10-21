// Fix for @gluestack-ui/nativewind-utils import issue
/**
pnpm run typescript-check

> @vagabond/mobile-app@1.0.0 typescript-check /Users/sac/Documents/projects/vagagond-poc/apps/mobile-app
> tsc --noEmit

../../node_modules/@gluestack-ui/nativewind-utils/tva/index.ts:2:31 - error TS2307: Cannot find module 'tailwind-variants/dist/config' or its corresponding type declarations.
import type { TVConfig } from 'tailwind-variants/dist/config';
 */
declare module "tailwind-variants/dist/config" {
  // eslint-disable-next-line import/no-unresolved -- ok
  export * from "tailwind-variants/config";
  export interface TWMConfig {
    twMerge?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ok
    twMergeConfig?: any;
  }
  export type TVConfig = TWMConfig;
  export const defaultConfig: TVConfig;
}

declare module "tailwind-variants" {
  export const defaultConfig: {
    twMerge?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ok
    twMergeConfig?: any;
  };
}
