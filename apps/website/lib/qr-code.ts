import QRCode from "qrcode";

import { publicEnv } from "@/lib/config/public";

export interface QrCodeOptions {
  width?: number;
}

const QR_CODE_DARK = "#262627";
const QR_CODE_LIGHT_PNG = "#ffffff";

/** PNG data URL — suitable for `<img src={...} />` in client components. */
export async function generateQrCodeDataUrl(
  url: string,
  options?: QrCodeOptions,
): Promise<string> {
  const width = options?.width ?? 120;
  return await QRCode.toDataURL(url, {
    margin: 1,
    width,
    color: {
      dark: QR_CODE_DARK,
      light: QR_CODE_LIGHT_PNG,
    },
  });
}

/** Encodes the mobile Tap.it deeplink (QR scans open on a phone). */
export async function generateTapItQrCodeDataUrl(
  options?: QrCodeOptions,
): Promise<string> {
  return await generateQrCodeDataUrl(publicEnv.TAAP_IT_MOBILE_URL, options);
}
