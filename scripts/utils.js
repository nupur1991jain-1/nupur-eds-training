/**
 * Shared project utilities.
 * Keep helpers here that more than one block needs, so blocks import from
 * `/scripts/` instead of reaching into each other.
 */

import { createOptimizedPicture, toCamelCase } from './aem.js';

const placeholders = new Map();

/**
 * createOptimizedPicture() that keeps the authored image's width/height attributes, so the
 * browser reserves the image's space before it loads and the layout doesn't shift.
 * @param {HTMLImageElement} img Authored image
 * @param {boolean} [eager] Load eagerly (above-the-fold images)
 * @param {Array} [breakpoints] Breakpoints, as for createOptimizedPicture()
 * @returns {Element} The picture element
 */
export function optimizedPicture(img, eager = false, breakpoints = undefined) {
  const picture = createOptimizedPicture(img.src, img.alt, eager, breakpoints);
  const width = img.getAttribute('width');
  const height = img.getAttribute('height');
  if (width && height) {
    const optimized = picture.querySelector('img');
    optimized.setAttribute('width', width);
    optimized.setAttribute('height', height);
  }
  return picture;
}

/**
 * Fetches the placeholders sheet for a locale and maps it to a lookup object.
 * Each fetch is cached per prefix, so repeat calls share a single request.
 * @param {string} [prefix] Locale path prefix, e.g. `/de`. Defaults to site root.
 * @returns {Promise<Object>} Placeholder lookup keyed in camelCase, empty when unavailable
 */
export async function fetchPlaceholders(prefix = '') {
  if (!placeholders.has(prefix)) {
    const loaded = fetch(`${prefix}/placeholders.json`)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => Object.fromEntries(
        (json.data || [])
          .filter((row) => row.Key)
          .map((row) => [toCamelCase(row.Key), row.Value]),
      ))
      // Network failures are already reported by the browser; fall back to no placeholders
      .catch(() => ({}));
    placeholders.set(prefix, loaded);
  }
  return placeholders.get(prefix);
}

/**
 * Re-levels headings that skip levels (e.g. an h4 byline straight after the h1) so the outline
 * screen-reader users navigate by is sequential. The replacement keeps the original's
 * attributes and content, and a `heading-hN` class that styles it like the authored level.
 * @param {Element} root Container whose headings to fix (e.g. main)
 */
export function fixHeadingOrder(root) {
  let previous = 0;
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const level = Number(heading.tagName[1]);
    if (!previous || level <= previous + 1) {
      previous = level;
      return;
    }
    previous += 1;
    const fixed = document.createElement(`h${previous}`);
    [...heading.attributes].forEach((attr) => fixed.setAttribute(attr.name, attr.value));
    fixed.classList.add(`heading-h${level}`);
    fixed.append(...heading.childNodes);
    heading.replaceWith(fixed);
  });
}

export default { fetchPlaceholders, fixHeadingOrder, optimizedPicture };
