/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import breadcrumbParser from './parsers/breadcrumb.js';
import carouselGalleryParser from './parsers/carousel-gallery.js';
import tableTripFactsParser from './parsers/table-trip-facts.js';
import tabsAdventureParser from './parsers/tabs-adventure.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'breadcrumb': breadcrumbParser,
  'carousel-gallery': carouselGalleryParser,
  'table-trip-facts': tableTripFactsParser,
  'tabs-adventure': tabsAdventureParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "adventures",
  "description": "WKND adventure detail pages",
  "urls": [
    "https://wknd.site/us/en/adventures/climbing-new-zealand.html",
    "https://wknd.site/us/en/adventures/downhill-skiing-wyoming.html",
    "https://wknd.site/us/en/adventures/tahoe-skiing.html",
    "https://wknd.site/us/en/adventures/west-coast-cycling.html",
    "https://wknd.site/us/en/adventures/whistler-mountain-biking.html",
    "https://wknd.site/us/en/adventures/yosemite-backpacking.html"
  ],
  "blocks": [
    {
      "name": "breadcrumb",
      "instances": [
        ".breadcrumb.cmp-breadcrumb--fixed"
      ]
    },
    {
      "name": "carousel-gallery",
      "instances": [
        ".carousel.cmp-carousel--mini"
      ]
    },
    {
      "name": "table-trip-facts",
      "instances": [
        "main .aem-GridColumn--default--3 .contentfragment.cmp-contentfragment--elements"
      ]
    },
    {
      "name": "tabs-adventure",
      "instances": [
        "main .tabs.panelcontainer"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Breadcrumb",
      "selector": [
        ".breadcrumb.cmp-breadcrumb--fixed"
      ],
      "style": null,
      "blocks": [
        "breadcrumb"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Image carousel",
      "selector": [
        ".carousel.cmp-carousel--mini"
      ],
      "style": null,
      "blocks": [
        "carousel-gallery"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Adventure title",
      "selector": [
        "main .cmp-layout-container--fixed .title.cmp-title--underline"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "main .cmp-layout-container--fixed .title.cmp-title--underline"
      ]
    },
    {
      "id": "section-4",
      "name": "Adventure details (sidebar + tabbed content)",
      "selector": [
        "main .cmp-layout-container--fixed .title.cmp-title--underline + .container"
      ],
      "style": "sidebar",
      "blocks": [
        "table-trip-facts",
        "tabs-adventure"
      ],
      "defaultContent": [
        "main .aem-GridColumn--default--3 .title"
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
