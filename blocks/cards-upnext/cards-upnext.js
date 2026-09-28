import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  expandListing, fetchPageMeta, formatDate, listingCell, rowLink,
} from '../../scripts/listing.js';

/**
 * Item row for a dynamic listing, in the same shape as an authored item.
 * The date is the page's publication-date metadata, falling back to its last modification.
 * @param {Object} row query index row
 */
async function listingRow(row) {
  const title = document.createElement('p');
  title.append(rowLink(row));
  const published = row.publicationDate !== undefined
    ? row.publicationDate
    : (await fetchPageMeta(row.path))['publication-date'];
  const date = document.createElement('p');
  date.textContent = formatDate(published || row.lastModified);
  return [listingCell(title, date.textContent ? date : null)];
}

// scripts.js decorateButtons() runs before block decoration and turns <p><strong|em><a> into
// buttons. Up-next titles are list links, not CTAs, so undo that.
function unbuttonize(el) {
  el.querySelectorAll('.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));
  el.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    if (!a.classList.length) a.removeAttribute('class');
  });
}

export default async function decorate(block) {
  // Listing mode: rows come from the query index (see scripts/listing.js)
  await expandListing(block, listingRow);

  unbuttonize(block);

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    const li = document.createElement('li');
    li.className = 'cards-upnext-item';

    const image = document.createElement('div');
    image.className = 'cards-upnext-image';
    const body = document.createElement('div');
    body.className = 'cards-upnext-body';

    // Authors may use one cell (title + date) or split them over several cells; flatten.
    [...row.children].forEach((cell) => {
      const children = cell.children.length ? [...cell.children] : [cell];
      children.forEach((el) => {
        const pic = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
        if (pic && !el.textContent.trim()) {
          if (!image.children.length) image.append(pic);
          return;
        }
        if (!el.textContent.trim()) return;
        if (el === cell) {
          // Bare text cell: wrap it so it can be classed.
          const p = document.createElement('p');
          p.append(...cell.childNodes);
          body.append(p);
        } else {
          body.append(el);
        }
      });
    });

    const title = body.querySelector('h1, h2, h3, h4, h5, h6')
      || [...body.children].find((el) => el.querySelector('a[href]'))
      || body.firstElementChild;
    if (title) title.classList.add('cards-upnext-title');
    [...body.children].filter((el) => el !== title)
      .forEach((el) => el.classList.add('cards-upnext-date'));

    if (image.children.length) li.append(image);
    if (body.children.length) li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });
  block.replaceChildren(ul);
}
