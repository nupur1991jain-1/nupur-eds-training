/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://wknd.site/us/en.html (selector: main .image-list.list — 2 instances:
 * "Recent Articles" and "Where do you want to go?").
 * Structure (cards convention, 2 columns): one row per card -> [image | title (linked), description].
 * Iteration is keyed on the block-level <article>/<li> wrappers, never on the sibling
 * image/title anchors (same href, adjacent — liable to be merged by html2md preprocessing).
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
  if (!src) return img || null;
  if (!img) {
    img = document.createElement('img');
    img.setAttribute('alt', (cmp && cmp.getAttribute('data-cmp-alt')) || fallbackAlt || '');
  }
  img.setAttribute('src', src);
  img.removeAttribute('srcset');
  img.removeAttribute('loading');
  return img;
}

export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.cmp-image-list__item-content'));
  if (!items.length) items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector('.cmp-image-list__item-title');
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link')
      || item.querySelector('a.cmp-image-list__item-image-link')
      || item.querySelector('a[href]');
    const href = titleLink ? titleLink.getAttribute('href') : '';

    const imageWrap = item.querySelector('.cmp-image-list__item-image') || item.querySelector('.cmp-image');
    const image = resolveImage(imageWrap, document, titleText);

    const body = [];
    if (titleText) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        strong.append(a);
      } else {
        strong.textContent = titleText;
      }
      p.append(strong);
      body.push(p);
    }
    const desc = item.querySelector('.cmp-image-list__item-description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      body.push(p);
    }

    if (!image && !body.length) return;
    cells.push([image || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
