"""Builds /park/: a scroll-driven film of a real park session (sample design, noindex).
Run: python3 src/park.py  (reads the same Hebrew content as the main site)."""
import json
import os
import sys
from html import escape as e
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))
import content  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CFG = json.load(open(os.path.join(ROOT, "src", "config.json"), encoding="utf-8"))
T = content.HE
WA = f"https://wa.me/{CFG['whatsapp_number']}?text={quote(CFG['whatsapp_message']['he'])}"
WAQ = f"https://wa.me/{CFG['whatsapp_number']}?text={quote(CFG['whatsapp_question']['he'])}"
VER = "2"
NF = len([f for f in os.listdir(os.path.join(ROOT, "park", "f")) if f.endswith(".webp")])


def cta(label="לאימון ניסיון ב־49 ₪", cls="pk-btn"):
    return (f'<a class="{cls} js-wa" href="{WA}" target="_blank" rel="noopener">{e(label)}'
            f'<s aria-hidden="true">250 ₪</s><span class="sr-only"> (נפתח בוואטסאפ)</span></a>')


def more(i, label="לקרוא עוד"):
    return f'<button type="button" class="pk-more" data-open="dr-{i}" aria-haspopup="dialog"><span aria-hidden="true">+</span> {e(label)}</button>'


rounds = []   # (eyebrow, heading html, sub, extra html, drawer title, drawer html)

rounds.append(("פתיחה",
               'לא צריך להיות לוחמת.<br><em>צריך רק להתחיל.</em>',
               "אימון אגרוף אישי לנשים, אחד על אחד, בפארק. תל אביב והמרכז.",
               cta() + '<p class="pk-note">בלי ניסיון · בלי התחייבות · כל הציוד עליי</p>', None, None))

mv = T["mv"]
rounds.append(("הבעיה",
               'חדר כושר?<br><em>לא בשבילך.</em>',
               "רעש, מבטים, וקבוצה שכבר יודעת הכול.",
               more(1),
               mv["h"],
               "".join(f"<p>{e(x)}</p>" for x in mv["lines"]) + f'<p class="pk-gold">{e(mv["turn"])}</p>'))

clips = {"round-1": "clip-technique", "round-3": "clip-power", "round-2": "clip-pads"}
rd = "".join(
    f'<figure class="pk-clip"><video muted loop playsinline preload="none" poster="/media/{clips[k]}.jpg" data-src="/media/{clips[k]}.mp4" aria-label="{e(alt)}"></video>'
    f'<figcaption><b>{e(h)}</b>{e(d)}</figcaption></figure>' for k, h, d, alt in T["rounds"])
rounds.append(("האימון",
               'אגרוף אמיתי.<br><em>רק את והמאמן.</em>',
               "60 דקות, אחד על אחד, באוויר הפתוח.",
               '<ul class="pk-chips"><li>טכניקה</li><li>כוח וכושר</li><li>כריות</li><li>בלי ניסיון</li></ul>' + more(2, "ככה נראית שעה"),
               "ככה נראית שעה איתי", f'<div class="pk-clips">{rd}</div>'))

rounds.append(("ביטחון",
               'זה לא רק כושר.<br><em>זה ביטחון.</em>',
               T["def_lead"],
               more(3),
               "להגן על עצמך",
               "".join(f'<div class="pk-pt"><b>{e(h)}</b><p>{e(d)}</p></div>' for h, d in T["def"]) + f'<p class="pk-small">{e(T["def_note"])}</p>'))

rounds.append(("המאמן",
               'אני אבי.<br><em>30 שנה של לחימה.</em>',
               "מואי תאי, אגרוף קלאסי וחגורה שחורה בג׳ו־ג׳יטסו. עם מתחילות, בקצב שלהן.",
               more(4, "להכיר את המאמן"),
               "אבי אניחוביץ",
               f'<img class="pk-avi" src="/media/opt/avi-pro-900.webp" alt="{e(T["about_alt"])}" width="900" height="1080" loading="lazy">'
               + "".join(f"<p>{e(x)}</p>" for x in T["about"])
               + '<ul class="pk-facts">' + "".join(f"<li>{e(x)}</li>" for x in T["about_facts"]) + "</ul>"))

rv = T["reviews"]
photos = {"ויקטוריה": "victoria", "מריה": "maria", "נטע": "neta"}
rounds.append(("הן כבר התחילו",
               'ככה יוצאים<br><em>מהאימון.</em>',
               "״יצאתי ממנו עוצמתית, משוחררת ועם טעם של עוד.״  ויקטוריה",
               more(5, "שלוש המלצות"),
               "הן כבר התחילו",
               "".join(f'<figure class="pk-rv"><img src="/media/review-{photos[n]}.jpg" alt="" loading="lazy" width="120" height="150"><blockquote><p>{e(q)}</p><footer>{e(n)}</footer></blockquote></figure>' for n, q in rv)))

