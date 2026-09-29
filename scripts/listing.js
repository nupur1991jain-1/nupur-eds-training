/*
 * Dynamic listings from the site query index.
 *
 * A listing block is authored as key/value rows instead of items:
 *   | Source          | /us/en/magazine/ |   pages under this path (required)
 *   | Sort            | title            |   title | title desc | recent (default: recent)
 *   | Limit           | 4                |   optional maximum
 *   | Exclude Current | true             |   optional, leave the current page out
 * The block's own decorate() then renders the generated rows exactly like authored ones,
 * so newly published pages appear without code or listing-page edits.
 * "recent" orders by each page's Publication Date metadata (newest first), falling back to
 * the page's last modification when it has none.
 */

import { toClassName } from './aem.js';

const CONFIG_KEYS = ['source', 'sort', 'limit', 'exclude current'];

let indexPromise;

/**
 * Local preview serves pages under /content; published sites serve them at the root.
 * @returns {string} prefix to prepend to site paths when fetching pages
 */
function contentPrefix() {
  return window.location.pathname.startsWith('/content/') ? '/content' : '';
}

/**
 * Current page path, independent of the local /content prefix and .html extension
 * @returns {string}
 */
function currentPath() {
  return window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
}

/**
 * Reads listing configuration from a block authored as key/value rows.
 * @param {Element} block
 * @returns {Object|null} config, or null when the block holds authored items
 */
export function readListingConfig(block) {
  const rows = [...block.children];
  if (!rows.length) return null;
  const config = {};
  const isConfig = rows.every((row) => {
    const cells = [...row.children];
    if (cells.length !== 2 || row.querySelector('picture, img')) return false;
    const key = cells[0].textContent.trim().toLowerCase();
    if (!CONFIG_KEYS.includes(key)) return false;
    config[key] = cells[1].textContent.trim();
    return true;
  });
  if (!isConfig || !config.source) return null;
  return {
    source: config.source.endsWith('/') ? config.source : `${config.source}/`,
    sort: (config.sort || 'recent').toLowerCase(),
    limit: parseInt(config.limit, 10) || 0,
    excludeCurrent: /^(true|yes|1)$/i.test(config['exclude current'] || ''),
  };
}

/**
 * Loads one page of the query index, then the following pages until `total` is reached.
 * @param {number} offset first row to load
 * @returns {Promise<Object[]>}
 */
async function loadIndexFrom(offset) {
  const resp = await fetch(`/query-index.json?limit=500&offset=${offset}`);
  if (!resp.ok) return [];
  const json = await resp.json();
  const data = json.data || [];
  const next = offset + data.length;
  if (!data.length || next >= (json.total || next)) return data;
  return [...data, ...await loadIndexFrom(next)];
}

/**
 * Loads every row of the site query index (follows pagination).
 * @returns {Promise<Object[]>}
 */
export function loadIndex() {
  if (!indexPromise) indexPromise = loadIndexFrom(0).catch(() => []);
  return indexPromise;
}

const metaCache = new Map();

/**
 * Reads meta tags of a page (used for fields the index does not carry).
 * @param {string} path site path, e.g. /us/en/adventures/tahoe-skiing
 * @returns {Promise<Object>} meta name → content
 */
export function fetchPageMeta(path) {
  if (!metaCache.has(path)) {
    metaCache.set(path, fetch(`${contentPrefix()}${path}`)
      .then((resp) => (resp.ok ? resp.text() : ''))
      .then((html) => {
        // meta tags live in <head>: parsing only that keeps a many-card listing off the main thread
        const end = html.indexOf('</head>');
        const doc = new DOMParser().parseFromString(end > -1 ? html.slice(0, end + 7) : html, 'text/html');
        return Object.fromEntries([...doc.head.querySelectorAll('meta[name]')]
          // published pages use "publication-date"; local preview keeps "Publication Date"
          .map((m) => [toClassName(m.getAttribute('name')), m.getAttribute('content') || '']));
      })
      .catch(() => ({})));
  }
  return metaCache.get(path);
}

