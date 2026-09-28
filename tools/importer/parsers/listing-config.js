/* eslint-disable */
/* global WebImporter */

/**
 * Shared helper for listing parsers: instead of copying the cards a source list shows,
 * emit a listing configuration so the block renders live from the query index
 * (see scripts/listing.js). New pages then appear without editing the listing page.
 *
 * Source: the parent folder shared by the list's item links (e.g. /us/en/magazine/).
 */

function toPath(href, base) {
  try {
    return new URL(href, base).pathname.replace(/\.html$/, '');
  } catch (e) {
    return '';
  }
}

/**
 * Most common parent folder of the item links in a source list.
 * @returns {string} e.g. "/us/en/magazine/" or "" when no item links exist
 */
export function listingSource(element, base) {
  const counts = new Map();
  element.querySelectorAll('a[href]').forEach((a) => {
    const path = toPath(a.getAttribute('href'), base);
    if (!path || path.split('/').length < 3) return;
    const parent = `${path.slice(0, path.lastIndexOf('/'))}/`;
    counts.set(parent, (counts.get(parent) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

/**
 * Path of the page being imported, without extension.
 */
export function pagePath(params) {
  return toPath(params.originalURL, params.originalURL);
}

/**
 * Replaces the source element with a listing block.
 * @param {Object} config { source, sort, limit, excludeCurrent }
 */
export function replaceWithListing(element, document, name, config) {
  const cells = [['Source', config.source], ['Sort', config.sort]];
  if (config.limit) cells.push(['Limit', String(config.limit)]);
  if (config.excludeCurrent) cells.push(['Exclude Current', 'true']);
  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
