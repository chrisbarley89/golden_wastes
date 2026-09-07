# Lore and Rules front pages

Hugo builds Lore at `/` and Rules at `/rules/`. The switch below the subtitle links between these URLs and marks the current page. It works without JavaScript and supports browser history and direct links.

Both templates render `layouts/_partials/home/front-page.html`. The hero, random facts, timeline, map, About text and contact area are shared. Edit the About text in `content/_index.md` to update both pages. Existing article and category URLs stay the same.

## Category tiles

Set `home_mode` in `content/categories/<category>/_index.md`:

```yaml
home_mode: lore
```

Allowed values are `lore`, `rules`, and `both`. Missing values default to `lore`; invalid values fail the build. This field is also available as **Front page membership** in Pages CMS under **Category portals**.

Initial assignments:

| Category | Front pages |
| --- | --- |
| Lore, Location | Lore |
| Class, Item | Rules |
| Campaign, Monster | Both |

Tiles are discovered from Hugo's category taxonomy and sorted alphabetically. A category needs at least one published, non-placeholder article. Placeholder categories are hidden. Tile images continue to come from `[params.smallTiles.images]` in `hugo.toml`. New categories require no template edits.

## Featured big tiles

Edit the separate lists in `hugo.toml`:

```toml
[params.homeViews.rules]
count = 3
pages = ["/campaign/how-to-play", "/class/fighter", "/item/shield"]
```

`[params.homeViews.lore]` works identically. List page paths in display order and set `count` to the maximum number of tiles. Set it to `0` to hide the Featured section. Add a page to both lists to feature it on both front pages.

A featured page must belong to at least one category matching the current mode (including `both`). Hugo skips missing, draft, placeholder, duplicate, or mismatched pages before applying the count. Missing and mismatched entries produce build warnings. Fewer eligible entries means fewer tiles; Hugo does not fill the remaining places with random articles.

`[params.bigTiles]` retains the shared excerpt length and category-specific tile templates. Unmapped categories use the shared image-card styling. Featured lists and counts are edited in `hugo.toml`; category assignments can be edited in Pages CMS.

Run `npm run build` to rebuild the site and search index. These settings are resolved at build time, so content/configuration changes take effect after the next build and deployment.
