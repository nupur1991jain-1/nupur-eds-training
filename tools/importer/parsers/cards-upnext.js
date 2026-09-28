/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-upnext. Base: cards (no images).
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html
 *   (selector: aside .list.cmp-list--upnext — "Up Next" related articles).
 * Structure (1 column): one row per article -> [linked title paragraph + date paragraph].
 * Iteration is keyed on the block-level li.cmp-list__item wrappers, not on the anchors.
 * Generated: 2026-09-28
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('li.cmp-list__item'));
  if (!items.length) items = Array.from(element.querySelectorAll('li'));

  const cells = [];
  items.forEach((item) => {
    const link = item.querySelector('a.cmp-list__item-link') || item.querySelector('a[href]');
    const titleEl = item.querySelector('.cmp-list__item-title');
    const dateEl = item.querySelector('.cmp-list__item-date');
    const titleText = (titleEl ? titleEl.textContent : (link ? link.textContent : '')).trim();
    const dateText = dateEl ? dateEl.textContent.trim() : '';
    if (!titleText && !dateText) return;

    const content = [];
    if (titleText) {
      const p = document.createElement('p');
      const href = link ? link.getAttribute('href') : '';
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = titleText;
        p.append(a);
      } else {
        p.textContent = titleText;
      }
      content.push(p);
    }
    if (dateText) {
      const p = document.createElement('p');
      p.textContent = dateText;
      content.push(p);
    }
    cells.push([content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-upnext', cells });
  element.replaceWith(block);
}
