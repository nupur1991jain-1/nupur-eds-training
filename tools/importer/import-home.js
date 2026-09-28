/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsFeaturedParser from './parsers/columns-featured.js';
import cardsArticleParser from './parsers/cards-article.js';
import heroTeaserParser from './parsers/hero-teaser.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'columns-featured': columnsFeaturedParser,
  'cards-article': cardsArticleParser,
  'hero-teaser': heroTeaserParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "WKND homepage",
  "urls": [
    "https://wknd.site/us/en.html"
  ],
  "blocks": [
    {
      "name": "carousel-hero",
      "instances": [
        ".carousel.cmp-carousel--hero"
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
      "name": "hero-teaser",
      "instances": [
        ".teaser.cmp-teaser--hero.cmp-teaser--imagebottom"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero carousel",
      "selector": [
        ".carousel.cmp-carousel--hero"
      ],
      "style": null,
      "blocks": [
        "carousel-hero"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Featured article",
      "selector": [
        ".teaser.cmp-teaser--featured"
      ],
      "style": null,
      "blocks": [
        "columns-featured"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Recent Articles",
      "selector": [
        ".teaser.cmp-teaser--featured + .title"
      ],
      "style": null,
      "blocks": [
        "cards-article"
      ],
      "defaultContent": [
        ".teaser.cmp-teaser--featured + .title",
        ".teaser.cmp-teaser--featured ~ .button.cmp-button--primary"
      ]
    },
    {
      "id": "section-4",
      "name": "Next Adventures",
      "selector": [
        ".separator + .title.cmp-title--underline"
      ],
      "style": null,
      "blocks": [
        "hero-teaser"
      ],
      "defaultContent": [
        ".separator + .title.cmp-title--underline"
      ]
    },
    {
      "id": "section-5",
      "name": "Where do you want to go?",
      "selector": [
        ".teaser.cmp-teaser--imagebottom + .cmp-layout-container--fixed"
      ],
      "style": null,
      "blocks": [
        "cards-article"
      ],
      "defaultContent": [
        ".teaser.cmp-teaser--imagebottom + .cmp-layout-container--fixed .title",
        ".teaser.cmp-teaser--imagebottom + .cmp-layout-container--fixed .button.cmp-button--primary"
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
