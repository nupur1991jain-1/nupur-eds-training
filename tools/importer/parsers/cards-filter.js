/**
 * Parser for cards-filter (listing mode). Base: cards.
 * Source: https://wknd.site/us/en/adventures.html, selector main .tabs.panelcontainer
 * (category tabs over image lists). Emits a listing configuration (scripts/listing.js): every
 * page in the folder, sorted by title (WKND's "All" tab order). Filter categories come from each
 * adventure page's "Categories" metadata, set by the adventures import.
 */
import { listingSource, replaceWithListing } from './listing-config.js';

export default function parse(element, { document, params }) {
  const source = listingSource(element, params.originalURL);
  if (!source) {
    element.replaceWith(...element.childNodes);
    return;
  }
  replaceWithListing(element, document, 'Cards (Filter)', { source, sort: 'title' });
}
