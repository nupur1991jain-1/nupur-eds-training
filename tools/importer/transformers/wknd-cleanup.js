/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * All selectors verified in captured DOM of https://wknd.site/us/en.html (home,
 * migration-work/archive/home/cleaned.html) and
 * https://wknd.site/us/en/adventures/climbing-new-zealand.html (adventures) and
 * https://wknd.site/us/en/magazine/arctic-surfing.html (magazine, migration-work/cleaned.html).
 * Magazine reuses the shared rules: hidden content-fragment <h3> title, div.sharing
 * (Pinterest/Facebook widget; "SHARE THIS STORY" .title is kept), header/footer (incl. both
 * WKND logo images; the hero .image before .breadcrumb is untouched), div.separator.
 * About-us template (https://wknd.site/us/en/about-us.html, migration-work/cleaned.html, and
 * https://wknd.site/us/en/magazine.html, migration-work/gap-magazine/cleaned.html) needs no extra
 * rules: sign-in buttons live in the header (already removed), there are no modals, hidden
 * duplicate titles or lock overlays, and the magazine.html div.separator (a section break) is
 * removed by the shared afterTransform rule. The members-only .cmp-teaser--secure teasers and the
 * "Sign in to un-lock..." paragraph are real content and are intentionally kept.
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

    // --- Magazine template (verified in cleaned.html of /us/en/magazine/arctic-surfing.html,
    // and in western-australia / guide-la-skateparks / san-diego-surf / ski-touring) ---
    // Author experience fragment starts with a plain decorative rule directly above the byline:
    // <div class="experiencefragment"><div class="cmp-experiencefragment cmp-experiencefragment--jacob-wester">
    //   ... <div class="separator"><div class="cmp-separator"><hr class="cmp-separator__horizontal-rule"></div></div>
    //       <div class="byline image"> ...
    // Removed before parsing so the columns-author parser never sees it. Scoped via `+ .byline`
    // (home/adventures have no byline), so section selectors on other templates are unaffected.
    WebImporter.DOMUtils.remove(element, ['.experiencefragment .separator:has(+ .byline)']);

    // Magazine article body (<main class="container"> right after the breadcrumb):
    // unwrap presentational <b>/<strong> inside headings, keeping the text. Scoped to the
    // magazine article so adventures' authored <h2><b>..</b></h2> output is unchanged.
    // Runs here (not afterTransform) because the section transformer later inserts an <hr>
    // between .breadcrumb and main.container, which breaks the `+` adjacency.
    element.querySelectorAll('.breadcrumb + main.container :is(h1, h2, h3, h4, h5, h6) :is(b, strong)')
      .forEach((b) => b.replaceWith(...b.childNodes));

    // Primary button components in default content ("All Articles", "All Trips"):
    // <div class="button cmp-button--primary"><a class="cmp-button"><span class="cmp-button__text">
    // Bold the link so EDS decorateButtons() renders it as a primary button (yellow on WKND).
    element.querySelectorAll('.button.cmp-button--primary > a.cmp-button').forEach((a) => {
      if (a.closest('strong')) return;
      const strong = element.ownerDocument.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
    });
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

    // Internal page links: EDS serves extensionless paths, so
    // /us/en/magazine.html -> /us/en/magazine (and wknd.site absolute links -> relative).
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const m = href.match(/^(?:https?:\/\/(?:www\.)?wknd\.site)?(\/[^?#]*?)\.html([?#].*)?$/);
      if (m) a.setAttribute('href', `${m[1]}${m[2] || ''}`);
    });
  }
}
