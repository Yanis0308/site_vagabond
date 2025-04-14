export function getBaseUrl(): string {
  return process.env.VERCEL_ENV === "production"
    ? `https://vagabond.gg`
    : (process.env.VERCEL_URL ?? `http://localhost:3002`);
}
