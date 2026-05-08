import { SUPABASE_SSL_CERT } from "./supabase-cert.js";

export type PgSslOptions = false | { rejectUnauthorized: true; ca: string };

export function getPgSslOptions(isDev: boolean): PgSslOptions {
  return isDev ? false : { rejectUnauthorized: true, ca: SUPABASE_SSL_CERT };
}