st = T["j8_stages"]
rounds.append(("BoxingRise 8",
               '8 שבועות.<br><em>4 שלבים.</em>',
               "16 אימונים · חצי אגרוף קלאסי, חצי כוח וכושר",
               '<ol class="pk-stages">' + "".join(f'<li><b dir="ltr">{i + 1}</b>{e(n)}</li>' for i, (en, n, wk, bx, ft) in enumerate(st)) + "</ol>" + more(6, "מה לומדים בכל שלב"),
               "BoxingRise 8",
               "".join(f'<div class="pk-pt"><b>{e(n)} · שבועות <span dir="ltr">{wk}</span></b><p>{e(" · ".join(bx + ft))}</p></div>' for en, n, wk, bx, ft in st)))

rounds.append(("אימון ניסיון",
               'שלושה צעדים.<br><em>ואת על הכריות.</em>',
               "שולחים הודעה, קובעים פארק ושעה, ומתאמנים. אני חוזר באותו יום.",
               cta(), None, None))

faq = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in T["faq"])
rounds.append(("מוכנה",
               'השמש כבר בחוץ.<br><em>מוכנה לעלות?</em>',
               "הצעד הכי קשה הוא ההודעה הראשונה. השאר עליי.",
               cta() + more(8, "שאלות לפני שמתחילים"),
               "שאלות לפני שמתחילים",
               faq + f'<p class="pk-small">לא מצאת תשובה? <a class="js-wa" href="{WAQ}" target="_blank" rel="noopener">לשאול בוואטסאפ</a></p>'))

N = len(rounds)
secs, drawers = "", ""
for i, (eb, h, sub, extra, dt, dh) in enumerate(rounds):
    tag = "h1" if i == 0 else "h2"
    secs += (f'<section class="rd" id="r{i}" data-i="{i}" aria-labelledby="rh{i}"><div class="rd-in">'
             f'<p class="rd-eb"><i aria-hidden="true"></i>סיבוב <span dir="ltr">{i:02d}</span> · {e(eb)}</p>'
             f'<{tag} class="rd-h" id="rh{i}">{h}</{tag}><p class="rd-sub">{e(sub)}</p>{extra}</div></section>')
    if dt:
        drawers += (f'<dialog class="dr" id="dr-{i}" aria-labelledby="drh{i}"><div class="dr-in">'
                    f'<button type="button" class="dr-x" aria-label="סגירה">×</button>'
                    f'<p class="rd-eb"><i aria-hidden="true"></i>סיבוב <span dir="ltr">{i:02d}</span></p><h2 id="drh{i}">{e(dt)}</h2>{dh}</div></dialog>')

ticks = "".join(f'<li><a href="#r{i}" aria-label="סיבוב {i}" dir="ltr">{i:02d}</a></li>' for i in range(N))

html = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>BoxingRise · כניסה לפארק</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#07080a">
<meta name="description" content="אימון אגרוף אישי לנשים, אחד על אחד, בפארק. תל אביב והמרכז.">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="preload" href="/fonts/assistant-800.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/park/f/001.webp" as="image">
<link rel="stylesheet" href="/park/park.css?v={VER}">
</head>
<body>
<a class="skip" href="#r0">דילוג לתוכן</a>
<div class="pk-load" aria-hidden="true"><img src="/brand/logo.webp" alt="" width="1202" height="468"><span class="pk-bar"><i></i></span><span class="pk-lbl"><b>מתחממים</b><b class="pk-pct" dir="ltr">0%</b></span></div>
<canvas class="pk-gl" aria-hidden="true" data-frames="{NF}"></canvas>
<div class="pk-light" aria-hidden="true"></div>
<div class="pk-shade" aria-hidden="true"></div>
<header class="pk-head">
  <a class="pk-brand" href="/" aria-label="BoxingRise, לאתר הראשי"><img src="/brand/logo.webp" alt="" width="1202" height="468"><span>אגרוף אישי לנשים · בפארק</span></a>
  {cta("לאימון ניסיון", "pk-btn pk-btn-sm")}
</header>
<nav class="pk-prog" aria-label="סיבובים"><span class="pk-track"><i></i></span><ol>{ticks}</ol></nav>
<main>{secs}</main>
<p class="pk-hint" aria-hidden="true">גללי כדי להתחיל<span></span></p>
{drawers}
<script type="module" src="/park/park.js?v={VER}"></script>
</body>
</html>
"""
open(os.path.join(ROOT, "park", "index.html"), "w", encoding="utf-8").write(html)
print("park/index.html", len(html), "rounds", N)
