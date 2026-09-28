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

  // tools/importer/import-adventures.js
  var import_adventures_exports = {};
  __export(import_adventures_exports, {
    default: () => import_adventures_default
  });

  // tools/importer/parsers/breadcrumb.js
  function parse(element, { document: document2 }) {
    const trail = element.querySelector(".cmp-breadcrumb__list, nav.cmp-breadcrumb, ol, ul");
    if (!trail) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "breadcrumb", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-gallery.js
  function pickFromSrcset(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    if (!entries.length) return "";
    return entries[entries.length - 1].split(/\s+/)[0];
  }
  function isUsableSrc(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage(container, document2) {
    if (!container) return null;
    let img = container.querySelector("img");
    const cmp = container.matches && container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      const candidates = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        img.getAttribute("data-lazy-src"),
        pickFromSrcset(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ];
      src = candidates.find(isUsableSrc) || "";
    }
    if (!src && cmp) {
      const tpl = cmp.getAttribute("data-cmp-src") || "";
      if (tpl) src = tpl.replace("{.width}", ".1600");
    }
    if (!src) {
      const noscript = container.querySelector("noscript");
      if (noscript) {
        const m = /src=["']([^"']+)["']/i.exec(noscript.textContent || noscript.innerHTML || "");
        if (m) src = m[1];
      }
    }
    if (!src) return null;
    if (!img) {
      img = document2.createElement("img");
      const alt = cmp && (cmp.getAttribute("data-cmp-alt") || cmp.getAttribute("data-title")) || "";
      img.setAttribute("alt", alt);
    }
    img.setAttribute("src", src);
    img.removeAttribute("srcset");
    img.removeAttribute("data-src");
    img.removeAttribute("loading");
    return img;
  }
  function parse2(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    if (!slides.length) slides = Array.from(element.querySelectorAll('[role="tabpanel"]'));
    if (!slides.length) slides = Array.from(element.querySelectorAll(".cmp-image"));
    const cells = [];
    const seenSrc = /* @__PURE__ */ new Set();
    slides.forEach((slide) => {
      const imageWrap = slide.querySelector(".cmp-image") || slide;
      const img = resolveImage(imageWrap, document2);
      if (!img) return;
      const src = img.getAttribute("src");
      if (seenSrc.has(src)) return;
      seenSrc.add(src);
      cells.push([img]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-trip-facts.js
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function parse3(element, { document: document2 }) {
    let pairs = Array.from(element.querySelectorAll(".cmp-contentfragment__element")).map((el) => ({
      label: el.querySelector("dt, .cmp-contentfragment__element-title"),
      value: el.querySelector("dd, .cmp-contentfragment__element-value")
    }));
    if (!pairs.length) {
      pairs = Array.from(element.querySelectorAll("dt")).map((dt) => {
        let dd = dt.nextElementSibling;
        while (dd && dd.tagName !== "DD") dd = dd.nextElementSibling;
        return { label: dt, value: dd };
      });
    }
    const cells = [];
    pairs.forEach(({ label, value }) => {
      const labelText = clean(label && label.textContent);
      if (!labelText) return;
      let valueCell = "";
      if (value) {
        if (value.querySelector("a, img, picture, p, ul, ol")) {
          valueCell = Array.from(value.childNodes);
        } else {
          valueCell = clean(value.textContent);
        }
      }
      cells.push([labelText, valueCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-trip-facts", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-adventure.js
  var CONTENT_TAGS = /* @__PURE__ */ new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "UL", "OL", "TABLE", "BLOCKQUOTE", "PRE"]);
  function pickFromSrcset2(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    if (!entries.length) return "";
    return entries[entries.length - 1].split(/\s+/)[0];
  }
  function isUsableSrc2(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage2(container, document2) {
    if (!container) return null;
    let img = container.tagName === "IMG" ? container : container.querySelector("img");
    const cmp = container.matches && container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      const candidates = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        img.getAttribute("data-lazy-src"),
        pickFromSrcset2(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ];
      src = candidates.find(isUsableSrc2) || "";
    }
    if (!src && cmp) {
      const tpl = cmp.getAttribute("data-cmp-src") || "";
      if (tpl) src = tpl.replace("{.width}", ".1600");
    }
    if (!src && container.querySelector) {
      const noscript = container.querySelector("noscript");
      if (noscript) {
        const m = /src=["']([^"']+)["']/i.exec(noscript.textContent || noscript.innerHTML || "");
        if (m) src = m[1];
      }
    }
    if (!src) return null;
    if (!img) {
      img = document2.createElement("img");
      const alt = cmp && (cmp.getAttribute("data-cmp-alt") || cmp.getAttribute("data-title")) || "";
      img.setAttribute("alt", alt);
    }
    img.setAttribute("src", src);
    img.removeAttribute("srcset");
    img.removeAttribute("data-src");
    img.removeAttribute("loading");
    return img;
  }
  function hasContent(el) {
    return !!(el.textContent || "").replace(/ /g, " ").trim() || !!el.querySelector("img, picture");
  }
  function collectContent(node, document2, out) {
    Array.from(node.children).forEach((child) => {
      if (child.matches("h3.cmp-contentfragment__title, script, style, noscript, meta, link, button")) return;
      if (child.matches(".cmp-image, .image") || child.tagName === "IMG" || child.tagName === "PICTURE") {
        const img = resolveImage2(child, document2);
        if (img) out.push(img);
        return;
      }
      if (CONTENT_TAGS.has(child.tagName)) {
        if (!hasContent(child)) return;
        if (/^H[1-6]$/.test(child.tagName)) {
          child.querySelectorAll(":scope > b, :scope > strong").forEach((b) => b.replaceWith(...b.childNodes));
        }
        out.push(child);
        return;
      }
      collectContent(child, document2, out);
    });
  }
  function parse4(element, { document: document2 }) {
    const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab, [role="tab"]'));
    let panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    if (!panels.length) panels = Array.from(element.querySelectorAll('[role="tabpanel"]'));
    const cells = [];
    panels.forEach((panel, idx) => {
      let tab = null;
      if (panel.id) {
        const base = panel.id.replace(/panel$/, "");
        tab = tabs.find((t) => t.id === base || t.getAttribute("aria-controls") === panel.id) || null;
      }
      if (!tab) tab = tabs[idx] || null;
      const label = tab ? tab.textContent.replace(/\s+/g, " ").trim() : "";
      const content = [];
      collectContent(panel, document2, content);
      if (!label && !content.length) return;
      cells.push([label || `Tab ${idx + 1}`, content.length ? content : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-adventure", cells });
    element.replaceWith(block);
  }

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
    if (sections.length < 2) return;
    const doc = element.ownerDocument || document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
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

  // tools/importer/import-adventures.js
  var parsers = {
    "breadcrumb": parse,
    "carousel-gallery": parse2,
    "table-trip-facts": parse3,
    "tabs-adventure": parse4
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
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
  var import_adventures_default = {
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
  return __toCommonJS(import_adventures_exports);
})();
