/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-teaser. Base: hero.
 * Source: https://wknd.site/us/en.html (selector: .teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Structure (hero convention, 1 column): row 1 -> [image], row 2 -> [title, description, CTA].
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
  const image = resolveImage(imageWrap, document);

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

  if (!image && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (image) cells.push([image]);
  cells.push([textCell.length ? textCell : '']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-teaser', cells });
  element.replaceWith(block);
}
