/* eslint-disable */
/* global WebImporter */
/**
 * Parser for breadcrumb. Base: breadcrumb (custom, no library convention).
 * Source: https://wknd.site/us/en/adventures/climbing-new-zealand.html
 * Selector: .breadcrumb.cmp-breadcrumb--fixed
 *
 * The EDS breadcrumb block (blocks/breadcrumb/breadcrumb.js) builds its own trail
 * ("Adventures" > og:title) from page metadata and APPENDS it to the block, so any authored
 * trail content would be rendered twice. The parser therefore intentionally emits a minimal
 * block table: the block-name header plus one empty row. The source trail
 * (nav.cmp-breadcrumb > ol.cmp-breadcrumb__list > li) is intentionally not copied.
 * Generated: 2026-09-28
 */
export default function parse(element, { document }) {
  // Only emit the block when this really is a breadcrumb trail (guard against stray matches).
  const trail = element.querySelector('.cmp-breadcrumb__list, nav.cmp-breadcrumb, ol, ul');
  if (!trail) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [['']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'breadcrumb', cells });
  element.replaceWith(block);
}
