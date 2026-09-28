/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-filter. Base: cards.
 * Source: https://wknd.site/us/en/adventures.html (selector: main .tabs.panelcontainer).
 * Source is an AEM Tabs component: ol.cmp-tabs__tablist > li.cmp-tabs__tab (labels) and
 * div.cmp-tabs__tabpanel (All, Climbing, Cycling, Skiing, Surfing, Travel), each holding its own
 * .image-list copy of the adventure cards. Non-active panels are hidden but present in the DOM.
 * Output (3 columns): one row per card of the "All" panel ->
 *   [image linked to adventure | <h3><a>title</a></h3> + <p>description</p> | "Cat A, Cat B" or ''].
 * Categories = labels of the non-"All" panels containing a card with the same href.
 * Iteration is keyed on article.cmp-image-list__item-content (block-level wrapper), never on the
 * sibling image/title anchors (same href, adjacent - liable to be merged by html2md preprocessing),
 * so title text is read from .cmp-image-list__item-title wherever it ends up.
 * Generated: 2026-09-28
 */

function pickFromSrcset(srcset) {
  if (!srcset) return '';
  const entries = srcset.split(',').map((s) => s.trim()).filter(Boolean);
  return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : '';
}

function isUsableSrc(src) {
  return !!src && !src.startsWith('data:') && !/placeholder|blank\.gif/i.test(src);
}

function srcFromNoscript(container) {
  const ns = container.querySelector('noscript');
  if (!ns) return '';
  const html = ns.innerHTML || ns.textContent || '';
  const m = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1].replace(/&amp;/g, '&') : '';
}

function resolveImage(container, document, fallbackAlt) {
  if (!container) return null;
  let img = container.querySelector('img');
  const cmp = container.querySelector('[data-cmp-src]');
  let src = '';
  if (img) {
    src = [
      img.getAttribute('src'),
      img.getAttribute('data-src'),
      pickFromSrcset(img.getAttribute('srcset') || img.getAttribute('data-srcset')),
    ].find(isUsableSrc) || '';
  }
  if (!src && cmp) src = (cmp.getAttribute('data-cmp-src') || '').replace('{.width}', '.1600');
  if (!src) src = srcFromNoscript(container);
  if (!src) return img || null;
  if (!img) img = document.createElement('img');
  if (!img.getAttribute('alt')) {
    img.setAttribute('alt', (cmp && cmp.getAttribute('data-cmp-alt')) || fallbackAlt || '');
  }
  img.setAttribute('src', src);
  img.removeAttribute('srcset');
  img.removeAttribute('data-src');
  img.removeAttribute('loading');
  return img;
}

function normalizeHref(href) {
  if (!href) return '';
  return href.trim().replace(/^https?:\/\/[^/]+/i, '').replace(/[?#].*$/, '');
}

function itemsIn(scope) {
  let items = Array.from(scope.querySelectorAll('.cmp-image-list__item-content'));
  if (!items.length) items = Array.from(scope.querySelectorAll('.cmp-image-list__item, li'));
  return items;
}

function itemHref(item) {
  const a = item.querySelector('a.cmp-image-list__item-title-link[href]')
    || item.querySelector('a.cmp-image-list__item-image-link[href]')
    || item.querySelector('a[href]');
  return a ? a.getAttribute('href') : '';
}

/** Returns [{ label, panel }] with tabs paired to panels by aria-controls / id / index. */
function getPanels(element) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab, [role="tab"]'))
    .filter((t, i, arr) => arr.indexOf(t) === i);
  let panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));
  if (!panels.length) panels = Array.from(element.querySelectorAll('[role="tabpanel"]'));
  const byId = new Map(panels.filter((p) => p.id).map((p) => [p.id, p]));

  const used = new Set();
  const result = [];
  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    let panel = null;
    const controls = tab.getAttribute('aria-controls');
    if (controls && byId.has(controls)) panel = byId.get(controls);
    if (!panel && tab.id && byId.has(tab.id.replace(/-tab$/, '-tabpanel'))) {
      panel = byId.get(tab.id.replace(/-tab$/, '-tabpanel'));
    }
    if (!panel && tab.id) {
      panel = panels.find((p) => p.getAttribute('aria-labelledby') === tab.id) || null;
    }
    if (!panel && panels[i] && !used.has(panels[i])) panel = panels[i];
    if (panel && !used.has(panel)) {
      used.add(panel);
      result.push({ label, panel });
    }
  });
  // Panels without a matching tab (no tablist) - keep them, unlabeled.
  panels.forEach((p) => { if (!used.has(p)) result.push({ label: '', panel: p }); });
  return result;
}

export default function parse(element, { document }) {
  const panels = getPanels(element);
  let allEntry = panels.find((p) => /^all$/i.test(p.label));
  if (!allEntry && panels.length) allEntry = panels[0];
  const allScope = allEntry ? allEntry.panel : element;

  // href -> [category labels], in tab order.
  const categoriesByHref = new Map();
  panels.forEach(({ label, panel }) => {
    if (!label || (allEntry && panel === allEntry.panel)) return;
    itemsIn(panel).forEach((item) => {
      const key = normalizeHref(itemHref(item));
      if (!key) return;
      const list = categoriesByHref.get(key) || [];
      if (!list.includes(label)) list.push(label);
      categoriesByHref.set(key, list);
    });
  });

  const cells = [];
  itemsIn(allScope).forEach((item) => {
    const titleEl = item.querySelector('.cmp-image-list__item-title');
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    const href = itemHref(item);

    const imageWrap = item.querySelector('.cmp-image-list__item-image') || item.querySelector('.cmp-image');
    const image = resolveImage(imageWrap, document, titleText);
    let imageCell = '';
    if (image) {
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.append(image);
        imageCell = a;
      } else {
        imageCell = image;
      }
    }

    const body = [];
    if (titleText) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        h3.append(a);
      } else {
        h3.textContent = titleText;
      }
      body.push(h3);
    }
    const desc = item.querySelector('.cmp-image-list__item-description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      body.push(p);
    }

    if (!imageCell && !body.length) return;
    const cats = categoriesByHref.get(normalizeHref(href)) || [];
    cells.push([imageCell, body.length ? body : '', cats.join(', ')]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-filter', cells });
  element.replaceWith(block);
}
