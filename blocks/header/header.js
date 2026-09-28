// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * Relative image paths are resolved against the fragment URL.
 * @returns {Promise<Element[]|null>} top-level section elements
 */
async function fetchNavSections() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
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

/**
 * Current path without the local preview /content prefix or .html extension
 * @returns {string}
 */
function currentPath() {
  return window.location.pathname.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '');
}

/**
 * Whether a link points at (or is an ancestor of) the current page
 * @param {HTMLAnchorElement} a
 * @param {boolean} exact require an exact path match
 */
function isCurrent(a, exact = false) {
  const url = new URL(a.href, window.location);
  if (url.origin !== window.location.origin) return false;
  const path = url.pathname.replace(/\.html$/, '');
  const here = currentPath();
  return exact ? here === path : (here === path || here.startsWith(`${path}/`));
}

/**
 * Finds the first section matching a predicate, removing it from the pool
 */
function takeSection(sections, predicate) {
  const i = sections.findIndex(predicate);
  return i >= 0 ? sections.splice(i, 1)[0] : null;
}

/**
 * Splits a list item into its own text/image content and its nested list
 * @param {HTMLLIElement} li
 */
function splitListItem(li) {
  const nested = li.querySelector(':scope > ul');
  const img = li.querySelector(':scope > img, :scope > picture');
  const label = [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent.trim())
    .join(' ')
    .trim();
  return { img, label, nested };
}

/**
 * Builds the locale selector (toggle + panel) from a nested list
 * @param {HTMLUListElement} list country entries with nested language links
 */
function buildLocaleSelector(list) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';

  const panel = document.createElement('div');
  panel.className = 'nav-locale-panel';
  panel.id = 'nav-locale-panel';
  const countries = document.createElement('ul');
  let current = null;

  [...list.children].forEach((li) => {
    const { img, label, nested } = splitListItem(li);
    const country = document.createElement('li');
    country.className = 'nav-locale-country';
    if (img) {
      img.classList.add('nav-locale-flag');
      country.append(img);
    }
    const body = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'nav-locale-name';
    name.textContent = label;
    body.append(name);
    if (nested) {
      nested.className = 'nav-locale-langs';
      nested.querySelectorAll('a').forEach((a) => {
        if (!current && isCurrent(a)) {
          current = { a, img };
          a.setAttribute('aria-current', 'true');
        }
      });
      body.append(nested);
    }
    country.append(body);
    countries.append(country);
  });
  panel.append(countries);

  // default to the first language when nothing matches the current path
  if (!current) {
    const a = countries.querySelector('a');
    if (a) {
      current = { a, img: countries.querySelector('.nav-locale-flag') };
      a.setAttribute('aria-current', 'true');
    }
  }

  const toggle = document.createElement('a');
  toggle.href = '#';
  toggle.setAttribute('role', 'button');
  toggle.className = 'nav-locale-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', panel.id);
  if (current) {
    if (current.img) {
      const flag = current.img.cloneNode(true);
      flag.alt = '';
      toggle.append(flag);
    }
    const code = document.createElement('span');
    code.textContent = current.a.textContent;
    toggle.append(code);
    toggle.setAttribute('aria-label', `Toggle language ${current.a.textContent}`);
  }

  // visibility follows aria-expanded (see header.css)
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';
  const setOpen = (open) => toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!isOpen());
  });
  toggle.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      toggle.click();
    }
  });
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  wrapper.append(toggle, panel);
  wrapper.close = () => setOpen(false);
  return wrapper;
}

/**
 * Builds the sign in dialog from authored copy
 * @param {Element} section heading, subheading, field labels, link and button label
 */
function buildSignInDialog(section) {
  const dialog = document.createElement('dialog');
  dialog.className = 'nav-signin-dialog';
  const heading = section.querySelector('h1, h2');
  const subheading = section.querySelector('h3, h4');
  const paragraphs = [...section.querySelectorAll('p')];
  const link = section.querySelector('a');
  const texts = paragraphs.filter((p) => !p.querySelector('a')).map((p) => p.textContent.trim());
  const fields = texts.slice(0, -1);
  const submitLabel = texts[texts.length - 1] || 'Sign In';

  const form = document.createElement('form');
  form.method = 'dialog';
  if (heading) {
    heading.id = 'nav-signin-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    form.append(heading);
  }
  if (subheading) form.append(subheading);
  fields.forEach((labelText, i) => {
    const id = `nav-signin-field-${i}`;
    const label = document.createElement('label');
    label.className = 'nav-signin-label';
    label.htmlFor = id;
    label.textContent = labelText;
    const input = document.createElement('input');
    input.id = id;
    input.className = 'nav-signin-input';
    input.name = labelText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    input.type = /password/i.test(labelText) ? 'password' : 'text';
    input.placeholder = labelText;
    input.autocomplete = input.type === 'password' ? 'current-password' : 'username';
    form.append(label, input);
  });
  if (link) {
    link.className = 'nav-signin-forgot';
    form.append(link);
  }
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-signin-submit';
  submit.textContent = submitLabel;
  form.append(submit);
  dialog.append(form);

  // close when clicking outside the dialog box
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return dialog;
}

