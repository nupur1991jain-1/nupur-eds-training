import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

// The imported CTA is a plain <p><a> (no strong/em), so decorateButtons() leaves it as a text
// link. Mark a trailing link-only paragraph as the panel's CTA button.
function decorateCta(content) {
  const last = content.lastElementChild;
  if (!last || last.tagName !== 'P') return;
  const links = last.querySelectorAll('a[href]');
  if (links.length !== 1 || last.querySelector('img, picture')) return;
  const [a] = links;
  if (last.textContent.trim() !== a.textContent.trim()) return;
  last.classList.add('button-wrapper');
  if (!a.classList.contains('button')) a.classList.add('button', 'primary');
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const rows = [...block.children];
  const cols = rows[0] ? [...rows[0].children] : [];
  block.classList.add(`columns-featured-${cols.length}-cols`);

  rows.forEach((row) => {
    row.classList.add('columns-featured-row');
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const onlyImage = pic && !col.textContent.trim();
      if (onlyImage) {
        col.classList.add('columns-featured-image');
        const img = pic.querySelector('img');
        if (img) {
          pic.replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]));
        }
      } else if (col.textContent.trim() || col.children.length) {
        col.classList.add('columns-featured-content');
        // First short paragraph before the heading is the eyebrow ("Featured Article").
        const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
        const first = col.firstElementChild;
        if (heading && first && first !== heading && first.tagName === 'P' && !first.querySelector('a, picture')) {
          first.classList.add('columns-featured-eyebrow');
        }
        decorateCta(col);
      }
    });
  });
}
