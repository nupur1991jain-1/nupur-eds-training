/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-trip-facts. Base: table.
 * Source: https://wknd.site/us/en/adventures/climbing-new-zealand.html
 * Selector: main .aem-GridColumn--default--3 .contentfragment.cmp-contentfragment--elements
 *
 * Source: <dl class="cmp-contentfragment__elements"> with one
 * <div class="cmp-contentfragment__element"><dt>label</dt><dd>value</dd></div> per fact
 * (Activity, Adventure Type, Trip Length, Group Size, Difficulty, Price).
 * Output (2 columns): one [label | value] row per fact.
 * The hidden content-fragment title (h3.cmp-contentfragment__title) is ignored.
 * Generated: 2026-09-28
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  // Primary: element wrappers pairing dt/dd.
  let pairs = Array.from(element.querySelectorAll('.cmp-contentfragment__element')).map((el) => ({
    label: el.querySelector('dt, .cmp-contentfragment__element-title'),
    value: el.querySelector('dd, .cmp-contentfragment__element-value'),
  }));

  // Fallback: bare dt elements paired with their following dd.
  if (!pairs.length) {
    pairs = Array.from(element.querySelectorAll('dt')).map((dt) => {
      let dd = dt.nextElementSibling;
      while (dd && dd.tagName !== 'DD') dd = dd.nextElementSibling;
      return { label: dt, value: dd };
    });
  }

  const cells = [];
  pairs.forEach(({ label, value }) => {
    const labelText = clean(label && label.textContent);
    if (!labelText) return;
    let valueCell = '';
    if (value) {
      // Keep rich content (links, images) when present; otherwise plain text.
      if (value.querySelector('a, img, picture, p, ul, ol')) {
        valueCell = Array.from(value.childNodes);
      } else {
        valueCell = clean(value.textContent);
      }
    }
    cells.push([labelText, valueCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-trip-facts', cells });
  element.replaceWith(block);
}
