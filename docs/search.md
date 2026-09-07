# Hiding pages from search

Search visibility is controlled only by each page's `searchHidden` front-matter field. There is no URL blacklist in `hugo.toml`.

In YAML front matter (`---`), use:

```yaml
searchHidden: true
```

In TOML front matter (`+++`), use:

```toml
searchHidden = true
```

Set it to `false`, or remove the field, to make a published page searchable again. New pages default to searchable. In Pages CMS, use **Hide from search** on the page's editing form. Both front pages have this enabled: `content/_index.md` (Home page) and `content/rules/_index.md` (Rules home page).

The setting follows the page if its URL changes. It hides only that page from site search; links, page content, category membership, and child pages are unaffected. It does not control external search engines. Draft and placeholder pages retain their existing publishing behavior.

Run `npm run build` after changing the setting to regenerate Hugo pages and the Pagefind index in `public/pagefind`. Hugo's development server alone does not rebuild the search index. Refresh your browser afterward, and deploy the rebuilt site and index for production.

The shared base layout marks searchable pages with `data-pagefind-body` and hidden pages with `data-pagefind-ignore="all"`. Redirect-only pages remain outside the index. See [Pagefind's indexing documentation](https://pagefind.app/docs/indexing/) for the underlying attributes.
