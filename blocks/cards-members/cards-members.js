import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

const CTA_PATTERN = /^read\s*more\b/i;

// The gated "Read More" is a disabled label, not a link. It is authored as plain text, but if an
// author links or bolds it, scripts.js decorateButtons() will already have buttonized it
// (p.button-wrapper > a.button) before this block runs — undo that and drop the link.
function isCta(el) {
  if (el.tagName !== 'P') return false;
  const text = el.textContent.trim();
  return el.classList.contains('button-wrapper') || (text.length <= 30 && CTA_PATTERN.test(text));
}

function buildCta(el) {
  const cta = document.createElement('p');
  cta.className = 'cards-members-cta';
  const label = document.createElement('span');
  label.className = 'cards-members-cta-label';
  label.setAttribute('aria-disabled', 'true');
  label.textContent = el.textContent.trim();
  cta.append(label);
  return cta;
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-members-card';

  const body = document.createElement('div');
  body.className = 'cards-members-body';
  const image = document.createElement('div');
  image.className = 'cards-members-image';
  let cta = null;
  let lockIcon = null;

  // Flatten every cell's children so authors may merge, split or reorder cells freely.
  [...row.children].forEach((cell) => {
    const children = cell.children.length ? [...cell.children] : [cell];
    children.forEach((el) => {
      const pic = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
      if (pic && !image.children.length) {
        image.append(pic);
        if (el !== pic && el.textContent.trim()) body.append(el);
        return;
      }
      // An authored :lock: icon on its own line becomes the card's lock marker.
      if (!el.textContent.trim() && el.querySelector('.icon-lock')) {
        lockIcon = el.querySelector('.icon-lock');
        return;
      }
      if (!el.textContent.trim()) return;
      if (!cta && isCta(el)) {
        cta = buildCta(el);
        return;
      }
      body.append(el);
    });
  });

  const lock = document.createElement('span');
  lock.className = 'cards-members-lock';
  lock.setAttribute('aria-hidden', 'true');
  if (lockIcon) lock.append(lockIcon);
  body.prepend(lock);

  const title = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (title) title.classList.add('cards-members-title');
  [...body.children].filter((el) => el !== title && el.tagName === 'P')
    .forEach((p) => p.classList.add('cards-members-description'));
  if (cta) body.append(cta);

  // Text first, image below — regardless of authored cell order.
  li.append(body);
  if (image.children.length) li.append(image);
  return li;
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    ul.append(buildCard(row));
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });
  block.replaceChildren(ul);
}
