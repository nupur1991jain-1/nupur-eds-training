/**
 * Parser for cards-upnext (listing mode). Base: cards.
 * Source: https://wknd.site/us/en/magazine/*.html, selector aside .list.cmp-list--upnext.
 * Emits a listing configuration (scripts/listing.js): the most recently published articles in
 * the same folder, excluding the current one, as many as the source shows.
 */
import { listingSource, replaceWithListing } from './listing-config.js';

export default function parse(element, { document, params }) {
  const source = listingSource(element, params.originalURL);
  if (!source) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const items = element.querySelectorAll('li.cmp-list__item, li');
  replaceWithListing(element, document, 'cards-upnext', {
    source, sort: 'recent', limit: items.length, excludeCurrent: true,
  });
}
