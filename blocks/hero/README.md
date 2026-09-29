# Hero

Standard boilerplate hero, plus a WKND variant. A variant is chosen by the block name in
Document Authoring: **Hero (Teaser)** → `<div class="hero teaser">`.

`hero.js` looks for a variant class and loads that variant's `<variant>.js` and `<variant>.css`
from this folder (only when a page uses it). The standard hero needs no JavaScript; its rules in
`hero.css` are scoped with `:not(<variants>)` so they never style a variant.

## Variants

| Block name | Purpose | Authored content |
| --- | --- | --- |
| Hero | Standard hero (image behind a heading) | image and heading |
| Hero (Teaser) | Full-width image with a white text panel overlapping its bottom edge (loads eagerly when it leads the page) | two rows: image, then heading, text and optional button link |
