import re
# -*- coding: utf-8 -*-
"""Static site generator for BoxingRise. Run from the repo root: python3 src/build.py
Writes index.html, en/index.html, the legal pages in both languages, config.js, sitemap.xml and robots.txt."""
import json, os, html, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))
from content import HE, EN          # noqa: E402
from legal import PAGES, HEALTH_FORM, UPDATED  # noqa: E402

CFG = json.loads((ROOT / "src" / "config.json").read_text(encoding="utf-8"))
NUM = CFG["whatsapp_number"]
WA_DISPLAY = "0" + NUM[3:5] + "-" + NUM[5:8] + "-" + NUM[8:] if NUM.startswith("972") else NUM
SITE = CFG["site_url"]
VER = "81"  # bump to bust caches of css/js

e = html.escape


def wa_href(lang, question=False):
    from urllib.parse import quote
    msg = CFG['whatsapp_question' if question else 'whatsapp_message'][lang]
    return f"https://wa.me/{NUM}?text={quote(msg)}"


def base(lang):
    return "/" if lang == "he" else "/en"


def legal_url(lang, slug):
    return f"/{slug}" if lang == "he" else f"/en/{slug}"


ICON_WA = ('<svg class="i-wa" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>')


def btn(t, label, cls="btn btn-gold", extra=""):
    return (f'<a class="{cls} js-wa" href="{wa_href(t["lang"])}" target="_blank" rel="noopener" {extra}>'
            f'<span>{e(label)}</span><span class="sr-only"> {e(t["new_tab"])}</span></a>')


def img(name, alt, cls="", sizes="(max-width: 760px) 100vw, 33vw", eager=False):
    w, h = IMG_SIZES[name]
    load = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return (f'<picture><source type="image/webp" srcset="/media/opt/{name}-480.webp 480w, /media/opt/{name}-900.webp 900w" sizes="{sizes}">'
            f'<img class="{cls}" src="/media/{name}.jpg" alt="{e(alt)}" width="{w}" height="{h}" {load} decoding="async"></picture>')


CLIPS = {"round-1": ("technique", 480, 600), "round-2": ("pads", 480, 600), "round-3": ("power", 480, 600),
         "gallery-2": ("confidence", 480, 600), "gallery-4": ("fitness", 640, 480), "gallery-1": ("calm", 640, 480)}


def media(name, alt, cls, sizes):
    """A short muted park clip where we have one, otherwise the photo."""
    if name not in CLIPS:
        return img(name, alt, cls, sizes)
    clip, w, h = CLIPS[name]
    return (f'<video class="{cls} js-clip" muted loop playsinline preload="none" poster="/media/clip-{clip}.jpg?v={VER}" width="{w}" height="{h}" aria-label="{e(alt)}">'
            f'<source src="/media/clip-{clip}.mp4?v={VER}" type="video/mp4"></video>')


def placeholder(t, desc):
    return (f'<div class="ph" role="img" aria-label="{e(desc)}"><span class="ph-mark" aria-hidden="true"></span>'
            f'<span class="ph-text">{e(t["photo_note"])} {e(desc)}</span></div>')


# ---------------------------------------------------------------- shared chrome
def head(t, title, desc, path, alt_path, noindex):
    lang = t["lang"]
    other = "en" if lang == "he" else "he"
    robots = '<meta name="robots" content="noindex, nofollow">' if noindex else '<meta name="robots" content="index, follow">'
    return f"""<!doctype html>
<html lang="{lang}" dir="{t['dir']}">
<head>
  <meta charset="utf-8">
  <script>document.documentElement.classList.add('js')</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{e(title)}</title>
  <meta name="description" content="{e(desc)}">
  {robots}
  <!-- TODO: before launch on boxingrise.com set "noindex": false in src/config.json and rebuild -->
  <link rel="canonical" href="{SITE}{path}">
  <link rel="alternate" hreflang="{lang}" href="{SITE}{path}">
  <link rel="alternate" hreflang="{other}" href="{SITE}{alt_path}">
  <link rel="alternate" hreflang="x-default" href="{SITE}{path if lang == 'he' else alt_path}">
  <meta name="theme-color" content="#000000">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="BoxingRise">
  <meta property="og:locale" content="{t['locale']}">
  <meta property="og:title" content="{e(title)}">
  <meta property="og:description" content="{e(t['og_description'])}">
  <meta property="og:url" content="{SITE}{path}">
  <meta property="og:image" content="{SITE}/media/og.jpg">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon-32.png" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fonts/heebo.woff" as="font" type="font/woff" crossorigin>
  <link rel="preload" href="/fonts/karantina-bold.woff" as="font" type="font/woff" crossorigin>
  <link rel="stylesheet" href="/assets/site.css?v={VER}">
  <script src="/config.js?v={VER}" defer></script>
  <script src="/assets/site.js?v={VER}" defer></script>
"""


