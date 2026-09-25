/*
 * Employee List Block
 * Renders employees from a published spreadsheet, 10 at a time,
 * with a "Load more" button labelled from the placeholders sheet.
 */

import { fetchPlaceholders } from '../../scripts/utils.js';

const PAGE_SIZE = 10;
const DEFAULT_SOURCE = '/employees.json';
const COLUMNS = ['name', 'department', 'experience', 'city'];

/**
 * Reads the authored source path, falling back to the default sheet.
 * @param {Element} block The employee list block
 * @returns {string} path to the employee sheet
 */
function readSource(block) {
  const link = block.querySelector('a[href]');
  if (link) return new URL(link.href, window.location).pathname;
  const text = block.textContent.trim();
  return text.startsWith('/') ? text : DEFAULT_SOURCE;
}

/**
 * Fetches one page of employees from the sheet.
 * @param {string} source Sheet path
 * @param {number} offset Row offset
 * @returns {Promise<{data: Array, total: number}>}
 */
async function fetchEmployees(source, offset) {
  const resp = await fetch(`${source}?limit=${PAGE_SIZE}&offset=${offset}`);
  if (!resp.ok) throw new Error(`failed to load ${source}`);
  const json = await resp.json();
  return { data: json.data || [], total: json.total || 0 };
}

/**
 * Builds a single employee card.
 * @param {Object} employee Row from the sheet
 * @returns {HTMLLIElement}
 */
function renderEmployee(employee) {
  const li = document.createElement('li');
  li.className = 'employee-list-item';
  COLUMNS.forEach((column) => {
    const value = employee[column] || employee[column.charAt(0).toUpperCase() + column.slice(1)];
    if (!value) return;
    const field = document.createElement('div');
    field.className = `employee-list-${column}`;
    field.textContent = value;
    li.append(field);
  });
  return li;
}

export default async function decorate(block) {
  const source = readSource(block);
  const placeholders = await fetchPlaceholders();

  const list = document.createElement('ul');
  list.className = 'employee-list-items';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button secondary employee-list-more';
  button.textContent = placeholders.loadMore || 'Load more';

  block.replaceChildren(list, button);

  let offset = 0;

  const loadPage = async () => {
    button.disabled = true;
    try {
      const { data, total } = await fetchEmployees(source, offset);
      data.forEach((employee) => list.append(renderEmployee(employee)));
      offset += data.length;
      if (offset >= total || data.length === 0) button.remove();
      else button.disabled = false;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Employee list failed to load', error);
      button.remove();
    }
  };

  button.addEventListener('click', loadPage);
  await loadPage();
}
