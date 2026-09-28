/* global WebImporter */
/**
 * Parser for carousel-gallery. Base: carousel.
 * Source: https://wknd.site/us/en/adventures/climbing-new-zealand.html
 * Selector: .carousel.cmp-carousel--mini
 *
 * The EDS block (blocks/carousel-gallery) is image-only: every <picture> becomes a slide and
 * text is ignored. Output: one row per slide, one cell holding the slide image.
 * Iterates block-level slide wrappers (div.cmp-carousel__item, incl. non-active slides) —
 * never the prev/next <button>s or indicator <li>s.
 * Non-active slides may be lazily loaded (AEM Core image v3), so the image URL is resolved from
 * img[src] -> img[data-src] -> img[srcset] -> .cmp-image[data-cmp-src] ({.width} -> .1600)
 * -> <noscript> fallback.
 * Generated: 2026-09-28
 */

function pickFromSrcset(srcset) {
  if (!srcset) return '';
  const entries = srcset.split(',').map((s) => s.trim()).filter(Boolean);
  if (!entries.length) return '';
  // Last entry is the widest in AEM Core srcsets.
  return entries[entries.length - 1].split(/\s+/)[0];
}

function isUsableSrc(src) {
  return !!src && !src.startsWith('data:') && !/placeholder|blank\.gif/i.test(src);
}

/** Returns an <img> with a real src for the image inside `container`, or null. */
function resolveImage(container, document) {
  if (!container) return null;
  let img = container.querySelector('img');
  const cmp = (container.matches && container.matches('[data-cmp-src]'))
    ? container
    : container.querySelector('[data-cmp-src]');

  let src = '';
  if (img) {
    const candidates = [
      img.getAttribute('src'),
      img.getAttribute('data-src'),
      img.getAttribute('data-lazy-src'),
      pickFromSrcset(img.getAttribute('srcset') || img.getAttribute('data-srcset')),
    ];
    src = candidates.find(isUsableSrc) || '';
  }
  if (!src && cmp) {
    const tpl = cmp.getAttribute('data-cmp-src') || '';
    if (tpl) src = tpl.replace('{.width}', '.1600');
  }
  if (!src) {
    const noscript = container.querySelector('noscript');
    if (noscript) {
      const m = /src=["']([^"']+)["']/i.exec(noscript.textContent || noscript.innerHTML || '');
      if (m) [, src] = m;
    }
  }
  if (!src) return null;

  if (!img) {
    img = document.createElement('img');
    const alt = (cmp && (cmp.getAttribute('data-cmp-alt') || cmp.getAttribute('data-title'))) || '';
    img.setAttribute('alt', alt);
  }
  img.setAttribute('src', src);
  img.removeAttribute('srcset');
  img.removeAttribute('data-src');
  img.removeAttribute('loading');
  return img;
}

export default function parse(element, { document }) {
  // Slides: block-level panels (active and non-active).
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) slides = Array.from(element.querySelectorAll('[role="tabpanel"]'));
  // Fallback: each image component is a slide.
  if (!slides.length) slides = Array.from(element.querySelectorAll('.cmp-image'));

  const cells = [];
  const seenSrc = new Set();

  slides.forEach((slide) => {
    const imageWrap = slide.querySelector('.cmp-image') || slide;
    const img = resolveImage(imageWrap, document);
    if (!img) return;
    const src = img.getAttribute('src');
    if (seenSrc.has(src)) return;
    seenSrc.add(src);
    cells.push([img]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-gallery', cells });
  element.replaceWith(block);
}
