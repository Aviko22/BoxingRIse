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
VER = "20"  # bump to bust caches of css/js

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
    links = "".join(f'<li><a href="{legal_url(t["lang"], s)}">{e(x)}</a></li>' for s, x in t["legal_nav"])
    return f"""<footer class="site-foot">
  <div class="wrap foot-grid">
    <div>
      <img class="foot-logo" src="/brand/logo.webp" alt="BoxingRise" width="1202" height="468" loading="lazy">
      <p class="foot-tag">{e(t['footer_tag'])}</p>
    </div>
    <nav aria-label="{'עמודים משפטיים' if t['lang']=='he' else 'Legal'}"><ul class="foot-links">{links}<li><button type="button" class="linklike js-cookie-settings">{e(t['cookie_settings'])}</button></li></ul></nav>
  </div>
  <div class="wrap foot-base"><p>© <span class="js-year">2026</span> BoxingRise · {e('אבי אניחוביץ' if t['lang']=='he' else 'Avi Anihovich')} · {e(t['rights'])}</p></div>
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


# ---------------------------------------------------------------- home page
def home(t):
    lang = t["lang"]
    path, alt = ("/", "/en") if lang == "he" else ("/en", "/")
    h1 = "".join(f'<span class="h1-line">' + " ".join(f'<span class="w"><span>{e(w)}</span></span>' for w in line.split()) + "</span>" for line in t["hero_h1"])
    pains = "".join(f"<li>{e(p)}</li>" for p in t["pain"])
    facts = "".join(f'<div class="fact"><dt>{e(l)}</dt><dd><span class="num" data-count="{n}" dir="ltr">{e(n)}</span></dd></div>' for n, l in t["what_facts"])
    rounds = "".join(f'<li class="round"><figure>{img(i, alt, "round-img", "(max-width: 760px) 80vw, 30vw")}<figcaption><h4>{e(h)}</h4><p>{e(p)}</p></figcaption></figure></li>' for i, h, p, alt in t["rounds"])
    cards = ""
    for c in t["for"]:
        media = img(c["img"], c["alt"], "card-img", "(max-width: 760px) 100vw, 33vw") if c["img"] else placeholder(t, c["ph"])
        cards += (f'<article class="aud reveal"><div class="aud-media">{media}</div><div class="aud-body"><p class="aud-who">{e(c["who"])}</p>'
                  f'<h3>{e(c["h"])}</h3><p class="aud-pain">{e(c["pain"])}</p><p class="aud-change">{e(c["change"])}</p></div></article>')
    steps = "".join(f'<li class="step reveal"><span class="step-n" dir="ltr">{i}</span><h3>{e(h)}</h3><p>{e(p)}</p></li>' for i, (h, p) in enumerate(t["trial_steps"], 1))
    pfacts = "".join(f'<div class="fact"><dt>{e(l)}</dt><dd><span class="num" data-count="{n}" dir="ltr">{e(n)}</span></dd></div>' for n, l in t["prog_facts"])
    weeks = "".join(f'<li class="wk"><span class="wk-dot" aria-hidden="true"></span><p class="wk-n">{e(t["week_word"])} <span dir="ltr">{i}</span></p><details class="wk-d"><summary><h3>{e(h)}</h3><span class="wk-x" aria-hidden="true"></span></summary><p>{e(p)}</p></details></li>' for i, (h, p) in enumerate(t["weeks"], 1))
    about = "".join(f"<p>{e(p)}</p>" for p in t["about"])
    creds = "".join(f"<li>{e(c)}</li>" for c in t["about_creds"])
    reviews = ""
    if CFG["show_testimonials"]:
        q = "".join(f'<figure class="rv"><blockquote><p>{e(txt)}</p></blockquote><figcaption>{e(name)}</figcaption></figure>' if t["lang"] == "he" else f'<figure class="rv"><blockquote><p>{e(txt)}</p></blockquote><figcaption>{e(name)}</figcaption></figure>' for name, txt in t["reviews"])
        reviews = f'<section class="sec reviews" id="reviews" aria-labelledby="rv-h"><div class="wrap"><h2 class="h2" id="rv-h">{e(t["reviews_h"])}</h2><div class="rv-grid">{q}</div></div></section>'
    faq = "".join(f'<details class="qa"><summary><span>{e(q)}</span><span class="qa-x" aria-hidden="true"></span></summary><div class="qa-a"><p>{e(a)}</p></div></details>' for q, a in t["faq"])
    trial_line = f'<p class="trial-line"><span>{"אימון ניסיון" if lang=="he" else "Trial session"}</span> <b dir="ltr">49 ₪</b> <span>{e(" ".join(t["instead_of"].split()[:-2]))}</span> <s>{e(" ".join(t["instead_of"].split()[-2:]))}</s></p>'

    return head(t, t["title"], t["description"], path, alt, CFG["noindex"]) + schema(t, path) + "\n</head>\n<body class=\"home\">\n" + header(t, True) + f"""