def header(t, home):
    lab, href, name = t["lang_switch"]
    nav = "".join(f'<li><a href="{(base(t["lang"]) if not home else "")}{h}">{e(x)}</a></li>' for h, x in t["nav"])
    return f"""<a class="skip" href="#main">{e(t['skip'])}</a>
<header class="site-head" id="top">
  <div class="wrap head-row">
    <a class="logo" href="{base(t['lang'])}" aria-label="BoxingRise"><img src="/brand/logo.webp" alt="BoxingRise" width="1202" height="468"></a>
    <nav class="main-nav" aria-label="{'ניווט ראשי' if t['lang']=='he' else 'Main'}"><ul>{nav}</ul></nav>
    <div class="head-actions">
      <a class="lang-switch" href="{href}" hreflang="{'en' if t['lang']=='he' else 'he'}" lang="{'en' if t['lang']=='he' else 'he'}"><span aria-hidden="true">{lab}</span><span class="sr-only">{e(name)}</span></a>
      {btn(t, t['cta_short'], 'btn btn-gold btn-sm head-cta')}
    </div>
  </div>
</header>
"""


def footer(t):
    lang = t["lang"]
    lab, href, name = t["lang_switch"]
    links = "".join(f'<li><a href="{legal_url(lang, s)}">{e(x)}</a></li>' for s, x in t["legal_nav"])
    root = "/" if lang == "he" else "/en"
    nav = "".join(f'<li><a href="{root}{h}">{e(x)}</a></li>' for h, x in t["nav"])
    h1 = t["hero_h1"]
    return f"""<footer class="site-foot">
  <div class="wrap foot-top">
    <div class="foot-brand">
      <img class="foot-logo" src="/brand/logo.webp" alt="BoxingRise" width="1202" height="468" loading="lazy">
      <p class="foot-line">{e(h1[0])} <span class="g">{e(h1[1])}</span></p>
      <p class="foot-tag">{e(t['footer_tag'])}</p>
    </div>
    <nav class="foot-col" aria-label="{e(t['foot_nav_h'])}"><p class="foot-h">{e(t['foot_nav_h'])}</p><ul class="foot-nav">{nav}<li><a href="{href}" hreflang="{'en' if lang=='he' else 'he'}" lang="{'en' if lang=='he' else 'he'}">{e(name)}</a></li></ul></nav>
  </div>
  <div class="wrap foot-base">
    <nav aria-label="{e(t['foot_legal_h'])}"><ul class="foot-legal">{links}<li><button type="button" class="linklike js-cookie-settings">{e(t['cookie_settings'])}</button></li></ul></nav>
    <p>© <span class="js-year">2026</span> BoxingRise · {e('אבי אניחוביץ' if lang=='he' else 'Avi Anihovich')}</p>
  </div>
</footer>
<div class="cookie" id="cookie" role="region" aria-label="{'עוגיות' if t['lang']=='he' else 'Cookies'}" hidden>
  <p>{e(t['cookie_text'])} <a href="{legal_url(t['lang'], 'privacy')}">{e(t['cookie_more'])}</a></p>
  <div class="cookie-actions"><button type="button" class="btn btn-gold btn-sm js-consent" data-consent="yes">{e(t['cookie_accept'])}</button><button type="button" class="btn btn-line btn-sm js-consent" data-consent="no">{e(t['cookie_decline'])}</button></div>
</div>
"""


def floating(t):
    return f"""<a class="wa-float js-wa" href="{wa_href(t['lang'])}" target="_blank" rel="noopener" aria-label="{e(t['wa_label'])} {e(t['new_tab'])}">{ICON_WA}</a>
<div class="sticky-bar" aria-hidden="false">
  <a class="sticky-cta js-wa" href="{wa_href(t['lang'])}" target="_blank" rel="noopener">{ICON_WA}<span>{e(t['cta_trial'])}</span><s>{e(t['instead_of'].split()[-2])} ₪</s><span class="sr-only"> {e(t['new_tab'])}</span></a>
</div>
"""


