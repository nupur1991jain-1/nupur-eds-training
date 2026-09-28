/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://wknd.site/us/en/faqs.html (selector: main .accordion).
 *
 * Source DOM (AEM Core Accordion,
 * verified in migration-work/block-context/accordion-faq/source.html):
 *   div.accordion > div.cmp-accordion > div.cmp-accordion__item (x7)
 *     h3.cmp-accordion__header > button.cmp-accordion__button
 *       > span.cmp-accordion__title (question)
 *     div.cmp-accordion__panel[.cmp-accordion__panel--hidden] > ...
 *       > div.cmp-text > p/h3/b/a (answer)
 * Collapsed panels are hidden via CSS class but present in the DOM - they are always included.
 *
 * Iteration is keyed on the block-level div.cmp-accordion__item wrappers (structure.json:
 * 7 items, iterationSafe: true) - never on the <button>s.
 *
 * Row structure (accordion convention, 2 columns):
 *   [ question text | rich answer (paragraphs, bold, links kept) ]
 * Empty headings/paragraphs (e.g. <h3>&nbsp;</h3>) are dropped; &nbsp; runs are normalized and
 * leading/trailing whitespace is moved out of inline formatting so bold markdown stays valid.
 * Generated: 2026-09-28
 */

const INLINE_FORMAT = 'b, strong, em, i, u';

function normalizeWhitespace(root) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => {
    t.textContent = t.textContent.replace(/\u00a0/g, ' ').replace(/[ \t]{2,}/g, ' ');
  });

  // Move leading/trailing spaces out of <b>/<strong>/... so "**Name **and" can't happen.
  root.querySelectorAll(INLINE_FORMAT).forEach((el) => {
    const text = el.textContent;
    if (!text.trim()) {
      if (!el.querySelector('img, picture, a')) el.replaceWith(doc.createTextNode(text ? ' ' : ''));
      return;
    }
    const first = el.firstChild;
    if (first && first.nodeType === 3 && /^\s/.test(first.textContent)) {
      first.textContent = first.textContent.replace(/^\s+/, '');
      el.before(doc.createTextNode(' '));
    }
    const last = el.lastChild;
    if (last && last.nodeType === 3 && /\s$/.test(last.textContent)) {
      last.textContent = last.textContent.replace(/\s+$/, '');
      el.after(doc.createTextNode(' '));
    }
  });

  // Trim paragraph/heading edges.
  root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach((el) => {
    const first = el.firstChild;
    if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
    const last = el.lastChild;
    if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  });
}

function removeEmpty(root) {
  root.querySelectorAll('h1, h2, h3, h4, h5, h6, p').forEach((el) => {
    if (!el.textContent.replace(/\u00a0/g, ' ').trim() && !el.querySelector('img, picture, video, iframe, a[href]')) {
      el.remove();
    }
  });
}

function getQuestion(item, document) {
  const titleEl = item.querySelector('.cmp-accordion__title')
    || item.querySelector('.cmp-accordion__button')
    || item.querySelector('.cmp-accordion__header')
    || item.querySelector('button, h2, h3, h4');
  const text = titleEl ? titleEl.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '';
  if (!text) return null;
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function getAnswer(item, document) {
  const panel = item.querySelector('.cmp-accordion__panel')
    || item.querySelector('[role="region"]');
  if (!panel) return null;

  // Prefer the rich-text components inside the panel; fall back to the whole panel.
  const sources = [...panel.querySelectorAll('.cmp-text')];
  const container = document.createElement('div');
  if (sources.length) {
    sources.forEach((src) => container.append(...src.childNodes));
  } else {
    container.append(...panel.childNodes);
  }

  normalizeWhitespace(container);
  removeEmpty(container);

  const nodes = [...container.childNodes].filter(
    (n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()),
  );
  return nodes.length ? nodes : null;
}

export default function parse(element, { document }) {
  // Iterate block-level item wrappers; fallback to accordion headers' parents.
  let items = [...element.querySelectorAll('.cmp-accordion__item')];
  if (!items.length) {
    items = [...element.querySelectorAll('.cmp-accordion__header')]
      .map((h) => h.parentElement)
      .filter(Boolean);
  }

  const cells = [];
  items.forEach((item) => {
    const question = getQuestion(item, document);
    if (!question) return;
    const answer = getAnswer(item, document);
    cells.push([question, answer || '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
