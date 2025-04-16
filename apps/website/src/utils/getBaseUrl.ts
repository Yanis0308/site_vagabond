export function getBaseUrl(): string {
  return process.env.VERCEL_ENV === "production"
    ? `https://www.vagabond.gg`
    : (process.env.VERCEL_URL ?? `http://localhost:3002`);
}
