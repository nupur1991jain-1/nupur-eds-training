/* global WebImporter */
/**
 * Parser for columns-author. Base: columns.
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html
 *   (selector: .breadcrumb + main.container .experiencefragment — author bio XF).
 * Structure (1 row, 2 cells):
 *   [avatar image + author name heading + job title paragraph | social links with text labels]
 * The author varies per article (Jacob Wester, Stacey Roswells, Justin Barr, Sofia Sjoberg);
 * everything is read from the byline, nothing is hardcoded.
 * Social links are iterated on their block-level .button wrappers (not the anchors), and each
 * link is emitted in its own <p> so adjacent same-href ("#") anchors cannot be merged.
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
  const m = (ns.textContent || ns.innerHTML || '').match(/src=["']([^"']+)["']/i);
  return m ? m[1] : '';
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
  if (!src) src = srcFromNoscript(container);
  if (!src) return null;
  if (!img) {
    img = document.createElement('img');
    img.setAttribute('alt', (cmp && cmp.getAttribute('data-cmp-alt')) || fallbackAlt || '');
  }
  img.setAttribute('src', src);
  img.removeAttribute('srcset');
  img.removeAttribute('data-src');
  img.removeAttribute('loading');
  return img;
}

export default function parse(element, { document }) {
  const byline = element.querySelector('.cmp-byline') || element.querySelector('.byline') || element;

  // Author name + job title
  const nameEl = byline.querySelector('.cmp-byline__name')
    || byline.querySelector('h1, h2, h3, h4, h5, h6');
  const nameText = nameEl ? nameEl.textContent.trim() : '';
  const roleEl = byline.querySelector('.cmp-byline__occupations')
    || (nameEl && nameEl.nextElementSibling && nameEl.nextElementSibling.tagName === 'P' ? nameEl.nextElementSibling : null);
  const roleText = roleEl ? roleEl.textContent.trim() : '';

  // Avatar (lazy-load aware)
  const imageWrap = byline.querySelector('.cmp-byline__image') || byline.querySelector('.cmp-image') || byline;
  const avatar = resolveImage(imageWrap, document, nameText);
  if (avatar && !avatar.getAttribute('alt') && nameText) avatar.setAttribute('alt', nameText);

  const profile = [];
  if (avatar) profile.push(avatar);
  if (nameText) {
    const h = document.createElement('h2');
    h.textContent = nameText;
    profile.push(h);
  }
  if (roleText) {
    const p = document.createElement('p');
    p.textContent = roleText;
    profile.push(p);
  }

  // Social links: iterate the block-level .button wrappers, fall back to anchors.
  let socialAnchors = Array.from(element.querySelectorAll('.cmp-buildingblock--btn-list .button'))
    .map((wrap) => wrap.querySelector('a[href]'))
    .filter(Boolean);
  if (!socialAnchors.length) {
    socialAnchors = Array.from(element.querySelectorAll('a.cmp-button[href], .cmp-buildingblock--btn-list a[href]'));
  }
  const social = [];
  socialAnchors.forEach((a) => {
    const labelEl = a.querySelector('.cmp-button__text');
    let label = (labelEl ? labelEl.textContent : a.textContent).trim();
    if (!label) {
      const icon = a.querySelector('[class*="cmp-button__icon--"]');
      const m = icon && icon.className.match(/cmp-button__icon--([\w-]+)/);
      label = (m && m[1]) ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : (a.getAttribute('aria-label') || '');
    }
    if (!label) return;
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    link.textContent = label;
    p.append(link);
    social.push(p);
  });

  if (!profile.length && !social.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[profile.length ? profile : '', social.length ? social : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-author', cells });
  element.replaceWith(block);
}
