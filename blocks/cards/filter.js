import {
  expandListing, fetchPageMeta, indexPicture, listingCell, rowLink,
} from '../../scripts/listing.js';
import { optimizedPicture } from '../../scripts/utils.js';

/**
 * Item row for a dynamic listing, in the same shape as an authored card.
 * Categories come from the index when it carries them, otherwise from the page's metadata.
 * @param {Object} row query index row
 */
async function listingRow(row) {
  const title = document.createElement('h3');
  title.append(rowLink(row));
  const description = document.createElement('p');
  description.textContent = row.description || '';
  const categories = row.categories !== undefined
    ? row.categories
    : ((await fetchPageMeta(row.path)).categories || '');
  const categoryCell = listingCell();
  categoryCell.textContent = categories;
  return [
    listingCell(indexPicture(row)),
    listingCell(title, row.description ? description : null),
    categoryCell,
  ];
}

const HEADINGS = 'h1, h2, h3, h4, h5, h6';

function parseCategories(text) {
  return text.split(',').map((c) => c.trim()).filter(Boolean);
}

function isImageCell(cell) {
  const picture = cell.querySelector('picture');
  if (!picture || cell.querySelector(HEADINGS)) return false;
  // A linked image may be authored as picture + bare link: all text lives inside anchors.
  const linkText = [...cell.querySelectorAll('a')].map((a) => a.textContent).join('').trim();
  return cell.textContent.trim() === linkText;
}

function decorateBody(cell) {
  cell.className = 'cards-filter-body';
  const title = cell.querySelector(HEADINGS) || cell.firstElementChild;
  if (title) {
    // scripts.js decorateButtons() turns <p><strong><a> titles into buttons before this block
    // runs. A card title is a heading-style link, not a CTA, so undo the buttonization.
    title.classList.remove('button-wrapper');
    title.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary', 'accent'));
    title.classList.add('cards-filter-title');
  }
  [...cell.children].filter((el) => el !== title && el.tagName === 'P')
    .forEach((p) => p.classList.add('cards-filter-description'));
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-filter-card';
  let categories = [];
  let image = null;
  let body = null;

  [...row.children].forEach((cell) => {
    if (!image && isImageCell(cell)) {
      image = cell;
      cell.className = 'cards-filter-image';
      const link = cell.querySelector('a');
      const picture = cell.querySelector('picture');
      if (link && !link.contains(picture)) {
        link.textContent = '';
        link.append(picture);
        cell.replaceChildren(link);
      }
    } else if (!body && (cell.querySelector(`${HEADINGS}, a`) || cell.children.length > 1)) {
      body = cell;
      decorateBody(cell);
    } else if (body && !cell.querySelector('picture, a')) {
      // Category cell: data only, never rendered as card text.
      categories = categories.concat(parseCategories(cell.textContent));
      cell.remove();
    } else if (!body && cell.textContent.trim()) {
      body = cell;
      decorateBody(cell);
    } else {
      cell.remove();
    }
  });

  if (image) li.append(image);
  if (body) li.append(body);

  // Imported images are unlinked; link them to the card's title URL (as on the source site).
  // Hidden from AT/tab order so the card exposes a single link.
  const titleLink = li.querySelector('.cards-filter-title a[href]');
  const pic = image && image.querySelector('picture');
  if (pic && titleLink && !pic.closest('a')) {
    const imageLink = document.createElement('a');
    imageLink.setAttribute('href', titleLink.getAttribute('href'));
    imageLink.tabIndex = -1;
    imageLink.setAttribute('aria-hidden', 'true');
    pic.replaceWith(imageLink);
    imageLink.append(pic);
  }

  li.dataset.categories = categories.map((c) => c.toLowerCase()).join(',');
  return { li, categories };
}

function buildFilters(cards, labels) {
  const group = document.createElement('div');
  group.className = 'cards-filter-controls';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Filter');

  const buttons = [];
  const apply = (key) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === key)));
    cards.forEach((card) => {
      const cats = card.dataset.categories ? card.dataset.categories.split(',') : [];
      card.hidden = key !== 'all' && !cats.includes(key);
    });
  };

  [['all', 'All'], ...labels].forEach(([key, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cards-filter-button';
    button.dataset.filter = key;
    button.textContent = label;
    button.setAttribute('aria-pressed', String(key === 'all'));
    button.addEventListener('click', () => apply(key));
    buttons.push(button);
    group.append(button);
  });
  return group;
}

export default async function decorate(block) {
  // Listing mode: rows come from the query index (see scripts/listing.js)
  await expandListing(block, listingRow);

  const ul = document.createElement('ul');
  const labels = new Map();
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    const { li, categories } = buildCard(row);
    categories.forEach((c) => {
      const key = c.toLowerCase();
      if (!labels.has(key)) labels.set(key, c);
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(optimizedPicture(img, false, [{ width: '750' }]));
  });

  const sorted = [...labels.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const cards = [...ul.children];
  if (sorted.length) {
    block.replaceChildren(buildFilters(cards, sorted), ul);
  } else {
    block.replaceChildren(ul);
  }
}
