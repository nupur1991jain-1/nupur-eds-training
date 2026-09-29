# Columns

Standard boilerplate columns, plus WKND variants. A variant is chosen by the block name in
Document Authoring, e.g. **Columns (Featured)** → `<div class="columns featured">`.

`columns.js` looks for a variant class and loads that variant's `<variant>.js` and
`<variant>.css` from this folder (only when a page uses it). Without a variant class it renders
the standard columns; the base rules in `columns.css` are scoped with `:not(<variants>)` so they
never style a variant.

## Variants

| Block name | Purpose | Authored content |
| --- | --- | --- |
| Columns | Standard columns | any number of cells per row |
| Columns (Author) | Article author bio | one row: avatar image, name heading, job title \| one paragraph per social link |
| Columns (Featured) | Featured article teaser (grey panel beside a large image) | one row: image \| eyebrow paragraph, heading, text, button link |
