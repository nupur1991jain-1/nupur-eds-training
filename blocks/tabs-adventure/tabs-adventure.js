import { createOptimizedPicture } from '../../scripts/aem.js';

// No authorable options yet; declared so future options branch on one list.
const OPTION_CLASSES = [];

let tabsId = 0;

function selectTab(block, index, focus = false) {
  const tabs = [...block.querySelectorAll('.tabs-adventure-tab')];
  const panels = [...block.querySelectorAll('.tabs-adventure-panel')];
  tabs.forEach((tab, idx) => {
    const selected = idx === index;
    tab.setAttribute('aria-selected', selected);
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  panels.forEach((panel, idx) => {
    panel.setAttribute('aria-hidden', idx !== index);
    panel.hidden = idx !== index;
  });
}

function optimizeImages(panel) {
  panel.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(
      createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '1200' }, { width: '750' }]),
    );
  });
}

export default function decorate(block) {
  // eslint-disable-next-line no-unused-vars
  const active = [...block.classList].filter((c) => OPTION_CLASSES.includes(c));

  tabsId += 1;
  const id = tabsId;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-adventure-list';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'tabs-adventure-panels';

  const rows = [...block.querySelectorAll(':scope > div')]
    .filter((r) => r.textContent.trim() || r.querySelector('picture'));

  rows.forEach((row, idx) => {
    const cells = [...row.children];
    // Row = [tab label] | [rich content]. If an author left only one cell, use its first
    // heading/line as the label and the remainder as the panel.
    let labelCell = cells.length > 1 ? cells[0] : null;
    const contentCells = cells.length > 1 ? cells.slice(1) : cells;
    let labelText = labelCell ? labelCell.textContent.trim() : '';
    if (!labelText) {
      const first = contentCells[0]?.querySelector('h1, h2, h3, h4, h5, h6, p');
      labelText = first ? first.textContent.trim() : `Tab ${idx + 1}`;
      labelCell = null;
    }

    const tabId = `tabs-adventure-${id}-tab-${idx}`;
    const panelId = `tabs-adventure-${id}-panel-${idx}`;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-adventure-tab';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.textContent = labelText;
    tab.addEventListener('click', () => selectTab(block, idx));
    tablist.append(tab);

    const panel = document.createElement('div');
    panel.className = 'tabs-adventure-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.tabIndex = 0;
    contentCells.forEach((c) => panel.append(...c.childNodes));
    optimizeImages(panel);
    panels.append(panel);
  });

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('.tabs-adventure-tab')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    selectTab(block, next, true);
  });

  block.replaceChildren(tablist, panels);
  if (rows.length) selectTab(block, 0);
}
