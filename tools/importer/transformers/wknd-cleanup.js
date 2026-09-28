/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html (https://wknd.site/us/en.html).
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
