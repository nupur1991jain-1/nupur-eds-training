/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks and Section Metadata.
 * Uses payload.template.sections from tools/importer/page-templates.json
 * (selectors verified in migration-work/cleaned.html).
 *
 * beforeTransform: insert <hr> before each non-first section while section elements
 *   still exist (parsers replace block elements between hooks).
 * afterTransform: insert Section Metadata for styled sections, anchored to marker <hr>.
 *
 * Template-agnostic - shared by home, adventures and magazine. Magazine (3 sections):
 * hero .image (no break, no metadata), <hr> before .breadcrumb, <hr> + Section Metadata
 * (style: article-sidebar) before the article main.container; the sibling <aside> sidebar
 * follows main.container, so it stays in the same section.
 *
 * Union templates (e.g. about-us = about-us.html sections 1-2 + magazine.html sections 3-6):
 * sections absent from a page are skipped, and no <hr> is inserted before the first section
 * that IS present, so about-us.html gets 1 break and magazine.html gets 3 with no empty
 * leading section.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';

// section.selector is an array of candidate selectors - first match wins.
function querySection(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  // a single section only needs work when it carries a style (Section Metadata)
  if (sections.length < 2 && !sections.some((s) => s.style)) return;
  const doc = element.ownerDocument || document;

  if (hookName === 'beforeTransform') {
    // Resolve every section before inserting breaks, so an inserted <hr> can't
    // break adjacency selectors. Templates can union several pages, so the
    // first section present on this page may not be sections[0].
    const sectionEls = sections.map((section) => querySection(element, section.selector));
    const firstIdx = sectionEls.findIndex(Boolean);
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === firstIdx && !section.style) continue;
      const sectionEl = sectionEls[i];
      if (!sectionEl) continue;

      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
