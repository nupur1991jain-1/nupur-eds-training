/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbParser from './parsers/breadcrumb.js';
import columnsAuthorParser from './parsers/columns-author.js';
import cardsUpnextParser from './parsers/cards-upnext.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'breadcrumb': breadcrumbParser,
  'columns-author': columnsAuthorParser,
  'cards-upnext': cardsUpnextParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "magazine",
  "description": "WKND magazine article pages",
  "urls": [
    "https://wknd.site/us/en/magazine/arctic-surfing.html",
    "https://wknd.site/us/en/magazine/guide-la-skateparks.html",
    "https://wknd.site/us/en/magazine/san-diego-surf.html",
    "https://wknd.site/us/en/magazine/ski-touring.html",
    "https://wknd.site/us/en/magazine/western-australia.html"
  ],
  "blocks": [
    {
      "name": "breadcrumb",
      "instances": [
        ".aem-Grid > .breadcrumb"
      ]
    },
    {
      "name": "columns-author",
      "instances": [
        "main.container .experiencefragment"
      ]
    },
    {
      "name": "cards-upnext",
      "instances": [
        "aside .list.cmp-list--upnext"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero image",
      "selector": [
        ".aem-Grid > .image:has(~ .breadcrumb)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".aem-Grid > .image:has(~ .breadcrumb)"
      ]
    },
    {
      "id": "section-2",
      "name": "Breadcrumb",
      "selector": [
        ".aem-Grid > .breadcrumb"
      ],
      "style": null,
      "blocks": [
        "breadcrumb"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Article body with right sidebar",
      "selector": [
        ".aem-Grid > .breadcrumb ~ main.container"
      ],
      "style": "article-sidebar",
      "blocks": [
        "columns-author",
        "cards-upnext"
      ],
      "defaultContent": [
        ".aem-Grid > .breadcrumb ~ main.container .title",
        ".aem-Grid > .breadcrumb ~ main.container .contentfragment",
        "aside.cmp-layoutcontainer--sidebar .title"
      ]
    }
  ]
};

// TRANSFORMER REGISTRY - section transformer runs after cleanup
const transformers = [
  wkndCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [wkndSectionsTransformer] : []),
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
