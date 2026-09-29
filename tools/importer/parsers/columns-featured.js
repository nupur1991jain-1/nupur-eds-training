/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/us/en.html (selector: .teaser.cmp-teaser--featured)
 * Structure (columns convention): one row, 2 columns -> [eyebrow, title, description, CTA | image].
 * Matches the visual layout: text on the left, image on the right.
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

function resolveImage(container, document) {
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
    img.setAttribute('alt', (cmp && cmp.getAttribute('data-cmp-alt')) || '');
  }
  img.setAttribute('src', src);
  img.removeAttribute('srcset');
  img.removeAttribute('loading');
  return img;
}

export default function parse(element, { document }) {
  const content = element.querySelector('.cmp-teaser__content');
  const imageWrap = element.querySelector('.cmp-teaser__image') || element.querySelector('.cmp-image');

  const textCell = [];
  const pretitle = content && content.querySelector('.cmp-teaser__pretitle');
  if (pretitle && pretitle.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = pretitle.textContent.trim();
    textCell.push(p);
  }
  const title = content && content.querySelector('.cmp-teaser__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    const h = document.createElement('h2');
    h.textContent = title.textContent.trim();
    textCell.push(h);
  }
  const desc = content && content.querySelector('.cmp-teaser__description');
  if (desc && desc.textContent.trim()) {
    const paras = desc.querySelectorAll('p');
    if (paras.length) {
      paras.forEach((p) => textCell.push(p));
    } else {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      textCell.push(p);
    }
  }
  const ctas = content ? Array.from(content.querySelectorAll('.cmp-teaser__action-link')) : [];
  ctas.forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    textCell.push(p);
  });

  const image = resolveImage(imageWrap, document);

  if (!textCell.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', image || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (Featured)', cells });
  element.replaceWith(block);
}
