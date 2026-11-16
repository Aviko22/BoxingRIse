# BoxingRise

One-page site for BoxingRise, private one-on-one boxing coaching. Hebrew (default, RTL) and English (LTR). Static HTML, CSS and JavaScript with no framework or dependencies, deployed on Cloudflare Pages (branch `rebuild`). See CLAUDE.md for the full working notes.

## Editing

All text and settings live in `src/`. Edit there, then rebuild:

```
python3 src/build.py
```

- `src/config.json`: WhatsApp number, prefilled messages, trial price, `show_testimonials`, `noindex` (set to `false` on launch day).
- `src/content.py`: every line of copy on the home page, in both languages.
- `src/legal.py`: legal pages and the health declaration form. **These are drafts that need a lawyer's review before launch.**

The build writes `index.html`, `en/index.html`, the legal pages, `config.js`, `sitemap.xml` and `robots.txt`, and creates WebP versions of the photos in `media/opt/`.

## Structure

- `assets/site.css`, `assets/site.js`: styles and behaviour.
- `fonts/`: Heebo, Karantina and Oswald, self-hosted (SIL Open Font License).
- `media/`, `brand/`: photos, the hero video and the logo.
- `_headers`: security and cache headers for Cloudflare Pages, where the site is hosted.

## Analytics

No analytics tool is active (`src/config.json` → `analytics.provider` is `none`). To turn one on, set the provider to `cloudflare` (with a Web Analytics token) or `ga4`; it loads only after the visitor allows it in the cookie banner. Update the privacy policy in `src/legal.py` at the same time.
