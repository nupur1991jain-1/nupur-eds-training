/**
 * Shared project utilities.
 * Keep helpers here that more than one block needs, so blocks import from
 * `/scripts/` instead of reaching into each other.
 */

import { toCamelCase } from './aem.js';

const placeholders = new Map();

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
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('failed to load placeholders', error);
        return {};
      });
    placeholders.set(prefix, loaded);
  }
  return placeholders.get(prefix);
}

export default { fetchPlaceholders };