/**
 * Builds the search form with type-ahead results from the query index
 * @param {Element} section authored search label (+ optional icon)
 */
function buildSearch(section) {
  const label = section.textContent.trim() || 'Search';
  const icon = section.querySelector('img, picture');
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  if (icon) {
    icon.classList.add('nav-search-icon');
    if (icon.tagName === 'IMG') icon.alt = '';
    form.append(icon);
  }
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  input.autocomplete = 'off';
  const results = document.createElement('ul');
  results.className = 'nav-search-results';
  results.hidden = true;
  form.append(input, results);

  let index;
  const loadIndex = async () => {
    if (!index) {
      index = fetch('/query-index.json')
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((json) => json.data || [])
        .catch(() => []);
    }
    return index;
  };

  const render = async () => {
    const term = input.value.trim().toLowerCase();
    results.textContent = '';
    if (term.length < 2) {
      results.hidden = true;
      return;
    }
    const data = await loadIndex();
    data
      .filter((row) => `${row.title} ${row.description}`.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((row) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = row.path;
        a.textContent = row.title;
        li.append(a);
        results.append(li);
      });
    results.hidden = !results.children.length;
  };

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 200);
  });
  input.addEventListener('focus', loadIndex, { once: true });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const first = results.querySelector('a');
    if (first) window.location.href = first.href;
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) results.hidden = true;
  });
  return form;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const sections = await fetchNavSections();
  block.textContent = '';
  if (!sections) return;

  // identify sections by content so authors can reorder them
  const utility = takeSection(sections, (s) => s.querySelector('li > img, li > picture'));
  const signIn = takeSection(sections, (s) => s.querySelector('h1, h2'));
  const brand = takeSection(sections, (s) => s.querySelector('a img, a picture') && !s.querySelector('ul'));
  const links = takeSection(sections, (s) => s.querySelector('ul'));
  const search = takeSection(sections, (s) => s.textContent.trim());

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');
  nav.setAttribute('aria-expanded', 'false');

  // utility bar: sign in + locale selector
  const utilityBar = document.createElement('div');
  utilityBar.className = 'nav-utility';
  const utilityInner = document.createElement('div');
  utilityInner.className = 'nav-utility-inner';
  let dialog;
  let locale;
  if (utility) {
    const signInLink = utility.querySelector(':scope > p a');
    if (signInLink) {
      signInLink.className = 'nav-signin';
      utilityInner.append(signInLink);
    }
    const localeList = utility.querySelector(':scope > ul');
    if (localeList) {
      locale = buildLocaleSelector(localeList);
      utilityInner.append(locale);
    }
    if (signInLink && signIn) {
      dialog = buildSignInDialog(signIn);
      signInLink.setAttribute('role', 'button');
      signInLink.setAttribute('aria-haspopup', 'dialog');
      signInLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (locale) locale.close();
        dialog.showModal();
      });
    }
  }
  utilityBar.append(utilityInner);

  // main row: brand, hamburger, sections, tools
  const mainRow = document.createElement('div');
  mainRow.className = 'nav-main';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';

  if (brand) {
    brand.className = 'nav-brand';
    brand.querySelectorAll('a').forEach((a) => { a.setAttribute('aria-label', 'Home'); });
    mainInner.append(brand);
  }

  const navSections = document.createElement('nav');
  navSections.className = 'nav-sections';
  navSections.setAttribute('aria-label', 'Primary');
  navSections.id = 'nav-sections';
  if (links) {
    const list = links.querySelector('ul');
    list.querySelectorAll('a').forEach((a) => {
      const isRoot = !a.closest('li').parentElement.closest('li');
      if (isCurrent(a, isRoot)) a.setAttribute('aria-current', 'page');
    });
    navSections.append(list);
  }

  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', navSections.id);
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

  const toggleMenu = (force) => {
    const open = force !== undefined ? force : nav.getAttribute('aria-expanded') !== 'true';
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
  };
  hamburger.addEventListener('click', () => toggleMenu());

  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  if (search) tools.append(buildSearch(search));

  mainInner.append(hamburger, navSections, tools);
  mainRow.append(mainInner);

  nav.append(utilityBar, mainRow);
  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
  if (dialog) block.append(dialog);

  // shrink + shadow once the page scrolls
  const onScroll = () => navWrapper.classList.toggle('scrolled', window.scrollY > 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // reset mobile state when crossing breakpoints
  isDesktop.addEventListener('change', () => {
    toggleMenu(false);
    if (locale) locale.close();
  });
}
