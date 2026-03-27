import { track } from "@vercel/analytics";

export function trackAppStoreClick(
  source: "ios" | "android",
  position: string,
): void {
  track("app_store_click", { source, position });
}

export function trackTaapDownloadClick(
  surface: "nav_desktop" | "nav_mobile",
): void {
  track("taap_download_click", { surface });
}

export function trackProCalendlyEmbedView(): void {
  track("pro_calendly_embed_view");
}

export function trackMapRegionClick(regionSlug: string): void {
  track("map_region_click", { region: regionSlug });
}

export function trackContactEmailIntent(
  action: "mailto" | "copy",
  page: "contact" | "pro",
): void {
  track("contact_email_intent", { action, page });
}

export function trackLocaleChange(from: string, to: string): void {
  track("locale_change", { from, to });
}

export function trackBlogCategorySelect(categorySlug: string | null): void {
  track("blog_category_select", {
    category_slug: categorySlug ?? "all",
  });
}

export function trackRelatedArticleClick(articleSlug: string): void {
  track("related_article_click", { article: articleSlug });
}

export function trackExplorerDepartementClick(
  regionSlug: string,
  departementSlug: string,
): void {
  track("explorer_departement_click", {
    region: regionSlug,
    departement: departementSlug,
  });
}
