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

  // tools/importer/import-magazine.js
  var import_magazine_exports = {};
  __export(import_magazine_exports, {
    default: () => import_magazine_default
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

  // tools/importer/parsers/columns-author.js
  function pickFromSrcset(srcset) {
    if (!srcset) return "";
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    return entries.length ? entries[entries.length - 1].split(/\s+/)[0] : "";
  }
  function isUsableSrc(src) {
    return !!src && !src.startsWith("data:") && !/placeholder|blank\.gif/i.test(src);
  }
  function srcFromNoscript(container) {
    const ns = container.querySelector("noscript");
    if (!ns) return "";
    const m = (ns.textContent || ns.innerHTML || "").match(/src=["']([^"']+)["']/i);
    return m ? m[1] : "";
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
    if (!src) src = srcFromNoscript(container);
    if (!src) return null;
    if (!img) {
      img = document2.createElement("img");
      img.setAttribute("alt", cmp && cmp.getAttribute("data-cmp-alt") || fallbackAlt || "");
    }
    img.setAttribute("src", src);
    img.removeAttribute("srcset");
    img.removeAttribute("data-src");
    img.removeAttribute("loading");
    return img;
  }
  function parse2(element, { document: document2 }) {
    const byline = element.querySelector(".cmp-byline") || element.querySelector(".byline") || element;
    const nameEl = byline.querySelector(".cmp-byline__name") || byline.querySelector("h1, h2, h3, h4, h5, h6");
    const nameText = nameEl ? nameEl.textContent.trim() : "";
    const roleEl = byline.querySelector(".cmp-byline__occupations") || (nameEl && nameEl.nextElementSibling && nameEl.nextElementSibling.tagName === "P" ? nameEl.nextElementSibling : null);
    const roleText = roleEl ? roleEl.textContent.trim() : "";
    const imageWrap = byline.querySelector(".cmp-byline__image") || byline.querySelector(".cmp-image") || byline;
    const avatar = resolveImage(imageWrap, document2, nameText);
    if (avatar && !avatar.getAttribute("alt") && nameText) avatar.setAttribute("alt", nameText);
    const profile = [];
    if (avatar) profile.push(avatar);
    if (nameText) {
      const h = document2.createElement("h2");
      h.textContent = nameText;
      profile.push(h);
    }
    if (roleText) {
      const p = document2.createElement("p");
      p.textContent = roleText;
      profile.push(p);
    }
    let socialAnchors = Array.from(element.querySelectorAll(".cmp-buildingblock--btn-list .button")).map((wrap) => wrap.querySelector("a[href]")).filter(Boolean);
    if (!socialAnchors.length) {
      socialAnchors = Array.from(element.querySelectorAll("a.cmp-button[href], .cmp-buildingblock--btn-list a[href]"));
    }
    const social = [];
    socialAnchors.forEach((a) => {
      const labelEl = a.querySelector(".cmp-button__text");
      let label = (labelEl ? labelEl.textContent : a.textContent).trim();
      if (!label) {
        const icon = a.querySelector('[class*="cmp-button__icon--"]');
        const m = icon && icon.className.match(/cmp-button__icon--([\w-]+)/);
        label = m && m[1] ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : a.getAttribute("aria-label") || "";
      }
      if (!label) return;
      const p = document2.createElement("p");
      const link = document2.createElement("a");
      link.setAttribute("href", a.getAttribute("href") || "#");
      link.textContent = label;
      p.append(link);
      social.push(p);
    });
    if (!profile.length && !social.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[profile.length ? profile : "", social.length ? social : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-author", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-upnext.js
  function parse3(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll("li.cmp-list__item"));
    if (!items.length) items = Array.from(element.querySelectorAll("li"));
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector("a.cmp-list__item-link") || item.querySelector("a[href]");
      const titleEl = item.querySelector(".cmp-list__item-title");
      const dateEl = item.querySelector(".cmp-list__item-date");
      const titleText = (titleEl ? titleEl.textContent : link ? link.textContent : "").trim();
      const dateText = dateEl ? dateEl.textContent.trim() : "";
      if (!titleText && !dateText) return;
      const content = [];
      if (titleText) {
        const p = document2.createElement("p");
        const href = link ? link.getAttribute("href") : "";
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = titleText;
          p.append(a);
        } else {
          p.textContent = titleText;
        }
        content.push(p);
      }
      if (dateText) {
        const p = document2.createElement("p");
        p.textContent = dateText;
        content.push(p);
      }
      cells.push([content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-upnext", cells });
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

  // tools/importer/import-magazine.js
  var parsers = {
    "breadcrumb": parse,
    "columns-author": parse2,
    "cards-upnext": parse3
  };
  var PAGE_TEMPLATE = {
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
  var import_magazine_default = {
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
  return __toCommonJS(import_magazine_exports);
})();
