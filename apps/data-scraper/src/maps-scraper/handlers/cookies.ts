import type { Page } from "puppeteer";

import { logUtils } from "../utils/logging.js";

/**
 * Click reject cookies button if required
 * Checks for the cookie consent form and clicks the reject button if present
 */
export async function clickRejectCookiesIfRequired(
  page: Page,
): Promise<boolean> {
  const currentURL = page.url();
  const prefix = "COOKIE CONSENT";
  const emoji = "🍪";

  logUtils.log(
    prefix,
    emoji,
    `Checking cookie consent. Current URL: ${currentURL}`,
  );

  // If already on google.com/maps/place/, no need to handle cookies
  // This avoids waiting for delays when already redirected to Place page
  if (currentURL.includes("google.com/maps/place/")) {
    logUtils.success(
      prefix,
      emoji,
      "Already on Place page, no cookie consent needed",
    );
    return false;
  }

  // Check if we're on the consent.google.com domain
  if (currentURL.includes("consent.google.com")) {
    logUtils.success(prefix, emoji, "Detected consent.google.com domain");

    try {
      // Wait for either form to appear OR redirect to Place page
      await page.waitForFunction(
        () => {
          // Check if redirected to Place page
          if (window.location.href.includes("google.com/maps/place/")) {
            return true; // Already redirected, no need to handle cookies
          }
          // Check if form is present
          return document.querySelector("form") !== null;
        },
        { timeout: 3000 },
      );

      // Check if we were redirected to Place page
      const urlAfterWait = page.url();
      if (urlAfterWait.includes("google.com/maps/place/")) {
        logUtils.success(
          prefix,
          emoji,
          "Redirected to Place page during wait, no cookie consent needed",
        );
        return false;
      }
      logUtils.success(prefix, emoji, "Form found");
    } catch {
      // If form not found, check if redirected to Place page
      const urlAfterWait = page.url();
      if (urlAfterWait.includes("google.com/maps/place/")) {
        logUtils.success(
          prefix,
          emoji,
          "Redirected to Place page, no cookie consent needed",
        );
        return false;
      }

      // If form not found, wait for DOM to be stable as fallback
      logUtils.warn(
        prefix,
        emoji,
        "Form not found, waiting for DOM to stabilize...",
      );
      try {
        await page.waitForFunction(
          () => {
            // Check if redirected to Place page
            if (window.location.href.includes("google.com/maps/place/")) {
              return true; // Already redirected
            }
            return (
              document.body !== undefined &&
              document.readyState === "complete" &&
              document.querySelector("body") !== null
            );
          },
          { timeout: 2000 },
        );

        // Double-check URL after wait
        const finalURL = page.url();
        if (finalURL.includes("google.com/maps/place/")) {
          logUtils.success(
            prefix,
            emoji,
            "Redirected to Place page during DOM stabilization",
          );
          return false;
        }
        logUtils.success(prefix, emoji, "DOM stabilized");
      } catch {
        // Final check if redirected
        const finalURL = page.url();
        if (finalURL.includes("google.com/maps/place/")) {
          logUtils.success(
            prefix,
            emoji,
            "Redirected to Place page, no cookie consent needed",
          );
          return false;
        }
        logUtils.warn(prefix, emoji, "Continuing anyway");
      }
    }

    // Try multiple selectors for the reject button (use $ instead of waitForSelector to avoid waiting)
    const rejectSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      'button[data-value="REJECT_ALL"]',
      'button[aria-label*="Reject"]',
      'button[aria-label*="Refuser"]',
      'button[aria-label*="Tout refuser"]',
      "form button",
    ];

    logUtils.log(
      prefix,
      emoji,
      `Trying ${rejectSelectors.length} selectors to find reject button...`,
    );
    for (const selector of rejectSelectors) {
      try {
        logUtils.log(prefix, emoji, `Trying selector: ${selector}`);
        const button = await page.$(selector);
        if (button !== null) {
          logUtils.success(
            prefix,
            emoji,
            "Element found, checking visibility...",
          );
          // Check if button is visible
          const isVisible = await page.evaluate((el) => {
            // Type guard to check if element is an HTMLElement
            if (
              el === undefined ||
              typeof el !== "object" ||
              !("offsetWidth" in el) ||
              !("offsetHeight" in el)
            ) {
              return false;
            }
            // Type assertion is safe here because of the type guard above
            const element = el as HTMLElement;
            return (
              element.offsetWidth > 0 &&
              element.offsetHeight > 0 &&
              window.getComputedStyle(element).display !== "none"
            );
          }, button);

          if (isVisible) {
            logUtils.success(prefix, emoji, "Button is visible, clicking...");
            const navigationPromise = page
              .waitForNavigation({
                waitUntil: "domcontentloaded",
                timeout: 5000,
              })
              .then(() => {
                logUtils.success(prefix, emoji, "Navigation completed");
              })
              .catch(() => {
                logUtils.warn(
                  prefix,
                  emoji,
                  "No navigation occurred (this is ok)",
                );
              });

            await button.click();
            logUtils.success(
              prefix,
              emoji,
              `Cookie consent rejected on consent.google.com with selector: ${selector}`,
            );

            // Wait for navigation or timeout
            await navigationPromise;

            // Check if redirected to Place page (common after cookie consent)
            const urlAfterClick = page.url();
            if (urlAfterClick.includes("google.com/maps/place/")) {
              logUtils.success(
                prefix,
                emoji,
                "Redirected to Place page after cookie consent",
              );
              return false; // No need to wait for consent to disappear, already on Place page
            }

            return true;
          } else {
            logUtils.warn(
              prefix,
              emoji,
              "Button found but not visible, trying next selector",
            );
          }
        } else {
          logUtils.warn(
            prefix,
            emoji,
            `Element not found with selector: ${selector}`,
          );
        }
      } catch (error) {
        logUtils.warn(
          prefix,
          emoji,
          `Error with selector ${selector}: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue to next selector
        continue;
      }
    }

    logUtils.error(
      prefix,
      emoji,
      "No reject button found on consent.google.com",
    );
    return false;
  }

  // If not on consent domain, check for consent form on current page
  // But if we're already on google.com/maps, cookies are likely already handled
  if (currentURL.includes("google.com/maps")) {
    logUtils.success(
      prefix,
      emoji,
      "Already on google.com/maps, cookies likely already handled, skipping check",
    );
    return false;
  }

  logUtils.log(
    prefix,
    emoji,
    "Not on consent domain, checking for consent form on current page...",
  );
  const cookieSelectors = [
    'form[action="https://consent.google.com/save"] input[type="submit"]',
    'form[action*="consent.google.com"] input[type="submit"]',
    'form[action*="consent.google.com"] button[type="submit"]',
    'button[data-value="REJECT_ALL"]',
    'button[aria-label*="Reject"]',
    'button[aria-label*="Refuser"]',
    'button[aria-label*="Tout refuser"]',
    'form[action*="consent.google.com"] button',
  ];

  logUtils.log(prefix, emoji, `Trying ${cookieSelectors.length} selectors...`);
  // Use $ instead of waitForSelector to avoid waiting - just check if element exists
  for (const selector of cookieSelectors) {
    try {
      const cookieButton = await page.$(selector);
      if (cookieButton !== null) {
        // Check if button is visible
        const isVisible = await page.evaluate((el) => {
          // Type guard to check if element is an HTMLElement
          if (
            el === undefined ||
            typeof el !== "object" ||
            !("offsetWidth" in el) ||
            !("offsetHeight" in el)
          ) {
            return false;
          }
          // Type assertion is safe here because of the type guard above
          const element = el as HTMLElement;
          return (
            element.offsetWidth > 0 &&
            element.offsetHeight > 0 &&
            window.getComputedStyle(element).display !== "none"
          );
        }, cookieButton);

        if (isVisible) {
          logUtils.success(prefix, emoji, "Found cookie button, clicking...");
          await cookieButton.click();
          logUtils.success(
            prefix,
            emoji,
            `Cookie consent clicked with selector: ${selector}`,
          );
          return true;
        }
      }
    } catch (error) {
      logUtils.warn(
        prefix,
        emoji,
        `Error checking selector: ${selector} - ${error instanceof Error ? error.message : String(error)}`,
      );
      // Continue to next selector without blocking
      continue;
    }
  }

  // No cookie consent found
  logUtils.success(
    prefix,
    emoji,
    "No cookie consent form found on current page (already handled or not present)",
  );
  return false;
}

/**
 * Wait for cookie consent form to disappear from DOM
 */
export async function waitForCookieConsentToDisappear(
  page: Page,
): Promise<void> {
  const prefix = "COOKIE CONSENT";
  const emoji = "🍪";
  const currentURL = page.url();

  // If already on google.com/maps/place/, no need to wait
  // This avoids waiting for delays when already redirected to Place page
  if (currentURL.includes("google.com/maps/place/")) {
    logUtils.success(
      prefix,
      emoji,
      "Already on Place page, cookie consent already handled",
    );
    return;
  }

  logUtils.log(prefix, emoji, "Waiting for cookie consent form to disappear");
  const cookieSelectors = [
    'form[action="https://consent.google.com/save"] input[type="submit"]',
    'form[action*="consent.google.com"] input[type="submit"]',
    'form[action*="consent.google.com"] button[type="submit"]',
    'button[data-value="REJECT_ALL"]',
  ];

  // Wait for any of the cookie consent forms to disappear
  // Also check if we've been redirected to Place page
  try {
    await page.waitForFunction(
      (selectors) => {
        // Check if redirected to Place page
        if (window.location.href.includes("google.com/maps/place/")) {
          return true; // Already on Place page, consent is handled
        }
        // Check if all cookie consent forms have disappeared
        return selectors.every(
          (selector: string) => document.querySelector(selector) === null,
        );
      },
      { timeout: 3000 },
      cookieSelectors,
    );
    logUtils.success(prefix, emoji, "Cookie consent form disappeared");
  } catch {
    // Check if we're now on Place page (redirect happened)
    const finalURL = page.url();
    if (finalURL.includes("google.com/maps/place/")) {
      logUtils.success(
        prefix,
        emoji,
        "Redirected to Place page, cookie consent handled",
      );
      return;
    }
    logUtils.warn(
      prefix,
      emoji,
      "Cookie consent form didn't disappear (continuing anyway)",
    );
    // If selectors don't disappear, continue anyway
    // They might have been removed from DOM or already gone
  }
}
