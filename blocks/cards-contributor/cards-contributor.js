import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

// Same network vocabulary as columns-author so social links share one styling convention.
const NETWORKS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok', 'x'];

// scripts.js decorateButtons() turns <p><strong|em><a> into buttons before this block runs.
// Contributor social links are icon links, not CTAs, so undo that.
function unbuttonize(el) {
  el.querySelectorAll('.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));
  el.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    if (!a.classList.length) a.removeAttribute('class');
  });
}

function networkFor(a) {
  const text = a.textContent.trim().toLowerCase();
  let host = '';
  try {
    host = new URL(a.href, window.location).hostname.toLowerCase();
  } catch { /* ignore */ }
  // 'x' is too short for substring matching; require an exact label or host.
  return NETWORKS.find((n) => text === n
    || (n.length > 1 && text.includes(n))
    || host === `${n}.com` || host.endsWith(`.${n}.com`)) || '';
}

// An element is a social paragraph when all of its text lives inside links.
function isLinkOnly(el) {
  const links = [...el.querySelectorAll('a[href]')];
  if (!links.length || el.querySelector('picture, img, h1, h2, h3, h4, h5, h6')) return false;
  const linkText = links.map((a) => a.textContent).join('').replace(/\s+/g, '');
  return el.textContent.replace(/\s+/g, '') === linkText;
}

function buildSocial(elements) {
  const ul = document.createElement('ul');
  ul.className = 'cards-contributor-social';
  elements.forEach((el) => {
    el.querySelectorAll('a[href]').forEach((a) => {
      const li = document.createElement('li');
      const label = a.textContent.trim();
      const network = networkFor(a);
      if (network) li.classList.add(`cards-contributor-social-${network}`);
      if (label) {
        a.setAttribute('aria-label', label);
        const span = document.createElement('span');
        span.className = 'cards-contributor-social-label';
        span.textContent = label;
        // Keep any authored :icon: spans, replace only the text.
        const icons = [...a.querySelectorAll('.icon')];
        a.replaceChildren(...icons, span);
      }
      li.append(a);
      ul.append(li);
    });
  });
  return ul;
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-contributor-card';

  const avatar = document.createElement('div');
  avatar.className = 'cards-contributor-avatar';
  const body = document.createElement('div');
  body.className = 'cards-contributor-body';
  const socialEls = [];

  // Flatten every cell's children so authors may merge or split cells freely.
  [...row.children].forEach((cell) => {
    const children = cell.children.length ? [...cell.children] : [cell];
    children.forEach((el) => {
      const pic = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
      if (pic && !avatar.children.length) {
        avatar.append(pic);
        // Keep any text that shared the picture's paragraph.
        if (el !== pic && el.textContent.trim()) body.append(el);
        return;
      }
      if (!el.textContent.trim()) return;
      if (isLinkOnly(el)) socialEls.push(el);
      else body.append(el);
    });
  });

  const name = body.querySelector('h1, h2, h3, h4, h5, h6') || body.firstElementChild;
  if (name) name.classList.add('cards-contributor-name');
  [...body.children].filter((el) => el !== name && el.tagName === 'P')
    .forEach((p) => p.classList.add('cards-contributor-role'));

  if (avatar.children.length) li.append(avatar);
  if (body.children.length) li.append(body);
  if (socialEls.length) li.append(buildSocial(socialEls));
  return li;
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  unbuttonize(block);

  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture')) return;
    ul.append(buildCard(row));
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]));
  });
  block.replaceChildren(ul);
}
