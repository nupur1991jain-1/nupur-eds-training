/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-adventures-2.js
  var import_adventures_2_exports = {};
  __export(import_adventures_2_exports, {
    default: () => import_adventures_2_default
  });

  // tools/importer/parsers/hero-teaser.js
  function pickFromSrcset(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : "";
  }
  function isUsableSrc(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage(container, document2) {
    if (!container) return null;
    let img = container.querySelector("img");
    const cmp = container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      src = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        pickFromSrcset(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ].find(isUsableSrc) || "";
    }
    if (!src && cmp) src = (cmp.getAttribute("data-cmp-src") || "").replace("{.width}", ".1600");
    if (!src) return img || null;
    if (!img) {
      img = document2.createElement("img");
      img.setAttribute("alt", cmp && cmp.getAttribute("data-cmp-alt") || "");
    }
    img.setAttribute("src", src);
    img.removeAttribute("srcset");
    img.removeAttribute("loading");
    return img;
  }
  function parse(element, { document: document2 }) {
    const content = element.querySelector(".cmp-teaser__content");
    const imageWrap = element.querySelector(".cmp-teaser__image") || element.querySelector(".cmp-image");
    const image = resolveImage(imageWrap, document2);
    const textCell = [];
    const pretitle = content && content.querySelector(".cmp-teaser__pretitle");
    if (pretitle && pretitle.textContent.trim()) {
      const p = document2.createElement("p");
      p.textContent = pretitle.textContent.trim();
      textCell.push(p);
    }
    const title = content && content.querySelector(".cmp-teaser__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      const h = document2.createElement("h2");
      h.textContent = title.textContent.trim();
      textCell.push(h);
    }
    const desc = content && content.querySelector(".cmp-teaser__description");
    if (desc && desc.textContent.trim()) {
      const paras = desc.querySelectorAll("p");
      if (paras.length) {
        paras.forEach((p) => textCell.push(p));
      } else {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        textCell.push(p);
      }
    }
    const ctas = content ? Array.from(content.querySelectorAll(".cmp-teaser__action-link")) : [];
    ctas.forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      textCell.push(p);
    });
    if (!image && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    cells.push([textCell.length ? textCell : ""]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/listing-config.js
  function toPath(href, base) {
    try {
      return new URL(href, base).pathname.replace(/\.html$/, "");
    } catch (e) {
      return "";
    }
  }
  function listingSource(element, base) {
    var _a;
    const counts = /* @__PURE__ */ new Map();
    element.querySelectorAll("a[href]").forEach((a) => {
      const path = toPath(a.getAttribute("href"), base);
      if (!path || path.split("/").length < 3) return;
      const parent = `${path.slice(0, path.lastIndexOf("/"))}/`;
      counts.set(parent, (counts.get(parent) || 0) + 1);
    });
    return ((_a = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]) == null ? void 0 : _a[0]) || "";
  }
  function replaceWithListing(element, document2, name, config) {
    const cells = [["Source", config.source], ["Sort", config.sort]];
    if (config.limit) cells.push(["Limit", String(config.limit)]);
    if (config.excludeCurrent) cells.push(["Exclude Current", "true"]);
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-filter.js
  function parse2(element, { document: document2, params }) {
    const source = listingSource(element, params.originalURL);
    if (!source) {
      element.replaceWith(...element.childNodes);
      return;
    }
    replaceWithListing(element, document2, "cards-filter", { source, sort: "title" });
  }

  // tools/importer/data/wknd-page-data.js
  var wknd_page_data_default = {
    "/us/en/adventures/bali-surf-camp": {
      "Categories": "Surfing"
    },
    "/us/en/adventures/beervana-portland": {
      "Categories": "Travel"
    },
    "/us/en/adventures/climbing-new-zealand": {
      "Categories": "Climbing"
    },
    "/us/en/adventures/colorado-rock-climbing": {
      "Categories": "Climbing"
    },
    "/us/en/adventures/cycling-tuscany": {
      "Categories": "Cycling, Travel"
    },
    "/us/en/adventures/downhill-skiing-wyoming": {
      "Categories": "Skiing"
    },
    "/us/en/adventures/gastronomic-marais-tour": {
      "Categories": "Travel"
    },
    "/us/en/adventures/napa-wine-tasting": {
      "Categories": "Travel"
    },
    "/us/en/adventures/riverside-camping-australia": {
      "Categories": "Travel"
    },
    "/us/en/adventures/ski-touring-mont-blanc": {
      "Categories": "Skiing"
    },
    "/us/en/adventures/surf-camp-costa-rica": {
      "Categories": "Surfing"
    },
    "/us/en/adventures/tahoe-skiing": {
      "Categories": "Skiing"
    },
    "/us/en/adventures/west-coast-cycling": {
      "Categories": "Cycling"
    },
    "/us/en/adventures/whistler-mountain-biking": {
      "Categories": "Cycling"
    },
    "/us/en/adventures/yosemite-backpacking": {
      "Categories": "Travel"
    },
    "/us/en/magazine/guide-la-skateparks": {
      "Publication Date": "2020-09-30"
    },
    "/us/en/magazine/ski-touring": {
      "Publication Date": "2020-09-30"
    },
    "/us/en/magazine/western-australia": {
      "Publication Date": "2020-07-09"
    },
    "/us/en/magazine/san-diego-surf": {
      "Publication Date": "2020-07-09"
    }
  };

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "iframe.aamIframeLoaded",
        "#toggleNav",
        "#mobileNav"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "article.cmp-contentfragment > h3.cmp-contentfragment__title"
      ]);
      WebImporter.DOMUtils.remove(element, ["div.sharing"]);
      WebImporter.DOMUtils.remove(element, [
        ".cmp-carousel__actions",
        ".cmp-carousel__indicators"
      ]);
      WebImporter.DOMUtils.remove(element, [".experiencefragment .separator:has(+ .byline)"]);
      element.querySelectorAll(".breadcrumb + main.container :is(h1, h2, h3, h4, h5, h6) :is(b, strong)").forEach((b) => b.replaceWith(...b.childNodes));
      element.querySelectorAll(".button.cmp-button--primary > a.cmp-button").forEach((a) => {
        if (a.closest("strong")) return;
        const strong = element.ownerDocument.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        "footer.cmp-experiencefragment--footer",
        ".sign-in-buttons",
        ".languagenavigation",
        ".search.cmp-search--header",
        ".navigation.cmp-navigation--header",
        "#toggleNav",
        "#mobileNav"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".cmp-carousel__actions",
        ".cmp-carousel__indicators"
      ]);
      WebImporter.DOMUtils.remove(element, ["div.separator"]);
      WebImporter.DOMUtils.remove(element, ["iframe", "link", "noscript", "meta", "script", "style"]);
      element.querySelectorAll("[data-cmp-data-layer], [data-cmp-clickable]").forEach((el) => {
        el.removeAttribute("data-cmp-data-layer");
        el.removeAttribute("data-cmp-clickable");
      });
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const m = href.match(/^(?:https?:\/\/(?:www\.)?wknd\.site)?(\/[^?#]*?)\.html([?#].*)?$/);
        if (m) a.setAttribute("href", `${m[1]}${m[2] || ""}`);
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2 && !sections.some((s) => s.style)) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      const sectionEls = sections.map((section) => querySection(element, section.selector));
      const firstIdx = sectionEls.findIndex(Boolean);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === firstIdx && !section.style) continue;
        const sectionEl = sectionEls[i];
        if (!sectionEl) continue;
        const hr = doc.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-adventures-2.js
  var parsers = {
    "hero-teaser": parse,
    "cards-filter": parse2
  };
  var PAGE_TEMPLATE = {
    "name": "adventures-2",
    "description": "WKND Adventures landing page",
    "urls": [
      "https://wknd.site/us/en/adventures.html"
    ],
    "blocks": [
      {
        "name": "hero-teaser",
        "instances": [
          ".teaser.cmp-teaser--hero"
        ]
      },
      {
        "name": "cards-filter",
        "instances": [
          "main .tabs.panelcontainer"
        ]
      }
    ],
    "sections": [
      {
        "id": "section-1",
        "name": "Page title",
        "selector": [
          "main.cmp-layout-container--fixed:has(~ .teaser.cmp-teaser--hero)"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "main.cmp-layout-container--fixed:has(~ .teaser.cmp-teaser--hero) .title"
        ]
      },
      {
        "id": "section-2",
        "name": "Intro teaser",
        "selector": [
          ".teaser.cmp-teaser--hero"
        ],
        "style": null,
        "blocks": [
          "hero-teaser"
        ],
        "defaultContent": []
      },
      {
        "id": "section-3",
        "name": "Current Adventures",
        "selector": [
          ".teaser.cmp-teaser--hero ~ main.cmp-layout-container--fixed"
        ],
        "style": "separator",
        "blocks": [
          "cards-filter"
        ],
        "defaultContent": [
          ".teaser.cmp-teaser--hero ~ main.cmp-layout-container--fixed .title.cmp-title--underline"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && (PAGE_TEMPLATE.sections.length > 1 || PAGE_TEMPLATE.sections.some((s) => s.style)) ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function addPageMetadata(main, document2, originalURL) {
    const pagePath = new URL(originalURL).pathname.replace(/\.html?$/, "");
    const entries = Object.entries(wknd_page_data_default[pagePath] || {}).filter(([, v]) => v);
    if (!entries.length) return;
    const table = [...main.querySelectorAll("table")].find((t) => {
      var _a;
      return (((_a = t.querySelector("tr")) == null ? void 0 : _a.textContent) || "").trim().toLowerCase() === "metadata";
    });
    if (!table) return;
    const body = table.tBodies[0] || table;
    entries.forEach(([key, value]) => {
      const tr = document2.createElement("tr");
      [key, value].forEach((text) => {
        const td = document2.createElement("td");
        td.textContent = text;
        tr.append(td);
      });
      body.append(tr);
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_adventures_2_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      addPageMetadata(main, document2, params.originalURL);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_adventures_2_exports);
})();
