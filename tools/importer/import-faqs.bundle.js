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

  // tools/importer/import-faqs.js
  var import_faqs_exports = {};
  __export(import_faqs_exports, {
    default: () => import_faqs_default
  });

  // tools/importer/parsers/accordion-faq.js
  var INLINE_FORMAT = "b, strong, em, i, u";
  function normalizeWhitespace(root) {
    const doc = root.ownerDocument;
    const walker = doc.createTreeWalker(
      root,
      4
      /* NodeFilter.SHOW_TEXT */
    );
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      t.textContent = t.textContent.replace(/\u00a0/g, " ").replace(/[ \t]{2,}/g, " ");
    });
    root.querySelectorAll(INLINE_FORMAT).forEach((el) => {
      const text = el.textContent;
      if (!text.trim()) {
        if (!el.querySelector("img, picture, a")) el.replaceWith(doc.createTextNode(text ? " " : ""));
        return;
      }
      const first = el.firstChild;
      if (first && first.nodeType === 3 && /^\s/.test(first.textContent)) {
        first.textContent = first.textContent.replace(/^\s+/, "");
        el.before(doc.createTextNode(" "));
      }
      const last = el.lastChild;
      if (last && last.nodeType === 3 && /\s$/.test(last.textContent)) {
        last.textContent = last.textContent.replace(/\s+$/, "");
        el.after(doc.createTextNode(" "));
      }
    });
    root.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").forEach((el) => {
      const first = el.firstChild;
      if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, "");
      const last = el.lastChild;
      if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, "");
    });
  }
  function removeEmpty(root) {
    root.querySelectorAll("h1, h2, h3, h4, h5, h6, p").forEach((el) => {
      if (!el.textContent.replace(/\u00a0/g, " ").trim() && !el.querySelector("img, picture, video, iframe, a[href]")) {
        el.remove();
      }
    });
  }
  function getQuestion(item, document2) {
    const titleEl = item.querySelector(".cmp-accordion__title") || item.querySelector(".cmp-accordion__button") || item.querySelector(".cmp-accordion__header") || item.querySelector("button, h2, h3, h4");
    const text = titleEl ? titleEl.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() : "";
    if (!text) return null;
    const p = document2.createElement("p");
    p.textContent = text;
    return p;
  }
  function getAnswer(item, document2) {
    const panel = item.querySelector(".cmp-accordion__panel") || item.querySelector('[role="region"]');
    if (!panel) return null;
    const sources = [...panel.querySelectorAll(".cmp-text")];
    const container = document2.createElement("div");
    if (sources.length) {
      sources.forEach((src) => container.append(...src.childNodes));
    } else {
      container.append(...panel.childNodes);
    }
    normalizeWhitespace(container);
    removeEmpty(container);
    const nodes = [...container.childNodes].filter(
      (n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim()
    );
    return nodes.length ? nodes : null;
  }
  function parse(element, { document: document2 }) {
    let items = [...element.querySelectorAll(".cmp-accordion__item")];
    if (!items.length) {
      items = [...element.querySelectorAll(".cmp-accordion__header")].map((h) => h.parentElement).filter(Boolean);
    }
    const cells = [];
    items.forEach((item) => {
      const question = getQuestion(item, document2);
      if (!question) return;
      const answer = getAnswer(item, document2);
      cells.push([question, answer || ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/data/wknd-page-data.js
  var wknd_page_data_default = {
    "/us/en/adventures/bali-surf-camp": {
      Categories: "Surfing"
    },
    "/us/en/adventures/beervana-portland": {
      Categories: "Travel"
    },
    "/us/en/adventures/climbing-new-zealand": {
      Categories: "Climbing"
    },
    "/us/en/adventures/colorado-rock-climbing": {
      Categories: "Climbing"
    },
    "/us/en/adventures/cycling-tuscany": {
      Categories: "Cycling, Travel"
    },
    "/us/en/adventures/downhill-skiing-wyoming": {
      Categories: "Skiing"
    },
    "/us/en/adventures/gastronomic-marais-tour": {
      Categories: "Travel"
    },
    "/us/en/adventures/napa-wine-tasting": {
      Categories: "Travel"
    },
    "/us/en/adventures/riverside-camping-australia": {
      Categories: "Travel"
    },
    "/us/en/adventures/ski-touring-mont-blanc": {
      Categories: "Skiing"
    },
    "/us/en/adventures/surf-camp-costa-rica": {
      Categories: "Surfing"
    },
    "/us/en/adventures/tahoe-skiing": {
      Categories: "Skiing"
    },
    "/us/en/adventures/west-coast-cycling": {
      Categories: "Cycling"
    },
    "/us/en/adventures/whistler-mountain-biking": {
      Categories: "Cycling"
    },
    "/us/en/adventures/yosemite-backpacking": {
      Categories: "Travel"
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
  function transform(hookName, element) {
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
      WebImporter.DOMUtils.remove(element, [
        "iframe",
        "link",
        "noscript",
        "meta",
        "script",
        "style"
      ]);
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
    return list.reduce((found, sel) => found || sel && root.querySelector(sel) || null, null);
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
        const sectionEl = sectionEls[i];
        if (sectionEl && (i !== firstIdx || section.style)) {
          const hr = doc.createElement("hr");
          if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
          sectionEl.before(hr);
        }
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = section.style && element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = section.style && (marker || querySection(element, section.selector));
        if (anchor) {
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
  }

  // tools/importer/import-faqs.js
  var parsers = {
    "accordion-faq": parse
  };
  var PAGE_TEMPLATE = {
    name: "faqs",
    description: "WKND FAQs page",
    urls: [
      "https://wknd.site/us/en/faqs.html"
    ],
    blocks: [
      {
        name: "accordion-faq",
        instances: [
          "main .accordion"
        ]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "FAQs with help sidebar",
        selector: [
          "main .aem-Grid > .container.aem-GridColumn--default--8"
        ],
        style: "article-sidebar, title-underline",
        blocks: [
          "accordion-faq"
        ],
        defaultContent: [
          "main .aem-GridColumn--default--8 .title",
          "main .aem-GridColumn--default--8 .image",
          "main .aem-GridColumn--default--8 .text",
          "main .aem-GridColumn--default--3 .title",
          "main .aem-GridColumn--default--3 .text"
        ]
      }
    ]
  };
  var useSections = PAGE_TEMPLATE.sections && (PAGE_TEMPLATE.sections.length > 1 || PAGE_TEMPLATE.sections.some((s) => s.style));
  var transformers = [
    transform,
    ...useSections ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload, issues) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        issues.push(`Transformer failed at ${hookName}: ${e.message}`);
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
  function findBlocksOnPage(document2, template, issues) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          issues.push(`Block "${blockDef.name}" selector not found: ${selector}`);
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
    return pageBlocks;
  }
  var import_faqs_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      const issues = [];
      executeTransformers("beforeTransform", main, payload, issues);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE, issues);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            issues.push(`Failed to parse ${block.name} (${block.selector}): ${e.message}`);
          }
        } else {
          issues.push(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload, issues);
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
          blocks: pageBlocks.map((b) => b.name),
          issues
        }
      }];
    }
  };
  return __toCommonJS(import_faqs_exports);
})();
