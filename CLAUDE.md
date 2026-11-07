# BoxingRise: instructions for Claude

Landing page for BoxingRise, private one-on-one boxing coaching for women in parks in Tel Aviv and central Israel.
Owner and coach: Avi Anihovich (Aviko). **Always answer Avi in Hebrew.**

## The one goal
Every visitor should book a **trial session for 49 ₪ (regular price 250 ₪, confirmed by the owner)** via WhatsApp to **972502734456**.
Everything on the page serves that goal. There is no online payment or booking system. Day and time are only a preference written into the message; the slot is confirmed on WhatsApp.

## Audience and voice
- Women only, 18+, mostly beginners. Hebrew copy addresses her in the feminine form (את, בואי, קובעת).
- Warm, short, confident. No macho tone, no kicks or crowds, no exaggerated promises. Self-defence copy stays realistic ("not a combat course, but a real foundation").
- **Never invent** testimonials, names, photos, prices, qualifications, locations or results. Ask Avi.
- Confirmed facts: 30 years in martial arts and combat sports (10 Muay Thai, 5 classic boxing, black belt in Japanese jiu-jitsu). Locations: Yarkon Park, or a park near her home in the centre. 60-minute sessions. Payment by Bit, PayBox or cash. Three real testimonials (Victoria, Maria, Neta).

## Look
Black and gold luxury with a warm park feel. Hebrew headings: "Assistant Display" (`fonts/assistant-800.woff`); English headings: Bebas Neue; body: Heebo. Gold accents, never gold everywhere.
Two white sections break the dark page: "מכירה את זה?" and "אף פעם לא התאגרפת? מושלם." (class `cream`, now plain white).
Do not change the logo (`brand/`).
Avi likes to choose: for a new visual idea, show several options (a preview switcher on the real page works well), then keep only the one he picks.

## How the site is built
- Static site, no framework, no dependencies. **Edit `src/`, never the generated HTML**, then run `python3 src/build.py`.
  - `src/content.py`: all copy, Hebrew (`HE`) and English (`EN`). Keep both languages in sync.
  - `src/config.json`: WhatsApp number and messages, prices, analytics provider.
  - `src/legal.py`: legal pages and health declaration (drafts; a lawyer still needs to review them).
  - `src/build.py`: templates. Bump `VER` on every CSS/JS change (cache busting).
  - `assets/site.css`, `assets/site.js`: style and behaviour. New CSS usually goes at the end of the file, so check for later rules that override it (several hero rules use `!important`).
- Media: `media/` (videos converted from iPhone HLG with the ffmpeg tonemap chain `zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`).
- Respect `prefers-reduced-motion`, keep one H1 per page, alt text on every image, visible focus states, RTL for Hebrew and LTR for English.

## Hosting and deploy
- GitHub repo `Aviko22/BoxingRIse`. **Branch `rebuild` is the live site**; `main` is the old site, don't use it.
- Cloudflare Pages project `boxingrise`, production branch `rebuild`, no build command (the built files are committed). Pushing to `rebuild` updates https://boxingrise.com within a minute or two. Any other branch gets a preview at `<branch>.boxingrise.pages.dev`.
- Domain at Namecheap, DNS on Cloudflare.
- English home is `/en/` (with the slash; Cloudflare redirects `/en`).
- Analytics: none active yet (`config.json` → `analytics.provider`). Vercel analytics doesn't work on Cloudflare.
- Before working: `git pull`. Other sessions may have pushed. Work in one session at a time.
- Commit as Avi: `git -c user.name="Avi" -c user.email="aviko2210@gmail.com" commit ...`

## Checking your work
Serve the repo root locally (for example `python3 -m http.server 8770`) and look at it on a phone width (390px) and on desktop, in Hebrew and English. Check: no horizontal scroll, no console errors, WhatsApp links open with the right message, the sticky bar doesn't cover text.

## Open items
- Choose an analytics tool (Cloudflare Web Analytics token, or GA4 for click events), then update the privacy policy, which still names Vercel.
- Lawyer or insurer review of the health declaration and legal pages.
- Written consent from the three women in the testimonials.
- New park photo and video shoot.
