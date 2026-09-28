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

  // tools/importer/import-about-us.js
  var import_about_us_exports = {};
  __export(import_about_us_exports, {
    default: () => import_about_us_default
  });

  // tools/importer/parsers/cards-contributor.js
  var ITEM_CLASS = "cmp-experience-fragment--contributor";
  function pickFromSrcset(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : "";
  }
  function isUsableSrc(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage(container, document2, fallbackAlt) {
    if (!container) return null;
    let img = container.querySelector("img");
    const cmp = container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      src = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        pickFromSrcset(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ].find(isUsableSrc) || "";
    }
    if (!src && cmp) src = (cmp.getAttribute("data-cmp-src") || "").replace("{.width}", ".1600");
    if (!src) {
      const ns = container.querySelector("noscript");
      const m = ns && /src=["']([^"']+)["']/i.exec(ns.textContent || ns.innerHTML || "");
      if (m && isUsableSrc(m[1])) src = m[1];
    }
    if (!src) return null;
    if (!img) img = document2.createElement("img");
    const alt = img.getAttribute("alt") || cmp && cmp.getAttribute("data-cmp-alt") || fallbackAlt || "";
    img.setAttribute("src", src);
    img.setAttribute("alt", alt);
    img.removeAttribute("srcset");
    img.removeAttribute("data-src");
    img.removeAttribute("loading");
    return img;
  }
  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
  function socialLabel(a) {
    const textEl = a.querySelector(".cmp-button__text");
    let label = (textEl ? textEl.textContent : a.textContent).replace(/\s+/g, " ").trim();
    if (!label) label = (a.getAttribute("aria-label") || a.getAttribute("title") || "").trim();
    if (!label) {
      const icon = a.querySelector('[class*="cmp-button__icon--"]');
      const m = icon && /cmp-button__icon--([a-z0-9-]+)/i.exec(icon.className);
      if (m) label = capitalize(m[1]);
    }
    return label;
  }
  function buildRow(section, document2) {
    const text = [];
    const titles = Array.from(section.querySelectorAll(".cmp-title__text, h1, h2, h3, h4, h5, h6")).filter((el, i, arr) => arr.indexOf(el) === i && !arr.some((o) => o !== el && o.contains(el)));
    const nameEl = section.querySelector("h3.cmp-title__text") || titles[0];
    const nameText = nameEl ? nameEl.textContent.replace(/\s+/g, " ").trim() : "";
    const imageWrap = section.querySelector(".cmp-image") || section.querySelector(".image");
    const image = resolveImage(imageWrap, document2, nameText);
    if (nameText) {
      const h = document2.createElement("h3");
      h.textContent = nameText;
      text.push(h);
    }
    titles.filter((el) => el !== nameEl).forEach((el) => {
      const t = el.textContent.replace(/\s+/g, " ").trim();
      if (!t) return;
      const p = document2.createElement("p");
      p.textContent = t;
      text.push(p);
    });
    const links = Array.from(section.querySelectorAll("a.cmp-button[href], .cmp-buildingblock--btn-list a[href]")).filter((a, i, arr) => arr.indexOf(a) === i);
    links.forEach((a) => {
      const label = socialLabel(a);
      if (!label) return;
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = label;
      p.append(link);
      text.push(p);
    });
    if (!image && !text.length) return null;
    return [image || "", text.length ? text : ""];
  }
  function parse(element, { document: document2 }) {
    if (!element.parentNode) return;
    const group = [element];
    let next = element.nextElementSibling;
    while (next && next.classList && next.classList.contains(ITEM_CLASS)) {
      group.push(next);
      next = next.nextElementSibling;
    }
    const cells = [];
    group.forEach((section) => {
      const row = buildRow(section, document2);
      if (row) cells.push(row);
    });
    group.slice(1).forEach((el) => el.remove());
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-contributor", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-featured.js
  function pickFromSrcset2(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : "";
  }
  function isUsableSrc2(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage2(container, document2) {
    if (!container) return null;
    let img = container.querySelector("img");
    const cmp = container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      src = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        pickFromSrcset2(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ].find(isUsableSrc2) || "";
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
  function parse2(element, { document: document2 }) {
    const content = element.querySelector(".cmp-teaser__content");
    const imageWrap = element.querySelector(".cmp-teaser__image") || element.querySelector(".cmp-image");
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
    const image = resolveImage2(imageWrap, document2);
    if (!textCell.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", image || ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function pickFromSrcset3(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : "";
  }
  function isUsableSrc3(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage3(container, document2, fallbackAlt) {
    if (!container) return null;
    let img = container.querySelector("img");
    const cmp = container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      src = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        pickFromSrcset3(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ].find(isUsableSrc3) || "";
    }
    if (!src && cmp) src = (cmp.getAttribute("data-cmp-src") || "").replace("{.width}", ".1600");
    if (!src) return img || null;
    if (!img) {
      img = document2.createElement("img");
      img.setAttribute("alt", cmp && cmp.getAttribute("data-cmp-alt") || fallbackAlt || "");
    }
    img.setAttribute("src", src);
    img.removeAttribute("srcset");
    img.removeAttribute("loading");
    return img;
  }
  function parse3(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".cmp-image-list__item-content"));
    if (!items.length) items = Array.from(element.querySelectorAll(".cmp-image-list__item, li"));
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".cmp-image-list__item-title");
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      const titleLink = item.querySelector("a.cmp-image-list__item-title-link") || item.querySelector("a.cmp-image-list__item-image-link") || item.querySelector("a[href]");
      const href = titleLink ? titleLink.getAttribute("href") : "";
      const imageWrap = item.querySelector(".cmp-image-list__item-image") || item.querySelector(".cmp-image");
      const image = resolveImage3(imageWrap, document2, titleText);
      const body = [];
      if (titleText) {
        const p = document2.createElement("p");
        const strong = document2.createElement("strong");
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = titleText;
          strong.append(a);
        } else {
          strong.textContent = titleText;
        }
        p.append(strong);
        body.push(p);
      }
      const desc = item.querySelector(".cmp-image-list__item-description");
      if (desc && desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        body.push(p);
      }
      if (!image && !body.length) return;
      cells.push([image || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-members.js
  function pickFromSrcset4(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : "";
  }
  function isUsableSrc4(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function resolveImage4(container, document2, fallbackAlt) {
    if (!container) return null;
    let img = container.querySelector("img");
    const cmp = container.matches("[data-cmp-src]") ? container : container.querySelector("[data-cmp-src]");
    let src = "";
    if (img) {
      src = [
        img.getAttribute("src"),
        img.getAttribute("data-src"),
        pickFromSrcset4(img.getAttribute("srcset") || img.getAttribute("data-srcset"))
      ].find(isUsableSrc4) || "";
    }
    if (!src && cmp) src = (cmp.getAttribute("data-cmp-src") || "").replace("{.width}", ".1600");
    if (!src) {
      const ns = container.querySelector("noscript");
      const m = ns && /src=["']([^"']+)["']/i.exec(ns.textContent || ns.innerHTML || "");
      if (m && isUsableSrc4(m[1])) src = m[1];
    }
    if (!src) return null;
    if (!img) img = document2.createElement("img");
    const alt = img.getAttribute("alt") || cmp && cmp.getAttribute("data-cmp-alt") || fallbackAlt || "";
    img.setAttribute("src", src);
    img.setAttribute("alt", alt);
    img.removeAttribute("srcset");
    img.removeAttribute("data-src");
    img.removeAttribute("loading");
    return img;
  }
  function isSecureTeaser(el) {
    return !!(el && el.classList && el.classList.contains("teaser") && el.classList.contains("cmp-teaser--secure"));
  }
  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }
  function buildRow2(teaser, document2) {
    const content = teaser.querySelector(".cmp-teaser__content") || teaser;
    const text = [];
    const pretitle = content.querySelector(".cmp-teaser__pretitle");
    if (pretitle && clean(pretitle.textContent)) {
      const p = document2.createElement("p");
      p.textContent = clean(pretitle.textContent);
      text.push(p);
    }
    const titleEl = content.querySelector(".cmp-teaser__title") || content.querySelector("h1, h2, h3, h4");
    const titleText = titleEl ? clean(titleEl.textContent) : "";
    if (titleText) {
      const h = document2.createElement("h2");
      h.textContent = titleText;
      text.push(h);
    }
    const desc = content.querySelector(".cmp-teaser__description");
    if (desc && clean(desc.textContent)) {
      const paras = Array.from(desc.querySelectorAll("p")).filter((p) => clean(p.textContent));
      if (paras.length) {
        paras.forEach((p) => {
          const np = document2.createElement("p");
          np.textContent = clean(p.textContent);
          text.push(np);
        });
      } else {
        const p = document2.createElement("p");
        p.textContent = clean(desc.textContent);
        text.push(p);
      }
    }
    const action = content.querySelector(".cmp-teaser__action-container");
    if (action) {
      const links = Array.from(action.querySelectorAll("a, .cmp-teaser__action-link"));
      const labels = links.length ? links.map((a) => clean(a.textContent)) : [clean(action.textContent)];
      labels.filter(Boolean).forEach((label) => {
        const p = document2.createElement("p");
        p.textContent = label;
        text.push(p);
      });
    }
    const imageWrap = teaser.querySelector(".cmp-teaser__image") || teaser.querySelector(".cmp-image");
    const image = resolveImage4(imageWrap, document2, titleText);
    if (!image && !text.length) return null;
    return [image || "", text.length ? text : ""];
  }
  function parse4(element, { document: document2 }) {
    if (!element.parentNode) return;
    const group = [element];
    let next = element.nextElementSibling;
    while (isSecureTeaser(next)) {
      group.push(next);
      next = next.nextElementSibling;
    }
    const cells = [];
    group.forEach((teaser) => {
      const row = buildRow2(teaser, document2);
      if (row) cells.push(row);
    });
    group.slice(1).forEach((el) => el.remove());
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-members", cells });
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
      WebImporter.DOMUtils.remove(element, [".experiencefragment .separator:has(+ .byline)"]);
      element.querySelectorAll(".breadcrumb + main.container :is(h1, h2, h3, h4, h5, h6) :is(b, strong)").forEach((b) => b.replaceWith(...b.childNodes));
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

  // tools/importer/import-about-us.js
  var parsers = {
    "cards-contributor": parse,
    "columns-featured": parse2,
    "cards-article": parse3,
    "cards-members": parse4
  };
  var PAGE_TEMPLATE = {
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
        "style": null,
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
  var import_about_us_default = {
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
  return __toCommonJS(import_about_us_exports);
})();
