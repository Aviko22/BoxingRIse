# BoxingRise

One-page site for BoxingRise, private one-on-one boxing coaching. Hebrew (default, RTL) and English (LTR). Static HTML, CSS and JavaScript with no framework or dependencies, deployed on Vercel.

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
- `vercel.json`: clean URLs and cache headers.

## Analytics

Vercel Web Analytics loads only after the visitor allows it in the cookie banner. To turn it on, enable Web Analytics for the project in the Vercel dashboard.