/**
 * A page's Publication Date metadata (the index does not carry it, so it is read from the page).
 * @param {Object} row index row
 * @returns {Promise<string>} e.g. "2020-09-30", or '' when the page has none
 */
export async function publicationDate(row) {
  if (row.publicationDate !== undefined) return row.publicationDate || '';
  return (await fetchPageMeta(row.path))['publication-date'] || '';
}

/**
 * Sort key for "recent": publication date, else the index's last modification (ms).
 * @param {Object} row index row
 * @returns {Promise<number>}
 */
async function recencyTime(row) {
  const published = await publicationDate(row);
  const time = published ? Date.parse(`${String(published).slice(0, 10)}T00:00:00Z`) : NaN;
  return Number.isNaN(time) ? (Number(row.lastModified) || 0) * 1000 : time;
}

/**
 * Pages for a listing, filtered and sorted per its configuration.
 * @param {Object} config from readListingConfig()
 * @returns {Promise<Object[]>} index rows
 */
export async function queryListing(config) {
  const here = currentPath();
  const rows = (await loadIndex()).filter((row) => row.path
    && row.path.startsWith(config.source)
    && row.path.length > config.source.length
    && !(config.excludeCurrent && row.path === here));
  const byTitle = (a, b) => (a.title || '').localeCompare(b.title || '');
  if (config.sort === 'title') rows.sort(byTitle);
  else if (config.sort === 'title desc') rows.sort((a, b) => byTitle(b, a));
  else {
    // recent: newest Publication Date first (pages without one use their last modification);
    // same-day pages by title Z-A, which is how WKND orders them
    const times = new Map(await Promise.all(
      rows.map(async (row) => [row, await recencyTime(row)]),
    ));
    rows.sort((a, b) => times.get(b) - times.get(a) || byTitle(b, a));
  }
  return config.limit ? rows.slice(0, config.limit) : rows;
}

/**
 * Picture element for an index image (path-only, so it works on every host).
 * @param {Object} row index row
 * @returns {HTMLPictureElement|null}
 */
export function indexPicture(row) {
  if (!row.image || row.image.includes('default-meta-image')) return null;
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  const url = new URL(row.image, window.location.href);
  // lazy before src: this placeholder is swapped for an optimized picture by the block, and a
  // lazy image that never enters the document is never fetched (no full-size original download)
  img.loading = 'lazy';
  img.src = url.pathname;
  img.alt = row.title || '';
  picture.append(img);
  return picture;
}

/**
 * Formats a date the way WKND does: "Wednesday, 30 Sep 2020".
 * @param {string|number} value ISO date string or index lastModified (seconds)
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '';
  const date = /^\d+$/.test(String(value))
    ? new Date(Number(value) * 1000)
    : new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '';
  const opts = { timeZone: 'UTC' };
  const weekday = date.toLocaleDateString('en-US', { ...opts, weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { ...opts, month: 'short' });
  return `${weekday}, ${date.getUTCDate()} ${month} ${date.getUTCFullYear()}`;
}

/**
 * Replaces a configured listing block's rows with generated item rows.
 * @param {Element} block
 * @param {Function} buildRow async (row) => Element[] cells for one item
 * @returns {Promise<boolean>} true when the block was a dynamic listing
 */
export async function expandListing(block, buildRow) {
  const config = readListingConfig(block);
  if (!config) return false;
  const rows = await queryListing(config);
  const items = await Promise.all(rows.map(async (row) => {
    const tr = document.createElement('div');
    (await buildRow(row)).forEach((c) => tr.append(c));
    return tr;
  }));
  block.replaceChildren(...items);
  return true;
}

/**
 * Convenience: a cell <div> holding the given nodes.
 */
export function listingCell(...nodes) {
  const div = document.createElement('div');
  nodes.filter(Boolean).forEach((n) => div.append(n));
  return div;
}

/**
 * Convenience: a link to an index row.
 */
export function rowLink(row, text = row.title) {
  const a = document.createElement('a');
  a.href = row.path;
  a.textContent = text;
  return a;
}
