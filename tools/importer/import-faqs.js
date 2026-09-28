/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionFaqParser from './parsers/accordion-faq.js';

// PAGE DATA (metadata WKND shows outside the page, e.g. categories, dates)
import pageData from './data/wknd-page-data.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'accordion-faq': accordionFaqParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "faqs",
  "description": "WKND FAQs page",
  "urls": [
    "https://wknd.site/us/en/faqs.html"
  ],
  "blocks": [
    {
      "name": "accordion-faq",
      "instances": [
        "main .accordion"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "FAQs with help sidebar",
      "selector": [
        "main .aem-Grid > .container.aem-GridColumn--default--8"
      ],
      "style": "article-sidebar, title-underline",
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        "main .aem-GridColumn--default--8 .title",
        "main .aem-GridColumn--default--8 .image",
        "main .aem-GridColumn--default--8 .text",
        "main .aem-GridColumn--default--3 .title",
        "main .aem-GridColumn--default--3 .text"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  wkndCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && (PAGE_TEMPLATE.sections.length > 1 || PAGE_TEMPLATE.sections.some((s) => s.style)) ? [wkndSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Adds per-page metadata rows (from data/wknd-page-data.js) to the page's Metadata block
 * @param {Element} main
 * @param {Document} document
 * @param {string} originalURL source page URL
 */
function addPageMetadata(main, document, originalURL) {
  const pagePath = new URL(originalURL).pathname.replace(/\.html?$/, '');
  const entries = Object.entries(pageData[pagePath] || {}).filter(([, v]) => v);
  if (!entries.length) return;
  const table = [...main.querySelectorAll('table')]
    .find((t) => (t.querySelector('tr')?.textContent || '').trim().toLowerCase() === 'metadata');
  if (!table) return;
  const body = table.tBodies[0] || table;
  entries.forEach(([key, value]) => {
    const tr = document.createElement('tr');
    [key, value].forEach((text) => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.append(td);
    });
    body.append(tr);
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block, skipping elements already replaced by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    addPageMetadata(main, document, params.originalURL);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
