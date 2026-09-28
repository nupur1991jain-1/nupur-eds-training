/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html (selector: .carousel.cmp-carousel--hero)
 * Structure (carousel convention, 2 columns):
 *   one row per slide -> [image | title, description, CTA].
 * Slides 2+ can be lazily loaded (AEM Core image v3), so the image URL is resolved from
 * img[src] -> img[data-src] -> img[srcset] -> .cmp-image[data-cmp-src] -> <noscript> fallback.
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
  const cmp = container.querySelector('[data-cmp-src]') || (container.matches && container.matches('[data-cmp-src]') ? container : null);

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
  if (!src) return img || null;

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
  // Iterate the slide panels (block-level divs, not interactive elements).
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) slides = Array.from(element.querySelectorAll('[role="tabpanel"], .cmp-teaser'));

  const cells = [];
  const seen = new Set();

  slides.forEach((slide) => {
    // Own teaser content/image only (first match inside this slide).
    const content = slide.querySelector('.cmp-teaser__content');
    const imageWrap = slide.querySelector('.cmp-teaser__image, .cmp-image');
    if (!content && !imageWrap) return;
    if (content && seen.has(content)) return;
    if (content) seen.add(content);

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

    if (!image && !textCell.length) return;
    cells.push([image || '', textCell.length ? textCell : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
