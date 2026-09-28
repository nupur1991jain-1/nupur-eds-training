/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article (listing mode). Base: cards.
 * Source: https://wknd.site/us/en.html ("Recent Articles", "Where do you want to go?") and
 * https://wknd.site/us/en/magazine.html ("All Articles"), selector main .image-list.list.
 * Emits a listing configuration instead of copying the cards, so the block renders live from
 * the query index (scripts/listing.js):
 *  - on the section's own landing page (e.g. /us/en/magazine lists /us/en/magazine/*):
 *    every page, sorted by title (WKND's order there)
 *  - anywhere else (home rails): the most recently published pages, as many as the source shows
 */
import { listingSource, pagePath, replaceWithListing } from './listing-config.js';

export default function parse(element, { document, params }) {
  const source = listingSource(element, params.originalURL);
  if (!source) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const items = element.querySelectorAll('.cmp-image-list__item, li');
  const isLanding = `${pagePath(params)}/` === source;
  replaceWithListing(element, document, 'cards-article', isLanding
    ? { source, sort: 'title' }
    : { source, sort: 'recent', limit: items.length });
}
