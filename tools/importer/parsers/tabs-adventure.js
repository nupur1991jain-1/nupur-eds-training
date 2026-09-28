/* global WebImporter */
/**
 * Parser for tabs-adventure. Base: tabs.
 * Source: https://wknd.site/us/en/adventures/climbing-new-zealand.html
 * Selector: main .tabs.panelcontainer
 *
 * Source: .cmp-tabs > ol.cmp-tabs__tablist > li.cmp-tabs__tab (labels) and
 * div.cmp-tabs__tabpanel (panels, incl. non-active ones). Tab <li id="X-tab"> pairs with
 * panel <div id="X-tabpanel">; falls back to index pairing.
 * Output (2 columns): one [tab label | rich panel content] row per tab.
 * Panel content is flattened out of the AEM grid wrappers into headings, paragraphs, lists and
 * images (lazy image URLs resolved via src/data-src/srcset/data-cmp-src/noscript).
 * The hidden content-fragment title (h3.cmp-contentfragment__title) is ignored.
 * Generated: 2026-09-28
 */

const CONTENT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'PRE']);

function pickFromSrcset(srcset) {
  if (!srcset) return '';
  const entries = srcset.split(',').map((s) => s.trim()).filter(Boolean);
  if (!entries.length) return '';
  return entries[entries.length - 1].split(/\s+/)[0];
}

function isUsableSrc(src) {
  return !!src && !src.startsWith('data:') && !/placeholder|blank\.gif/i.test(src);
}

/** Returns an <img> with a real src for the image inside `container`, or null. */
function resolveImage(container, document) {
  if (!container) return null;
  let img = container.tagName === 'IMG' ? container : container.querySelector('img');
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
  if (!src && container.querySelector) {
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

function hasContent(el) {
  return !!(el.textContent || '').replace(/\u00a0/g, ' ').trim() || !!el.querySelector('img, picture');
}

/** Collects panel content nodes in document order, skipping layout wrappers. */
function collectContent(node, document, out) {
  Array.from(node.children).forEach((child) => {
    if (child.matches('h3.cmp-contentfragment__title, script, style, noscript, meta, link, button')) return;
    if (child.matches('.cmp-image, .image') || child.tagName === 'IMG' || child.tagName === 'PICTURE') {
      const img = resolveImage(child, document);
      if (img) out.push(img);
      return;
    }
    if (CONTENT_TAGS.has(child.tagName)) {
      if (!hasContent(child)) return;
      // Headings authored as <h2><b>..</b></h2>: drop the redundant bold wrapper.
      if (/^H[1-6]$/.test(child.tagName)) {
        child.querySelectorAll(':scope > b, :scope > strong').forEach((b) => b.replaceWith(...b.childNodes));
      }
      out.push(child);
      return;
    }
    collectContent(child, document, out);
  });
}

export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab, [role="tab"]'));
  let panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));
  if (!panels.length) panels = Array.from(element.querySelectorAll('[role="tabpanel"]'));

  const cells = [];
  panels.forEach((panel, idx) => {
    // Pair label by id (X-tab <-> X-tabpanel / aria-controls), else by index.
    let tab = null;
    if (panel.id) {
      const base = panel.id.replace(/panel$/, '');
      tab = tabs.find((t) => t.id === base || t.getAttribute('aria-controls') === panel.id) || null;
    }
    if (!tab) tab = tabs[idx] || null;
    const label = tab ? tab.textContent.replace(/\s+/g, ' ').trim() : '';

    const content = [];
    collectContent(panel, document, content);
    if (!label && !content.length) return;
    cells.push([label || `Tab ${idx + 1}`, content.length ? content : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-adventure', cells });
  element.replaceWith(block);
}