def schema(t, path):
    data = {
        "@context": "https://schema.org",
        "@type": ["SportsActivityLocation", "LocalBusiness"],
        "name": "BoxingRise",
        "description": t["description"],
        "url": SITE + path,
        "image": SITE + "/media/og.jpg",
        "logo": SITE + "/brand/icon-512.png",
        "telephone": "+" + NUM,
        "priceRange": "₪₪",
        "founder": {"@type": "Person", "name": "Avi Anihovich", "alternateName": "Aviko"},
        "areaServed": [{"@type": "City", "name": "Tel Aviv-Yafo"}, {"@type": "AdministrativeArea", "name": "Central District, Israel"}],
        "address": {"@type": "PostalAddress", "addressLocality": "Tel Aviv-Yafo", "addressCountry": "IL"},
        "geo": {"@type": "GeoCoordinates", "latitude": 32.0995, "longitude": 34.8137},
        "sport": "Boxing",
        "inLanguage": t["lang"],
        "paymentAccepted": "Cash, Bit, PayBox",
        "currenciesAccepted": "ILS",
        "makesOffer": {"@type": "Offer", "name": "Trial session" if t["lang"] == "en" else "אימון ניסיון",
                       "price": str(CFG["trial_price"]), "priceCurrency": "ILS"},
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + "</script>"


GOLD_TAIL = {"he": {"final_h": 2, "faq_h": 1, "trial_h": 2, "reviews_h": 2, "for_h": 2, "pain_h": 0, "about_h": 0, "batt_h": 2},
             "en": {"final_h": 2, "faq_h": 1, "trial_h": 2, "reviews_h": 3, "for_h": 2, "pain_h": 0, "about_h": 0, "batt_h": 1}}


def hgold(t, key):
    """Heading with its last words in gold (brand language)."""
    text = t[key]
    if key == "trial_h":
        a, _, z = text.partition(", ")
        return f'{e(a)},<br><span class="g">{e(z)}</span>'
    if key in ("what_h", "about_h", "final_h", "voice_h"):
        a, _, z = text.partition(". ")
        return f'{e(a)}.<br><span class="g">{e(z)}</span>'
    n = GOLD_TAIL[t["lang"]].get(key, 0)
    w = text.split()
    if not n or n >= len(w):
        return e(text)
    return e(" ".join(w[:-n])) + ('<br>' if key == "batt_h" else ' ') + '<span class="g">' + e(" ".join(w[-n:])) + "</span>"


TAGGED = {"what", "reviews", "trial", "program"}


def tag(t, key):
    if key not in TAGGED:
        return ""
    return f'<p class="tag">{e(t["tag_" + key])}</p>'


GRASS = '<div class="grass" aria-hidden="true"></div>'
RING = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="trk" cx="32" cy="32" r="28"/><circle class="prg" cx="32" cy="32" r="28"/></svg>'


# ---------------------------------------------------------------- home page
def mirror(t):
    v = t["mv"]
    rows = "".join(f'<li class="mv-l">{e(x)}</li>' for x in v["lines"])
    return (f'<section class="sec mv mv-big a4" aria-labelledby="mv-h"><div class="wrap">'
            f'<h2 class="h2 mv-h" id="mv-h">{e(v["h"])}</h2><ul class="mv-list">{rows}</ul>'
            f'<p class="mv-turn">{e(v["turn"])}</p></div></section>')


def battery(t):
    rows = "".join(f'<li class="bt-d"><span>{e(n)}</span><b dir="ltr">−{d}%</b></li>' for n, d in t["batt"])
    left = 100 - sum(d for _, d in t["batt"])
    return (f'<section class="sec batt" aria-labelledby="bt-h" data-left="{left}"><div class="wrap narrow">{tag(t, "batt")}'
            f'<h2 class="h2" id="bt-h">{hgold(t, "batt_h")}</h2>'
            f'<div class="bt-meter" aria-hidden="true"><div class="bt-cell"><i></i></div><span class="bt-pct" dir="ltr">100%</span></div>'
            f'<ul class="bt-list">{rows}</ul><p class="bt-turn">{e(t["batt_turn"])}</p></div></section>')


def voice(t):
    rows = "".join(f'<li class="vc-p"><p class="vc-in"><small>{e(t["voice_in"])}</small>{e(a)}</p><p class="vc-out">{e(b)}</p></li>' for a, b in t["voice"])
    return (f'<section class="sec voice" aria-labelledby="vc-h"><div class="wrap narrow">{tag(t, "voice")}'
            f'<h2 class="h2" id="vc-h">{hgold(t, "voice_h")}</h2><ul class="vc-list">{rows}</ul></div></section>')


def home(t):
    lang = t["lang"]
    path, alt = ("/", "/en") if lang == "he" else ("/en", "/")
    h1 = "".join(f'<span class="h1-line">' + " ".join(f'<span class="w"><span>{e(w)}</span></span>' for w in line.split()) + "</span>" for line in t["hero_h1"])
    pains = "".join(f'<li><span class="pl">{e(p)}</span></li>' for p in t["pain"])
    facts = "".join(f'<div class="fact"><dt>{e(l)}</dt><dd><span class="num" data-count="{n}" dir="ltr">{e(n)}</span></dd></div>' for n, l in t["what_facts"])
    rounds = "".join(f'<li class="round"><figure>{media(i, alt, "round-img", "(max-width: 760px) 80vw, 30vw")}<figcaption><h4>{e(h)}</h4><p>{e(p)}</p></figcaption></figure></li>' for n, (i, h, p, alt) in enumerate(t["rounds"], 1))
    cards = ""
    for c in t["for"]:
        media_html = media(c["img"], c["alt"], "card-img", "(max-width: 760px) 100vw, 33vw") if c["img"] else placeholder(t, c["ph"])
        k = len(cards and cards.split("<article")) if cards else 1
        cards += (f'<article class="aud aud-text fc"><span class="aud-n" dir="ltr" aria-hidden="true">0{k}</span><div class="aud-body">'
                  f'<h3>{e(c["h"])}</h3><p class="aud-pain"><span>{e(t["pain_prefix"])}</span> <s class="x">{e(c["pain"])}</s></p><p class="aud-change">{e(c["change"])}</p></div></article>')
    steps = "".join(f'<li class="step reveal"><span class="step-n" dir="ltr">{RING}<small>STEP</small>{i}</span><h3>{e(h)}</h3><p>{e(p)}</p></li>' for i, (h, p) in enumerate(t["trial_steps"], 1))
    pfacts = "".join(f'<div class="fact"><dt>{e(l)}</dt><dd><span class="num" data-count="{n}" dir="ltr">{e(n)}</span></dd></div>' for n, l in t["prog_facts"])
    weeks = "".join(f'<li class="wk"><span class="wk-dot" aria-hidden="true"><svg viewBox="0 0 24 24"><circle class="trk" cx="12" cy="12" r="9"/><circle class="prg" cx="12" cy="12" r="9"/></svg></span><p class="wk-n"><span class="wk-num">{e(t["week_word"])} <span dir="ltr">{i}</span></span> <span class="wk-feel">{e(t["week_feel"][i - 1])}</span></p><details class="wk-d"><summary><h3>{e(h)}</h3><span class="wk-x" aria-hidden="true"></span></summary><p>{e(p)}</p></details></li>' for i, (h, p) in enumerate(t["weeks"], 1))
    about = "".join(f'<blockquote class="about-quote"><p>{e(p)}</p></blockquote>' if k == 0 else f"<p>{e(p)}</p>" for k, p in enumerate(t["about"][1:]))
    creds = "".join(f'<li>{e(x)}</li>' for x in t["about_facts"])
    reviews = ""
    if CFG["show_testimonials"]:
        def rv(k, name, txt):
            slug = t["review_photo"][k]
            photo = (f'<img class="rv-photo" src="/media/review-{slug}.jpg?v={VER}" alt="{e(name)}" width="320" height="400" loading="lazy">'
                     if (ROOT / "media" / f"review-{slug}.jpg").exists() else f'<span class="rv-photo rv-initial" aria-hidden="true">{e(name[0])}</span>')
            return (f'<figure class="rv">{photo}<div class="rv-body"><blockquote><p class="rv-q">{e(t["review_hl"][k])}.</p>'
                    f'</blockquote><figcaption><b>{e(name)}</b> · <span>{e(t["review_sub"][k])}</span></figcaption><details class="rv-more"><summary>{e(t["review_more"])}</summary><p>{e(txt)}</p></details></div></figure>')
        q = "".join(rv(k, name, txt) for k, (name, txt) in enumerate(t["reviews"]))
        reviews = f'<section class="sec reviews" id="reviews" aria-labelledby="rv-h"><div class="wrap">{tag(t, "reviews")}<h2 class="h2" id="rv-h">{hgold(t, "reviews_h")}</h2><div class="rv-grid">{q}</div><div class="rv-foot reveal"><p>{e(t["reviews_cta"])}</p>{btn(t, t["cta_trial"], "btn btn-gold magnetic")}</div></div></section>'
    faq_arrow = "←" if t["lang"] == "he" else "→"
    faq = "".join(
        f'<details class="qa"><summary><span class="qa-n" aria-hidden="true">{i + 1:02d}</span><span class="qa-t">{e(q)}</span><span class="qa-x" aria-hidden="true"></span></summary>'
        f'<div class="qa-a"><span class="qa-bar" aria-hidden="true"></span><p>{e(a)}</p>'
        + (f'<a class="qa-cta js-wa" href="{wa_href(t["lang"])}" target="_blank" rel="noopener">{e(t["faq_cta"])} <span aria-hidden="true">{faq_arrow}</span><span class="sr-only"> {e(t["new_tab"])}</span></a>' if i in t["faq_cta_at"] else "")
        + '</div></details>' for i, (q, a) in enumerate(t["faq"]))
    faq_items = re.findall(r'<details class="qa">.*?</details>', faq, flags=re.S)
    faq_top, faq_rest = "".join(faq_items[:t["faq_top"]]), "".join(faq_items[t["faq_top"]:])
    trial_line = f'<p class="trial-line"><span>{"אימון ניסיון" if lang=="he" else "Trial session"}</span> <b dir="ltr">49 ₪</b> <span>{e(" ".join(t["instead_of"].split()[:-2]))}</span> <s>{e(" ".join(t["instead_of"].split()[-2:]))}</s></p>'

    return head(t, t["title"], t["description"], path, alt, CFG["noindex"]) + schema(t, path) + "\n</head>\n<body class=\"home\">\n" + header(t, True) + f"""
<main id="main">
  <section class="hero" aria-labelledby="hero-h">
    <div class="hero-media" aria-hidden="true">
      <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="/media/hero-mont-m.jpg?v={VER}" data-poster-wide="/media/hero-mont-w.jpg?v={VER}"><source src="/media/hero-mont-m.mp4?v={VER}" type="video/mp4" media="(max-width: 999px)"><source src="/media/hero-mont-w.mp4?v={VER}" type="video/mp4"></video>
      <div class="hero-shade"></div>
      <div class="hero-fx"></div>
    </div>
    <div class="wrap hero-inner">
      <p class="h1">{h1}</p>
      <h1 class="hero-sub" id="hero-h">{e(t['hero_sub']).replace('. ', '.<br>', 1)}</h1>
      <div class="hero-cta"><a class="btn btn-gold btn-lg magnetic js-wa" href="{wa_href(t['lang'])}" target="_blank" rel="noopener"><span>{e(t['cta_trial'])}</span><s class="btn-was"><span class="sr-only">{e(' '.join(t['instead_of'].split()[:-2]))} </span>{e(' '.join(t['instead_of'].split()[-2:]))}</s><span class="sr-only"> {e(t['new_tab'])}</span></a></div>
    </div>
  </section>

  {mirror(t)}
  <section class="sec what" id="what" aria-labelledby="what-h">
    <div class="wrap">
      <div class="split">
        <div class="h2-wrap">{tag(t, 'what')}<h2 class="h2" id="what-h">{hgold(t, 'what_h')}</h2></div>
        <div><p class="lead">{e(t['what_lead'])}</p><dl class="facts reveal">{facts}</dl></div>
      </div>
      <h3 class="h3 rounds-h">{e(t['rounds_h'])}</h3>
      <ol class="rounds" tabindex="0" aria-label="{e(t['rounds_h'])}">{rounds}</ol>
    </div>
  </section>

  <section class="sec for alt fb6" id="for" aria-labelledby="for-h">
    {GRASS}
    <div class="wrap">
      {tag(t, 'for')}<h2 class="h2" id="for-h">{hgold(t, 'for_h')}</h2>
      <div class="aud-grid">{cards}</div>
    </div>
  </section>

  {reviews}

  <section class="sec about alt" id="about" aria-labelledby="about-h">
    {GRASS}
    <div class="wrap about-grid">
      <figure class="about-photo">{img('avi-coach', t['about_alt'], 'about-img', '(max-width: 760px) 100vw, 40vw')}</figure>
      <div class="about-text">
        {tag(t, 'about')}<h2 class="h2" id="about-h">{hgold(t, 'about_h')}</h2>
        {about}
        <ul class="about-facts">{creds}</ul>
      </div>
    </div>
  </section>

  {voice(t)}
  <section class="sec trial" id="trial" aria-labelledby="trial-h">
    <div class="wrap">
      {tag(t, 'trial')}<h2 class="h2" id="trial-h">{hgold(t, 'trial_h')}</h2>
      <ol class="steps">{steps}</ol>
      <div class="trial-foot reveal"><p class="trial-why">{e(t['trial_why'])}</p>{btn(t, t['cta_trial'], 'btn btn-gold magnetic')}</div>
    </div>
  </section>

  <section class="sec program" id="program" aria-labelledby="prog-h">
    <div class="wrap">
      <div class="split">
        <div>{tag(t, 'program')}<h2 class="h2 prog-title" id="prog-h" dir="ltr">{e(t['prog_h'])}</h2><p class="lead">{e(t['prog_lead'])}</p><dl class="facts facts-light reveal">{pfacts}</dl>{('<p class="prog-kids">' + e(t['prog_kids']) + '</p>') if t['prog_kids'] else ''}</div>
        <div class="timeline-wrap"><ol class="timeline" style="--fill:0">{weeks}</ol></div>
      </div>
      <div class="prog-outcome reveal"><p><b>{e(t['prog_outcome_h'])}</b> {e(t['prog_outcome'])}</p></div>
      <div class="prog-foot reveal"><p class="prog-price">{e(t['prog_price'])}</p></div>
    </div>
  </section>


  <section class="sec faq alt" id="faq" aria-labelledby="faq-h">
    {GRASS}
    <div class="wrap narrow">
      {tag(t, 'faq')}<h2 class="h2" id="faq-h">{hgold(t, 'faq_h')}</h2>
      <div class="qa-list">{faq_top}<details class="faq-more"><summary><span>{e(t['faq_more'].format(n=len(t['faq']) - t['faq_top']))}</span><span class="qa-x" aria-hidden="true"></span></summary>{faq_rest}</details></div>
      <div class="ask"><p>{e(t['ask_text'])}</p><a class="btn btn-line js-wa-q" href="{wa_href(t['lang'], True)}" target="_blank" rel="noopener"><span>{e(t['ask_btn'])}</span><span class="sr-only"> {e(t['new_tab'])}</span></a></div>
    </div>
  </section>

  <section class="final" id="final" aria-labelledby="final-h">
    <div class="wrap final-inner">
      {tag(t, 'final')}
      <h2 class="final-h" id="final-h">{hgold(t, 'final_h')}</h2>
      <p class="final-sub">{e(t['final_sub'])}</p>
      <div class="pick" data-day-tpl="{e(t['pick_day_tpl'])}" data-time-tpl="{e(t['pick_time_tpl'])}">
        <p class="pick-lbl" id="pick-d">{e(t['pick_day'])}</p>
        <div class="pick-row" role="group" aria-labelledby="pick-d" data-group="day">{''.join(f'<button type="button" class="pick-chip" aria-pressed="false">{e(x)}</button>' for x in t['pick_days'])}</div>
        <p class="pick-lbl" id="pick-t">{e(t['pick_time'])}</p>
        <div class="pick-row" role="group" aria-labelledby="pick-t" data-group="time">{''.join(f'<button type="button" class="pick-chip" aria-pressed="false">{e(x)}</button>' for x in t['pick_times'])}</div>
        <p class="pick-preview" aria-live="polite">{e(t['pick_preview'])} <b class="js-pick-msg">{e(CFG['whatsapp_message'][t['lang']])}</b></p>
      </div>
      <a class="btn btn-gold btn-lg magnetic js-wa js-wa-pick" href="{wa_href(t['lang'])}" target="_blank" rel="noopener"><span>{e(t['cta_trial'])}</span><s class="btn-was"><span class="sr-only">{e(' '.join(t['instead_of'].split()[:-2]))} </span>{e(' '.join(t['instead_of'].split()[-2:]))}</s><span class="sr-only"> {e(t['new_tab'])}</span></a>
      <p class="final-note">{e(t['final_note'])}</p>
    </div>
  </section>
</main>
""" + footer(t) + floating(t) + "</body>\n</html>\n"


# ---------------------------------------------------------------- legal pages
def health_form(lang):
    f = HEALTH_FORM[lang]
    fields = "".join(f'<div class="hf-field"><span>{e(x)}</span><span class="hf-line"></span></div>' for x in f["fields"])
    qs = "".join(f'<li><span class="hf-q">{e(q)}</span><span class="hf-yn"><span class="hf-box"></span>{e(f["yes"])}<span class="hf-box"></span>{e(f["no"])}</span></li>' for q in f["questions"])
    signs = "".join(f'<div class="hf-field"><span>{e(x)}</span><span class="hf-line"></span></div>' for x in f["sign"])
    return (f'<div class="hf"><div class="hf-fields">{fields}</div><p>{e(f["intro"])}</p><ol class="hf-qs">{qs}</ol>'
            f'<p class="hf-note">{e(f["note"])}</p><p class="hf-declare">{e(f["declare"])}</p><div class="hf-fields">{signs}</div>'
            f'<p class="no-print"><button type="button" class="btn btn-gold js-print">{e(f["print"])}</button></p></div>')


def legal_page(t, slug):
    lang = t["lang"]
    page = PAGES[slug][lang]
    path = legal_url(lang, slug)
    alt = legal_url("en" if lang == "he" else "he", slug)
    body = ""
    for kind, val in page["blocks"]:
        if kind == "h":
            body += f"<h2>{e(val)}</h2>"
        elif kind == "p":
            body += f"<p>{e(val.format(wa_display=WA_DISPLAY, coordinator=CFG['accessibility_coordinator'][lang]))}</p>"
        elif kind == "ul":
            body += "<ul>" + "".join(f"<li>{e(i)}</li>" for i in val) + "</ul>"
        elif kind == "form":
            body += health_form(lang)
    todo = "<!-- TODO: לבדיקת עורך דין לפני עלייה לאוויר / Lawyer review required before launch -->\n"
    return todo + head(t, f"{page['title']} | BoxingRise", page["title"] + " – BoxingRise", path, alt, CFG["noindex"]) + "</head>\n<body class=\"legal\">\n" + header(t, False) + f"""
<main id="main" class="legal-main">
  <div class="wrap narrow">
    <p class="crumb"><a href="{base(lang)}">{e(t['back_home'])}</a></p>
    <h1 class="legal-h1">{e(page['title'])}</h1>
    <p class="updated">{e(UPDATED[lang])}</p>
    <div class="legal-body">{body}</div>
  </div>
</main>
""" + footer(t) + floating(t) + "</body>\n</html>\n"


# ---------------------------------------------------------------- images
IMG_SIZES = {}


def optimise_images():
    from PIL import Image
    out = ROOT / "media" / "opt"
    out.mkdir(parents=True, exist_ok=True)
    for name in ["avi-portrait", "avi", "avi-coach", "round-1", "round-2", "round-3", "gallery-1", "gallery-2", "gallery-4"]:
        im = Image.open(ROOT / "media" / f"{name}.jpg").convert("RGB")
        IMG_SIZES[name] = im.size
        for w in (480, 900):
            target = out / f"{name}-{w}.webp"
            if not target.exists():
                r = im.copy()
                r.thumbnail((w, w * 2))
                r.save(target, "WEBP", quality=78, method=6)


# ---------------------------------------------------------------- write
def write(rel, text):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def main():
    optimise_images()
    write("index.html", home(HE))
    write("en/index.html", home(EN))
    for slug in PAGES:
        write(f"{slug}.html", legal_page(HE, slug))
        write(f"en/{slug}.html", legal_page(EN, slug))
    write("config.js", "/* Single source: src/config.json. Edit there and run python3 src/build.py */\n"
          f"window.BR_CONFIG = {json.dumps({'whatsapp': NUM, 'message': CFG['whatsapp_message'], 'question': CFG['whatsapp_question']}, ensure_ascii=False)};\n")
    urls = ["/", "/en"] + [legal_url(l, s) for s in PAGES for l in ("he", "en")]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
         "".join(f"  <url><loc>{SITE}{u}</loc></url>\n" for u in urls) + "</urlset>\n"
    write("sitemap.xml", sm)
    write("robots.txt", ("User-agent: *\nDisallow: /\n" if CFG["noindex"] else "User-agent: *\nAllow: /\n") + f"\nSitemap: {SITE}/sitemap.xml\n")
    print("built", len(urls), "pages")


if __name__ == "__main__":
    main()
