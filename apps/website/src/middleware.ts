import acceptLanguage from "accept-language";
import { type NextRequest, NextResponse } from "next/server";

import { cookieName, fallbackLng, languages } from "./app/i18n/settings";

acceptLanguage.languages(languages);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - img (/public/img)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|img/).*)",
  ],
};

export function middleware(req: NextRequest): NextResponse {
  let lng;
  if (req.cookies.has(cookieName))
    lng = acceptLanguage.get(req.cookies.get(cookieName)?.value);
  if (lng === null || lng === undefined)
    lng = acceptLanguage.get(req.headers.get("Accept-Language"));
  if (lng === null) lng = fallbackLng;

  // Redirect if lng in path is not supported
  if (
    !languages.some((loc) => req.nextUrl.pathname.startsWith(`/${loc}`)) &&
    !req.nextUrl.pathname.startsWith("/_next")
  ) {
    const url = new URL(`/${lng}${req.nextUrl.pathname}`, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  if (req.headers.has("referer")) {
    const refererUrl = new URL(req.headers.get("referer") ?? "");
    const lngInReferer = languages.find((l) =>
      refererUrl.pathname.startsWith(`/${l}`),
    );
    const response = NextResponse.next();
    if (lngInReferer !== undefined)
      response.cookies.set(cookieName, lngInReferer);
    return response;
  }

  return NextResponse.next();
}
