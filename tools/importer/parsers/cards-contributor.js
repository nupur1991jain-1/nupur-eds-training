/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-contributor. Base: cards.
 * Source: https://wknd.site/us/en/about-us.html (selector: section.cmp-experience-fragment--contributor).
 *
 * The source has ONE element per person (each contributor is its own experience-fragment
 * <section>). When invoked on the first element of a run, this parser collects it plus every
 * immediately-following element sibling that is also a contributor section (stopping at the
 * first non-contributor element), builds ONE block with one row per person, replaces the first
 * element with the block and removes the other grouped siblings. The import script skips the
 * removed elements (`if (!block.element.parentNode) return;`).
 * about-us: 4 contributors ("Our Contributors") + 3 ("WKND Guides") -> 2 blocks (4 rows, 3 rows).
 *
 * Row structure (cards convention, 2 columns):
 *   [ avatar image | name heading (h3), role paragraph, one paragraph per social link ]
 * Social links use the visible .cmp-button__text label (Facebook/Twitter/Instagram), falling back
 * to aria-label/title/icon class when the anchor only holds an icon. Each link sits in its own
 * paragraph so adjacent same-href links (e.g. "#jacob-wester" x3) are never merged by html2md.
 * Generated: 2026-09-28
 */

const ITEM_CLASS = 'cmp-experience-fragment--contributor';

function pickFromSrcset(srcset) {
  if (!srcset) return '';
  const entries = srcset.split(',').map((s) => s.trim()).filter(Boolean);
  return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : '';
}

function isUsableSrc(src) {
  return !!src && !src.startsWith('data:') && !/placeholder|blank\.gif/i.test(src);
}

function resolveImage(container, document, fallbackAlt) {
  if (!container) return null;
  let img = container.querySelector('img');
  const cmp = container.matches('[data-cmp-src]') ? container : container.querySelector('[data-cmp-src]');
  let src = '';
  if (img) {
    src = [
      img.getAttribute('src'),
      img.getAttribute('data-src'),
      pickFromSrcset(img.getAttribute('srcset') || img.getAttribute('data-srcset')),
    ].find(isUsableSrc) || '';
  }
  if (!src && cmp) src = (cmp.getAttribute('data-cmp-src') || '').replace('{.width}', '.1600');
  if (!src) {
    const ns = container.querySelector('noscript');
    const m = ns && /src=["']([^"']+)["']/i.exec(ns.textContent || ns.innerHTML || '');
    if (m && isUsableSrc(m[1])) src = m[1];
  }
  if (!src) return null;
  if (!img) img = document.createElement('img');
  const alt = img.getAttribute('alt') || (cmp && cmp.getAttribute('data-cmp-alt')) || fallbackAlt || '';
  img.setAttribute('src', src);
  img.setAttribute('alt', alt);
  img.removeAttribute('srcset');
  img.removeAttribute('data-src');
  img.removeAttribute('loading');
  return img;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function socialLabel(a) {
  const textEl = a.querySelector('.cmp-button__text');
  let label = (textEl ? textEl.textContent : a.textContent).replace(/\s+/g, ' ').trim();
  if (!label) label = (a.getAttribute('aria-label') || a.getAttribute('title') || '').trim();
  if (!label) {
    const icon = a.querySelector('[class*="cmp-button__icon--"]');
    const m = icon && /cmp-button__icon--([a-z0-9-]+)/i.exec(icon.className);
    if (m) label = capitalize(m[1]);
  }
  return label;
}

function buildRow(section, document) {
  const text = [];
  const titles = Array.from(section.querySelectorAll('.cmp-title__text, h1, h2, h3, h4, h5, h6'))
    .filter((el, i, arr) => arr.indexOf(el) === i && !arr.some((o) => o !== el && o.contains(el)));
  const nameEl = section.querySelector('h3.cmp-title__text') || titles[0];
  const nameText = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';

  const imageWrap = section.querySelector('.cmp-image') || section.querySelector('.image');
  const image = resolveImage(imageWrap, document, nameText);

  if (nameText) {
    const h = document.createElement('h3');
    h.textContent = nameText;
    text.push(h);
  }

  titles.filter((el) => el !== nameEl).forEach((el) => {
    const t = el.textContent.replace(/\s+/g, ' ').trim();
    if (!t) return;
    const p = document.createElement('p');
    p.textContent = t;
    text.push(p);
  });

  const links = Array.from(section.querySelectorAll('a.cmp-button[href], .cmp-buildingblock--btn-list a[href]'))
    .filter((a, i, arr) => arr.indexOf(a) === i);
  links.forEach((a) => {
    const label = socialLabel(a);
    if (!label) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = label;
    p.append(link);
    text.push(p);
  });

  if (!image && !text.length) return null;
  return [image || '', text.length ? text : ''];
}

export default function parse(element, { document }) {
  if (!element.parentNode) return;

  // Collect this element plus all immediately-following contributor siblings.
  const group = [element];
  let next = element.nextElementSibling;
  while (next && next.classList && next.classList.contains(ITEM_CLASS)) {
    group.push(next);
    next = next.nextElementSibling;
  }

  const cells = [];
  group.forEach((section) => {
    const row = buildRow(section, document);
    if (row) cells.push(row);
  });

  group.slice(1).forEach((el) => el.remove());

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-contributor', cells });
  element.replaceWith(block);
}
