export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? `https://www.vagabond.gg`
    : (process.env.NEXT_PUBLIC_VERCEL_URL ?? `http://localhost:3002`);
}
