import { createOptimizedPicture } from '../../scripts/aem.js';

const NETWORKS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok', 'x'];

// scripts.js decorateButtons() runs before block decoration and turns <p><strong|em><a> into
// buttons. Author bio links are icon links, not CTAs, so undo that.
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

// A cell is the social cell when all of its text lives inside links and it has no heading/image.
function isLinkOnlyCell(cell) {
  const links = [...cell.querySelectorAll('a[href]')];
  if (!links.length || cell.querySelector('picture, img, h1, h2, h3, h4, h5, h6')) return false;
  const linkText = links.map((a) => a.textContent).join('').replace(/\s+/g, '');
  return cell.textContent.replace(/\s+/g, '') === linkText;
}

function buildSocial(cells) {
  const ul = document.createElement('ul');
  ul.className = 'columns-author-social';
  cells.forEach((cell) => {
    cell.querySelectorAll('a[href]').forEach((a) => {
      const li = document.createElement('li');
      const label = a.textContent.trim();
      const network = networkFor(a);
      if (network) li.classList.add(`columns-author-social-${network}`);
      if (label) {
        a.setAttribute('aria-label', label);
        const span = document.createElement('span');
        span.className = 'columns-author-social-label';
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

export default function decorate(block) {
  unbuttonize(block);

  // Tolerate extra rows/cells: gather every non-empty cell across rows.
  const cells = [...block.children].flatMap((row) => [...row.children])
    .filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));

  const socialCells = cells.filter(isLinkOnlyCell);
  const profileCells = cells.filter((c) => !socialCells.includes(c));

  const profile = document.createElement('div');
  profile.className = 'columns-author-profile';
  const avatar = document.createElement('div');
  avatar.className = 'columns-author-avatar';
  const info = document.createElement('div');
  info.className = 'columns-author-info';

  profileCells.forEach((cell) => {
    [...cell.children].forEach((el) => {
      const pic = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
      if (pic && !avatar.children.length) {
        const img = pic.querySelector('img');
        avatar.append(img
          ? createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }])
          : pic);
        // Drop the now-empty paragraph that wrapped the picture.
        if (el !== pic && !el.textContent.trim()) return;
        if (el !== pic) {
          el.querySelector('picture')?.remove();
          info.append(el);
        }
        return;
      }
      if (el.textContent.trim()) info.append(el);
    });
  });

  const name = info.querySelector('h1, h2, h3, h4, h5, h6') || info.firstElementChild;
  if (name) name.classList.add('columns-author-name');
  [...info.children].filter((el) => el !== name && el.tagName === 'P')
    .forEach((p) => p.classList.add('columns-author-role'));

  if (avatar.children.length) profile.append(avatar);
  profile.append(info);

  const content = [profile];
  if (socialCells.length) content.push(buildSocial(socialCells));
  block.replaceChildren(...content);
}
