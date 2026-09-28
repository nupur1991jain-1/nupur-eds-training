// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

/**
 * Trip facts: each authored row is [label] | [value]. Rendered as a definition list
 * (label above value). Tolerates rows with a single cell (treated as value-only) and rows
 * with extra cells (appended to the value). Empty rows are dropped.
 */
export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const dl = document.createElement('dl');
  dl.className = 'table-trip-facts-list';

  [...block.querySelectorAll(':scope > div')].forEach((row) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('img, picture'));
    if (!cells.length) return;

    const item = document.createElement('div');
    item.className = 'table-trip-facts-item';

    const [labelCell, ...valueCells] = cells.length > 1 ? cells : [null, ...cells];
    if (labelCell) {
      const dt = document.createElement('dt');
      dt.className = 'table-trip-facts-label';
      dt.append(...labelCell.childNodes);
      item.append(dt);
    }
    const dd = document.createElement('dd');
    dd.className = 'table-trip-facts-value';
    valueCells.forEach((c) => dd.append(...c.childNodes));
    item.append(dd);

    dl.append(item);
  });

  block.replaceChildren(dl);
}
