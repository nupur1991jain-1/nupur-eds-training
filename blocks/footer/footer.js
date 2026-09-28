/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * Relative image paths are resolved against the fragment URL.
 * @returns {Promise<Element[]|null>} top-level section elements
 */
async function fetchFooterSections() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  container.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  container.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = new URL(source.getAttribute('srcset'), resp.url).href;
  });
  return [...container.children];
}

const SOCIAL_NETWORKS = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'pinterest'];

/**
 * Finds the first section matching a predicate, removing it from the pool
 */
function takeSection(sections, predicate) {
  const i = sections.findIndex(predicate);
  return i >= 0 ? sections.splice(i, 1)[0] : null;
}

/**
 * Whether a same-origin link points at (or is an ancestor of) the current page
 * @param {HTMLAnchorElement} a
 * @param {boolean} exact require an exact path match
 */
function isCurrent(a, exact = false) {
  const url = new URL(a.href, window.location);
  if (url.origin !== window.location.origin) return false;
  const path = url.pathname.replace(/\.html$/, '');
  const here = window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
  return exact ? here === path : (here === path || here.startsWith(`${path}/`));
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const sections = await fetchFooterSections();
  block.textContent = '';
  if (!sections) return;

  // identify sections by content so authors can reorder them
  const social = takeSection(sections, (s) => s.querySelector('h1, h2, h3, h4, h5, h6') && s.querySelector('ul'));
  const brand = takeSection(sections, (s) => s.querySelector('a img, a picture') && !s.querySelector('ul'));
  const links = takeSection(sections, (s) => s.querySelector('ul'));

  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  const top = document.createElement('div');
  top.className = 'footer-top';

  if (brand) {
    brand.className = 'footer-brand';
    top.append(brand);
  }

  if (links) {
    const nav = document.createElement('nav');
    nav.className = 'footer-nav';
    nav.setAttribute('aria-label', 'Footer');
    const list = links.querySelector('ul');
    list.querySelectorAll('a').forEach((a) => {
      // root links (e.g. Home) need an exact match, children match by prefix
      const isRoot = !a.closest('li').parentElement.closest('li');
      if (isRoot) a.classList.add('footer-nav-root');
      if (isRoot ? isCurrent(a, true) : isCurrent(a)) a.setAttribute('aria-current', 'page');
    });
    nav.append(list);
    top.append(nav);
  }

  if (social) {
    social.className = 'footer-social';
    const list = social.querySelector('ul');
    if (list) list.className = 'footer-social-links';
    social.querySelectorAll('a').forEach((a) => {
      // network icon comes from the link text or host (e.g. "Facebook")
      const label = a.textContent.trim();
      const network = SOCIAL_NETWORKS
        .find((n) => label.toLowerCase().includes(n) || a.href.toLowerCase().includes(n));
      a.className = 'footer-social-link';
      if (network) a.classList.add(`footer-social-${network}`);
      if (label && !a.querySelector('img, picture')) {
        a.setAttribute('aria-label', label);
        a.innerHTML = `<span class="footer-social-label">${label}</span>`;
      }
    });
    top.append(social);
  }

  inner.append(top);

  // everything left over is legal / disclaimer copy
  sections.forEach((section) => {
    section.className = 'footer-legal';
    inner.append(section);
  });

  block.append(inner);
}
