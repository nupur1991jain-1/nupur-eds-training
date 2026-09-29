/* global WebImporter */
/**
 * Parser for cards-members. Base: cards.
 * Source: https://wknd.site/us/en/magazine.html (selector: .teaser.cmp-teaser--secure).
 *
 * The source has ONE element per members-only teaser. When invoked on the first element of a
 * run, this parser collects it plus every immediately-following element sibling that is also a
 * secure teaser (stopping at the first non-matching element), builds ONE block with one row per
 * teaser, replaces the first element with the block and removes the other grouped siblings.
 * The import script skips the removed elements (`if (!block.element.parentNode) return;`).
 * magazine: 2 secure teasers -> 1 block, 2 rows.
 *
 * Row structure (cards convention, 2 columns):
 *   [ image | title (h2), description paragraph(s), "Read More" label as plain paragraph ]
 * The gated "Read More" is not a link on the source (action-container text only) and the block
 * renders it as a disabled label; the lock icon is decorative (CSS) and is not content.
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
    if (m && isUsableSrc(m[1])) [, src] = m;
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

function isSecureTeaser(el) {
  return !!(el && el.classList && el.classList.contains('teaser') && el.classList.contains('cmp-teaser--secure'));
}

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function buildRow(teaser, document) {
  const content = teaser.querySelector('.cmp-teaser__content') || teaser;
  const text = [];

  const pretitle = content.querySelector('.cmp-teaser__pretitle');
  if (pretitle && clean(pretitle.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(pretitle.textContent);
    text.push(p);
  }

  const titleEl = content.querySelector('.cmp-teaser__title') || content.querySelector('h1, h2, h3, h4');
  const titleText = titleEl ? clean(titleEl.textContent) : '';
  if (titleText) {
    const h = document.createElement('h2');
    h.textContent = titleText;
    text.push(h);
  }

  const desc = content.querySelector('.cmp-teaser__description');
  if (desc && clean(desc.textContent)) {
    const paras = Array.from(desc.querySelectorAll('p')).filter((p) => clean(p.textContent));
    if (paras.length) {
      paras.forEach((p) => {
        const np = document.createElement('p');
        np.textContent = clean(p.textContent);
        text.push(np);
      });
    } else {
      const p = document.createElement('p');
      p.textContent = clean(desc.textContent);
      text.push(p);
    }
  }

  // "Read More": plain text in the action container on gated teasers; if a link is present
  // (non-gated variation), keep only its label — the block renders it as a disabled label.
  const action = content.querySelector('.cmp-teaser__action-container');
  if (action) {
    const links = Array.from(action.querySelectorAll('a, .cmp-teaser__action-link'));
    const labels = links.length
      ? links.map((a) => clean(a.textContent))
      : [clean(action.textContent)];
    labels.filter(Boolean).forEach((label) => {
      const p = document.createElement('p');
      p.textContent = label;
      text.push(p);
    });
  }

  const imageWrap = teaser.querySelector('.cmp-teaser__image') || teaser.querySelector('.cmp-image');
  const image = resolveImage(imageWrap, document, titleText);

  if (!image && !text.length) return null;
  return [image || '', text.length ? text : ''];
}

export default function parse(element, { document }) {
  if (!element.parentNode) return;

  // Collect this element plus all immediately-following secure-teaser siblings.
  const group = [element];
  let next = element.nextElementSibling;
  while (isSecureTeaser(next)) {
    group.push(next);
    next = next.nextElementSibling;
  }

  const cells = [];
  group.forEach((teaser) => {
    const row = buildRow(teaser, document);
    if (row) cells.push(row);
  });

  group.slice(1).forEach((el) => el.remove());

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (Members)', cells });
  element.replaceWith(block);
}
