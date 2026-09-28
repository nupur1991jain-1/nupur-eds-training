/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsContributorParser from './parsers/cards-contributor.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsMembersParser from './parsers/cards-members.js';

// PAGE DATA (metadata WKND shows outside the page, e.g. categories, dates)
import pageData from './data/wknd-page-data.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-contributor': cardsContributorParser,
  'columns-featured': columnsFeaturedParser,
  'cards-article': cardsArticleParser,
  'cards-members': cardsMembersParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "about-us",
  "description": "WKND About Us and Magazine landing pages",
  "urls": [
    "https://wknd.site/us/en/about-us.html",
    "https://wknd.site/us/en/magazine.html"
  ],
  "blocks": [
    {
      "name": "cards-contributor",
      "instances": [
        "section.cmp-experience-fragment--contributor"
      ]
    },
    {
      "name": "columns-featured",
      "instances": [
        ".teaser.cmp-teaser--featured"
      ]
    },
    {
      "name": "cards-article",
      "instances": [
        "main .image-list.list"
      ]
    },
    {
      "name": "cards-members",
      "instances": [
        ".teaser.cmp-teaser--secure"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Our Contributors",
      "selector": [
        ".aem-Grid > .title:first-child:has(~ .cmp-experience-fragment--contributor)"
      ],
      "style": null,
      "blocks": [
        "cards-contributor"
      ],
      "defaultContent": [
        ".aem-Grid > .title:first-child:has(~ .cmp-experience-fragment--contributor)",
        ".aem-Grid > .title.cmp-title--underline",
        ".aem-Grid > .text.cmp-text--font-small"
      ]
    },
    {
      "id": "section-2",
      "name": "WKND Guides",
      "selector": [
        ".aem-Grid > .cmp-experience-fragment--contributor ~ .title.cmp-title--underline"
      ],
      "style": null,
      "blocks": [
        "cards-contributor"
      ],
      "defaultContent": [
        ".aem-Grid > .cmp-experience-fragment--contributor ~ .title.cmp-title--underline",
        ".aem-Grid > .cmp-experience-fragment--contributor ~ .text.cmp-text--font-small"
      ]
    },
    {
      "id": "section-3",
      "name": "Magazine featured article",
      "selector": [
        ".aem-Grid > .title:first-child:has(~ .teaser.cmp-teaser--featured)"
      ],
      "style": null,
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": [
        ".aem-Grid > .title:first-child:has(~ .teaser.cmp-teaser--featured)"
      ]
    },
    {
      "id": "section-4",
      "name": "All Articles",
      "selector": [
        ".aem-Grid > .teaser.cmp-teaser--featured ~ .title.cmp-title--underline"
      ],
      "style": null,
      "blocks": [
        "cards-article"
      ],
      "defaultContent": [
        ".aem-Grid > .teaser.cmp-teaser--featured ~ .title.cmp-title--underline"
      ]
    },
    {
      "id": "section-5",
      "name": "Members Only",
      "selector": [
        ".aem-Grid > .image-list ~ .title.cmp-title--underline"
      ],
      "style": "separator-medium",
      "blocks": [],
      "defaultContent": [
        ".aem-Grid > .image-list ~ .title.cmp-title--underline",
        ".aem-Grid > .image-list ~ .text"
      ]
    },
    {
      "id": "section-6",
      "name": "Members-only teasers",
      "selector": [
        ".teaser.cmp-teaser--secure"
      ],
      "style": null,
      "blocks": [
        "cards-members"
      ],
      "defaultContent": []
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
