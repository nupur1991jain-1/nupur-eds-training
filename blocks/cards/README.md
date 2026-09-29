# Cards

Standard boilerplate cards, plus WKND variants. A variant is chosen by the block name in
Document Authoring, e.g. **Cards (Article)** → `<div class="cards article">`.

`cards.js` looks for a variant class and loads that variant's `<variant>.js` and `<variant>.css`
from this folder (only when a page uses it). Without a variant class it renders the standard
cards; the base rules in `cards.css` are scoped with `:not(<variants>)` so they never style a
variant.

## Listing variants (driven by the site index)

Article, Filter and Upnext can be authored as a settings table instead of cards. Rows are
rendered from `/query-index.json` by `scripts/listing.js`, so new pages appear without editing
the listing:

| Key | Value |
| --- | --- |
| Source | folder to list, e.g. `/us/en/magazine/` |
| Sort | `title`, `title desc` or `recent` |
| Limit | optional number of items |
| Exclude Current | optional `true` to leave out the page being viewed |

## Variants

| Block name | Purpose | Authored rows (when not a settings table) |
| --- | --- | --- |
| Cards | Standard cards | image \| text |
| Cards (Article) | Article/adventure teaser grid | image \| bold title link, description |
| Cards (Filter) | Adventure grid with category filter buttons | image \| heading link, description \| comma-separated categories (from page `Categories` metadata in listing mode) |
| Cards (Upnext) | "Up next" related-articles list | title link \| date (from `Publication Date` metadata in listing mode) |
| Cards (Contributor) | People grid | avatar image \| name heading, role, one paragraph per social link |
| Cards (Members) | Locked members-only teasers | image \| title heading, description, "Read More" label (rendered disabled) |