<main id="main">
  <section class="hero" aria-labelledby="hero-h">
    <div class="hero-media" aria-hidden="true">
      <video class="hero-video" autoplay muted loop playsinline preload="metadata" poster="/media/hero-ring.jpg"><source src="/media/hero-ring.mp4" type="video/mp4"></video>
      <div class="hero-shade"></div>
    </div>
    <div class="wrap hero-inner">
      <h1 class="h1" id="hero-h">{h1}</h1>
      <p class="hero-sub">{e(t['hero_sub'])}</p>
      <div class="hero-cta"><a class="btn btn-gold btn-lg magnetic js-wa" href="{wa_href(t['lang'])}" target="_blank" rel="noopener"><span>{e(t['cta_trial'])}</span><s class="btn-was"><span class="sr-only">{e(' '.join(t['instead_of'].split()[:-2]))} </span>{e(' '.join(t['instead_of'].split()[-2:]))}</s><span class="sr-only"> {e(t['new_tab'])}</span></a></div>
      <div class="trust"><img class="trust-face" src="/media/opt/avi-face.webp" alt="" width="56" height="56"><div><p class="trust-name">{e(t['trust_name'])}</p><p class="trust-points">{' · '.join(e(x) for x in t['trust_points'])}</p></div></div>
    </div>
  </section>

  <section class="sec pain" aria-labelledby="pain-h">
    <div class="wrap narrow">
      <h2 class="h2" id="pain-h">{e(t['pain_h'])}</h2>
      <ul class="pain-list">{pains}</ul>
      <p class="pain-turn reveal">{e(t['pain_turn'])}</p>
    </div>
  </section>

  <section class="sec about" id="about" aria-labelledby="about-h">
    <div class="wrap about-grid">
      <figure class="about-photo">{img('avi-portrait', t['about_alt'], 'about-img', '(max-width: 760px) 100vw, 40vw')}</figure>
      <div class="about-text">
        <h2 class="h2" id="about-h">{e(t['about_h'])}</h2>
        {about}
        <ul class="creds">{creds}</ul>
      </div>
    </div>
  </section>

  {reviews}

  <section class="sec what" id="what" aria-labelledby="what-h">
    <div class="wrap">
      <div class="split">
        <h2 class="h2" id="what-h">{e(t['what_h']).replace('. ', '.<br>', 1)}</h2>
        <div><p class="lead">{e(t['what_lead'])}</p><dl class="facts reveal">{facts}</dl></div>
      </div>
      <h3 class="h3 rounds-h">{e(t['rounds_h'])}</h3>
      <ol class="rounds" tabindex="0" aria-label="{e(t['rounds_h'])}">{rounds}</ol>
    </div>
  </section>

  <section class="sec for" id="for" aria-labelledby="for-h">
    <div class="wrap">
      <h2 class="h2" id="for-h">{e(t['for_h'])}</h2>
      <div class="aud-grid">{cards}</div>
    </div>
  </section>

  <section class="sec trial" id="trial" aria-labelledby="trial-h">
    <div class="wrap">
      <h2 class="h2" id="trial-h">{e(t['trial_h'])}</h2>
      <ol class="steps">{steps}</ol>
      <div class="trial-foot reveal"><p class="trial-why">{e(t['trial_why'])}</p>{btn(t, t['cta_trial'], 'btn btn-gold magnetic')}</div>
    </div>
  </section>

  <section class="sec program" id="program" aria-labelledby="prog-h">
    <div class="wrap">
      <div class="split">
        <div><h2 class="h2 prog-title" id="prog-h" dir="ltr">{e(t['prog_h'])}</h2><p class="lead">{e(t['prog_lead'])}</p><dl class="facts facts-light reveal">{pfacts}</dl>{('<p class="prog-kids">' + e(t['prog_kids']) + '</p>') if t['prog_kids'] else ''}</div>
        <div class="timeline-wrap"><ol class="timeline" style="--fill:0">{weeks}</ol></div>
      </div>
      <div class="prog-outcome reveal"><p><b>{e(t['prog_outcome_h'])}</b> {e(t['prog_outcome'])}</p></div>
      <div class="prog-foot reveal"><p class="prog-price">{e(t['prog_price'])}</p>{btn(t, t['cta_trial'], 'btn btn-dark magnetic')}</div>
    </div>
  </section>


  <section class="sec faq" id="faq" aria-labelledby="faq-h">
    <div class="wrap narrow">
      <h2 class="h2" id="faq-h">{e(t['faq_h'])}</h2>
      <div class="qa-list">{faq}</div>
      <div class="ask"><p>{e(t['ask_text'])}</p><a class="btn btn-line js-wa-q" href="{wa_href(t['lang'], True)}" target="_blank" rel="noopener"><span>{e(t['ask_btn'])}</span><span class="sr-only"> {e(t['new_tab'])}</span></a></div>
    </div>
  </section>

  <section class="final" id="final" aria-labelledby="final-h">
    <div class="wrap final-inner">
      <h2 class="final-h" id="final-h">{e(t['final_h'])}</h2>
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
    for name in ["avi-portrait", "round-1", "round-2", "round-3", "gallery-1", "gallery-2", "gallery-4"]:
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
