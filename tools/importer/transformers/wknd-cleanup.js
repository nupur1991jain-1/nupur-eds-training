/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * All selectors verified in captured DOM of https://wknd.site/us/en.html (home,
 * migration-work/archive/home/cleaned.html) and
 * https://wknd.site/us/en/adventures/climbing-new-zealand.html (adventures).
 * Note: no generic hidden-element removal - inactive tab panels and carousel slides are content.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Adobe ID syncing iframe: <iframe id="destination_publishing_iframe_wkndsite_0" class="aamIframeLoaded">
    // Mobile nav toggle + drawer: <div id="toggleNav">, <div id="mobileNav" class="cmp-navigation--mobile">
    WebImporter.DOMUtils.remove(element, [
      'iframe.aamIframeLoaded',
      '#toggleNav',
      '#mobileNav',
    ]);

    // --- Adventures template (verified in cleaned.html of /us/en/adventures/climbing-new-zealand.html) ---
    // Hidden content-fragment title repeated inside the trip-facts list and each tab panel:
    // <article class="cmp-contentfragment ..."><h3 class="cmp-contentfragment__title">Climbing New Zealand</h3>
    // Removed before parsing so table-trip-facts / tabs-adventure parsers never pick it up.
    // Only the h3 is removed - tab panels (.cmp-tabs__tabpanel) and carousel slides
    // (.cmp-carousel__item) are real content even when inactive/hidden, and are NOT touched.
    WebImporter.DOMUtils.remove(element, [
      'article.cmp-contentfragment > h3.cmp-contentfragment__title',
    ]);

    // Social share widgets (Facebook/Pinterest): <div class="sharing"><div class="fb-share-button"><a href="https://www.pinterest.com/pin/create/button/">
    // The preceding "Share this Adventure" .title heading is default content and is kept.
    WebImporter.DOMUtils.remove(element, ['div.sharing']);

    // Carousel UI controls (prev/next buttons, indicators) - removed before parsing so
    // carousel parsers only see slides. Also re-run in afterTransform as a safety net.
    WebImporter.DOMUtils.remove(element, [
      '.cmp-carousel__actions',
      '.cmp-carousel__indicators',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome (handled separately by nav/footer migration):
    // <header class="experiencefragment cmp-experiencefragment--header"> (sign-in, language nav, logo, nav, search)
    // <footer class="experiencefragment cmp-experiencefragment--footer">
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      '.sign-in-buttons',
      '.languagenavigation',
      '.search.cmp-search--header',
      '.navigation.cmp-navigation--header',
      '#toggleNav',
      '#mobileNav',
    ]);

    // Carousel UI controls (non-authorable): <div class="cmp-carousel__actions">, <ol class="cmp-carousel__indicators">
    WebImporter.DOMUtils.remove(element, [
      '.cmp-carousel__actions',
      '.cmp-carousel__indicators',
    ]);

    // Decorative separators: <div class="separator ..."><div class="cmp-separator"><hr class="cmp-separator__horizontal-rule">
    // Removed only in afterTransform (section selectors reference .separator during beforeTransform).
    // Targets the wrapper, never bare <hr>, so section-break <hr>s survive.
    WebImporter.DOMUtils.remove(element, ['div.separator']);

    // Leftover non-content elements
    WebImporter.DOMUtils.remove(element, ['iframe', 'link', 'noscript', 'meta', 'script', 'style']);

    // Tracking / data-layer attributes
    element.querySelectorAll('[data-cmp-data-layer], [data-cmp-clickable]').forEach((el) => {
      el.removeAttribute('data-cmp-data-layer');
      el.removeAttribute('data-cmp-clickable');
    });
  }
}
