"""Generate the six one-page CVs in public/cvs/.

Run with the project virtualenv:

    .venv/bin/python scripts/generate_cvs.py

Three versions (data, product, communications), each in English and Turkish.

Built for applicant tracking systems: one column, no tables or images, standard
section names, plain-text contact details and dates, real selectable text.
Inter is bundled in scripts/fonts (SIL Open Font License).
The file names are stable public URLs linked from /cv; do not rename them.
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
FONTS = ROOT / "scripts" / "fonts"
OUT = ROOT / "public" / "cvs"

pdfmetrics.registerFont(TTFont("Inter", FONTS / "Inter-Regular.ttf"))
pdfmetrics.registerFont(TTFont("Inter-SemiBold", FONTS / "Inter-SemiBold.ttf"))
pdfmetrics.registerFontFamily("Inter", normal="Inter", bold="Inter-SemiBold")

INK = colors.HexColor("#1d1d1b")
TEXT = colors.HexColor("#33322f")
MUTED = colors.HexColor("#6a6862")
RULE = colors.HexColor("#d9d7d0")

MARGIN_X = 18 * mm
MARGIN_Y = 13 * mm


def style(name, size, leading, color=TEXT, font="Inter", **kw):
    return ParagraphStyle(
        name, fontName=font, fontSize=size, leading=leading, textColor=color, **kw
    )


S = {
    "name": style("name", 20, 24, INK, "Inter-SemiBold"),
    "headline": style("headline", 10.5, 14, MUTED),
    "contact": style("contact", 8.6, 12, MUTED),
    "section": style("section", 9.4, 12, INK, "Inter-SemiBold"),
    "body": style("body", 9, 12.8, TEXT),
    "role": style("role", 9.6, 12.6, INK, "Inter-SemiBold"),
    "meta": style("meta", 8.6, 12, MUTED),
    "bullet": style("bullet", 9, 12.6, TEXT, leftIndent=10, bulletIndent=1),
}


def link(label, url):
    # Links stay ink-coloured: parsers read the text, people can still click it.
    return f'<link href="{url}">{label}</link>'


def section(title):
    return [
        Spacer(1, 8),
        Paragraph(title, S["section"]),
        HRFlowable(width="100%", thickness=0.6, color=RULE, spaceBefore=3, spaceAfter=5),
    ]


def entry(title, meta, bullets=()):
    parts = [Paragraph(title, S["role"]), Paragraph(meta, S["meta"])]
    if bullets:
        parts.append(Spacer(1, 2))
        parts += [Paragraph(item, S["bullet"], bulletText="•") for item in bullets]
    parts.append(Spacer(1, 5))
    return KeepTogether(parts)


# ── Shared facts ─────────────────────────────────────────────────────
SITE = "https://anilkaraca.com"
EMAIL = "anilkaraca140@gmail.com"
PROFILES = (
    f"{link('linkedin.com/in/anil-karaca', 'https://www.linkedin.com/in/anil-karaca/')} | "
    f"{link('github.com/arthlor', 'https://github.com/arthlor')} | "
    f"{link('anilkaraca.com', SITE)}"
)

CONTACT_LINES = {
    "en": [
        f"İzmir, Türkiye | +90 554 656 01 50 | {link(EMAIL, 'mailto:' + EMAIL)}",
        PROFILES,
        "Date of birth: 12.09.1993 | Open to remote work",
    ],
    "tr": [
        f"İzmir, Türkiye | +90 554 656 01 50 | {link(EMAIL, 'mailto:' + EMAIL)}",
        PROFILES,
        "Doğum tarihi: 12.09.1993 | Uzaktan çalışmaya açık",
    ],
}

HEADINGS = {
    "en": {
        "summary": "Summary",
        "skills": "Skills",
        "experience": "Experience",
        "education": "Education",
    },
    "tr": {
        "summary": "Özet",
        "skills": "Beceriler",
        "experience": "Deneyim",
        "education": "Eğitim",
    },
}

NAMES = {"en": "Anil Karaca", "tr": "Anıl Karaca"}

CITY = {
    "en": "İzmir Metropolitan Municipality and İZBETON | İzmir, Türkiye",
    "tr": "İzmir Büyükşehir Belediyesi ve İZBETON | İzmir, Türkiye",
}
NEWSROOMS = "BirGün, dokuz8HABER, Ege’de Sonsöz | Türkiye"

EDUCATION = {
    "en": [
        ("Master’s Degree, New Media", "Kadir Has University | 2017 - 2019",
         "GPA 3.68/4.00. Thesis: News readers’ perception of clickbait news."),
        ("Bachelor’s Degree, Journalism", "Ege University | 2011 - 2015",
         "Erasmus exchange semester, University of Lodz, 2014."),
    ],
    "tr": [
        ("Yüksek Lisans, Yeni Medya", "Kadir Has Üniversitesi | 2017 - 2019",
         "GNO 3,68/4,00. Tez: News readers’ perception of clickbait news."),
        ("Lisans, Gazetecilik", "Ege Üniversitesi | 2011 - 2015",
         "Erasmus değişim dönemi, Lodz Üniversitesi, 2014."),
    ],
}

LANGUAGES = {
    "en": ("Languages", "Turkish (native), English (professional working proficiency)"),
    "tr": ("Diller", "Türkçe (ana dil), İngilizce (profesyonel çalışma yeterliliği)"),
}

# ── CV content ───────────────────────────────────────────────────────
CVS = [
    # 1. Data journalism
    {
        "file": "Anil_Karaca_Data_CV",
        "en": {
            "headline": "Data Journalist | Data Analyst",
            "keywords": "data journalism, data analysis, data visualization, Python, pandas, SQL, PostgreSQL, Excel, D3.js, React, Three.js, QGIS, Datawrapper, Flourish, Tableau, fact-checking",
            "order": ["summary", "skills", "experience", "education"],
            "summary": "Data journalist and analyst with ten years in digital newsrooms and public-sector communications. "
            "Collects, cleans, and analyzes public data with Python and SQL, and publishes the findings as clear, "
            "interactive stories and visualizations in English and Turkish.",
            "skills": [
                ("Data analysis", "Python (pandas, NumPy), SQL (PostgreSQL), Excel, data cleaning, web scraping, descriptive statistics"),
                ("Visualization", "D3.js, React, Three.js, Datawrapper, Flourish, Tableau, QGIS"),
                ("Journalism", "Data reporting, public records research, source verification, fact-checking, editing"),
            ],
            "experience": [
                ("Data Journalist and Developer", "Independent | Remote | 2025 - Present", [
                    "Report and publish data-driven stories on cities, public services, transport, demographics, and elections.",
                    "Collect, clean, and analyze open government data with Python and SQL.",
                    "Build interactive charts, maps, and 3D visualizations with D3.js, React, and Three.js.",
                    "Design PostgreSQL databases and track product analytics in Supabase for my own apps.",
                ]),
                ("Communications Advisor and Data Specialist", CITY["en"] + " | 2019 - 2024", [
                    "Analyzed municipal datasets, including traffic and transit records, with Python and SQL.",
                    "Built dashboards, charts, and reports for decision-makers and the public.",
                    "Turned complex public data into briefings, visual assets, and public data stories.",
                ]),
                ("Digital Journalist and Editor", NEWSROOMS + " | 2014 - 2019", [
                    "Reported, verified, and edited news for digital desks on daily deadlines.",
                    "Worked with public records, survey data, and election results using SQL and Excel.",
                    "Produced charts, maps, and explainers for data-driven coverage.",
                ]),
            ],
        },
        "tr": {
            "headline": "Veri Gazetecisi | Veri Analisti",
            "keywords": "veri gazeteciliği, veri analizi, veri görselleştirme, Python, pandas, SQL, PostgreSQL, Excel, D3.js, React, Three.js, QGIS, Datawrapper, Flourish, Tableau, doğrulama",
            "order": ["summary", "skills", "experience", "education"],
            "summary": "Dijital haber merkezlerinde ve kamu iletişiminde on yıllık deneyime sahip bir veri gazetecisi ve analistiyim. "
            "Kamu verisini Python ve SQL ile toplayıp temizliyor ve analiz ediyor; bulguları Türkçe ve İngilizce "
            "anlaşılır, etkileşimli haberlere ve görselleştirmelere dönüştürüyorum.",
            "skills": [
                ("Veri analizi", "Python (pandas, NumPy), SQL (PostgreSQL), Excel, veri temizleme, web kazıma, betimsel istatistik"),
                ("Görselleştirme", "D3.js, React, Three.js, Datawrapper, Flourish, Tableau, QGIS"),
                ("Gazetecilik", "Veri haberciliği, resmi kayıt araştırması, kaynak doğrulama, teyit, editörlük"),
            ],
            "experience": [
                ("Veri Gazetecisi ve Geliştirici", "Bağımsız | Uzaktan | 2025 - Günümüz", [
                    "Kent, kamu hizmetleri, ulaşım, nüfus ve seçimler üzerine veri haberleri hazırlayıp yayımlıyorum.",
                    "Açık kamu verisini Python ve SQL ile topluyor, temizliyor ve analiz ediyorum.",
                    "D3.js, React ve Three.js ile etkileşimli grafikler, haritalar ve 3D görselleştirmeler geliştiriyorum.",
                    "Kendi uygulamalarım için Supabase’de PostgreSQL veritabanları tasarlıyor, ürün analitiğini izliyorum.",
                ]),
                ("İletişim Danışmanı ve Veri Uzmanı", CITY["tr"] + " | 2019 - 2024", [
                    "Trafik ve toplu taşıma kayıtları dahil belediye verilerini Python ve SQL ile analiz ettim.",
                    "Karar vericiler ve kamuoyu için paneller, grafikler ve raporlar hazırladım.",
                    "Karmaşık kamu verisini brifinglere, görsellere ve veri haberlerine dönüştürdüm.",
                ]),
                ("Dijital Gazeteci ve Editör", NEWSROOMS + " | 2014 - 2019", [
                    "Dijital masalar için günlük yayın temposunda haber yazdım, doğruladım ve düzenledim.",
                    "Resmi kayıtlar, anket verileri ve seçim sonuçlarıyla SQL ve Excel kullanarak çalıştım.",
                    "Veriye dayalı haberler için grafikler, haritalar ve açıklayıcı içerikler ürettim.",
                ]),
            ],
        },
    },
    # 2. Product development
    {
        "file": "Anil_Karaca_Product_Specialist",
        "en": {
            "headline": "Product Developer | Apps, Games, and Digital Products",
            "keywords": "product developer, product management, mobile app development, iOS, React Native, Expo, React, TypeScript, Supabase, PostgreSQL, RevenueCat, Chrome extension, game development, UX, product analytics",
            "order": ["summary", "skills", "experience", "education"],
            "summary": "Independent product developer who designs, builds, and ships apps, games, and browser tools end to end: "
            "scope, UX, development, monetization, and release. Brings ten years of journalism and communications "
            "experience to product writing, user research, and analytics.",
            "skills": [
                ("Product", "Product discovery, scoping, roadmapping, UX design, onboarding, subscription design, product analytics, App Store and Chrome Web Store release"),
                ("Development", "TypeScript, JavaScript, React Native, Expo, React, Astro, Supabase, PostgreSQL, RevenueCat, Chrome extensions, Git"),
                ("Data", "Python, SQL, analytics and event tracking"),
            ],
            "experience": [
                ("Product Developer", "Independent | Remote | 2025 - Present", [
                    "Design, build, and release apps, games, and browser extensions from concept to launch.",
                    "Shipped iOS apps on the App Store and a Chrome extension; a game is in development.",
                    "Develop mobile apps with React Native and Expo, and web products with React and Astro.",
                    "Implement authentication, sync, and shared data with Supabase (PostgreSQL); add subscriptions with RevenueCat.",
                    "Use product analytics to refine onboarding, retention mechanics, and features.",
                ]),
                ("Communications Advisor", CITY["en"] + " | 2019 - 2024", [
                    "Translated stakeholder needs into web portals, reporting tools, and dashboards.",
                    "Scoped requirements and coordinated designers, developers, and agencies through delivery.",
                ]),
                ("Digital Journalist and Editor", NEWSROOMS + " | 2014 - 2019", [
                    "Built reader-facing interactive graphics and data tools for digital coverage.",
                    "Analyzed public data with SQL and Excel on daily deadlines.",
                ]),
            ],
        },
        "tr": {
            "headline": "Ürün Geliştirici | Uygulamalar, Oyunlar ve Dijital Ürünler",
            "keywords": "ürün geliştirici, ürün yönetimi, mobil uygulama geliştirme, iOS, React Native, Expo, React, TypeScript, Supabase, PostgreSQL, RevenueCat, Chrome eklentisi, oyun geliştirme, UX, ürün analitiği",
            "order": ["summary", "skills", "experience", "education"],
            "summary": "Uygulama, oyun ve tarayıcı araçlarını uçtan uca tasarlayıp geliştiren ve yayımlayan bağımsız bir ürün "
            "geliştiriciyim: kapsam, UX, geliştirme, gelir modeli ve yayın. Gazetecilik ve iletişimdeki on yıllık "
            "deneyimimi ürün metinlerine, kullanıcı araştırmasına ve analitiğe taşıyorum.",
            "skills": [
                ("Ürün", "Ürün keşfi, kapsam belirleme, yol haritası, UX tasarımı, onboarding, abonelik tasarımı, ürün analitiği, App Store ve Chrome Web Store yayını"),
                ("Geliştirme", "TypeScript, JavaScript, React Native, Expo, React, Astro, Supabase, PostgreSQL, RevenueCat, Chrome eklentileri, Git"),
                ("Veri", "Python, SQL, analitik ve olay takibi"),
            ],
            "experience": [
                ("Ürün Geliştirici", "Bağımsız | Uzaktan | 2025 - Günümüz", [
                    "Uygulama, oyun ve tarayıcı eklentilerini fikirden yayına kadar tasarlıyor, geliştiriyor ve yayımlıyorum.",
                    "App Store’da iOS uygulamaları ve Chrome Web Store’da bir eklenti yayımladım; bir oyun geliştirme aşamasında.",
                    "React Native ve Expo ile mobil uygulamalar, React ve Astro ile web ürünleri geliştiriyorum.",
                    "Supabase (PostgreSQL) ile kimlik doğrulama, senkronizasyon ve ortak veri; RevenueCat ile abonelik kuruyorum.",
                    "Onboarding, kullanıcı bağlılığı ve özellikleri geliştirmek için ürün analitiğini kullanıyorum.",
                ]),
                ("İletişim Danışmanı", CITY["tr"] + " | 2019 - 2024", [
                    "Paydaş ihtiyaçlarını web portallarına, raporlama araçlarına ve panellere dönüştürdüm.",
                    "Gereksinimleri belirledim; tasarımcıları, yazılımcıları ve ajansları teslime kadar koordine ettim.",
                ]),
                ("Dijital Gazeteci ve Editör", NEWSROOMS + " | 2014 - 2019", [
                    "Dijital haberler için okura dönük etkileşimli grafikler ve veri araçları hazırladım.",
                    "Kamu verisini günlük yayın temposunda SQL ve Excel ile analiz ettim.",
                ]),
            ],
        },
    },
    # 3. Communications
    {
        "file": "Anil_Karaca_Communications_Manager",
        "en": {
            "headline": "Corporate Communications Specialist",
            "keywords": "corporate communications, public relations, campaign management, social media management, content strategy, copywriting, editing, video production, agency management, stakeholder management, crisis communication, brand consistency",
            "order": ["summary", "skills", "experience", "education"],
            "summary": "Communications specialist with experience in public-sector campaigns and digital newsrooms. "
            "Plans campaigns, writes and edits copy, produces video, and manages agencies from brief to delivery, "
            "keeping messaging clear and consistent across channels.",
            "skills": [
                ("Communications", "Corporate communications, public relations, campaign planning, crisis communication, stakeholder management, agency management, brand consistency"),
                ("Content", "Copywriting, editing, social media management, content planning, video production and editing, graphic design"),
                ("Data", "Data visualization, dashboards, Python, SQL, Excel"),
            ],
            "experience": [
                ("Writer and Product Developer", "Independent | Remote | 2025 - Present", [
                    "Write product messaging, store listings, and launch communication for my apps and tools.",
                    "Publish data-driven articles in English and Turkish.",
                ]),
                ("Communications Advisor", CITY["en"] + " | 2019 - 2024", [
                    "Planned and ran public campaigns and social media channels for a metropolitan municipality.",
                    "Wrote and edited campaign copy; produced graphics and video for digital channels.",
                    "Briefed advertising and media agencies and reviewed their work through delivery.",
                    "Kept messaging and visual identity consistent across channels and departments.",
                    "Wrote, shot, and edited a short documentary on a municipal field team.",
                    "Prepared dashboards and visual reports that explained public data to executives.",
                ]),
                ("Digital Journalist and Editor", NEWSROOMS + " | 2014 - 2019", [
                    "Reported, verified, and edited news for digital desks on daily deadlines.",
                    "Fact-checked stories and verified sources and public records.",
                    "Produced explainers and graphics for a general audience.",
                ]),
            ],
        },
        "tr": {
            "headline": "Kurumsal İletişim Uzmanı",
            "keywords": "kurumsal iletişim, halkla ilişkiler, kampanya yönetimi, sosyal medya yönetimi, içerik stratejisi, metin yazarlığı, editörlük, video prodüksiyon, ajans yönetimi, paydaş yönetimi, kriz iletişimi, marka tutarlılığı",
            "order": ["summary", "skills", "experience", "education"],
            "summary": "Kamu kampanyalarında ve dijital haber merkezlerinde deneyimli bir iletişim uzmanıyım. "
            "Kampanya planlıyor, metin yazıp düzenliyor, video üretiyor ve ajans işlerini brifingden teslime kadar "
            "yönetiyorum; mesajın tüm kanallarda net ve tutarlı kalmasını sağlıyorum.",
            "skills": [
                ("İletişim", "Kurumsal iletişim, halkla ilişkiler, kampanya planlama, kriz iletişimi, paydaş yönetimi, ajans yönetimi, marka tutarlılığı"),
                ("İçerik", "Metin yazarlığı, editörlük, sosyal medya yönetimi, içerik planlama, video prodüksiyon ve kurgu, grafik tasarım"),
                ("Veri", "Veri görselleştirme, paneller, Python, SQL, Excel"),
            ],
            "experience": [
                ("Yazar ve Ürün Geliştirici", "Bağımsız | Uzaktan | 2025 - Günümüz", [
                    "Uygulamalarım ve araçlarım için ürün mesajlarını, mağaza metinlerini ve lansman iletişimini yazıyorum.",
                    "Türkçe ve İngilizce veri haberleri yayımlıyorum.",
                ]),
                ("İletişim Danışmanı", CITY["tr"] + " | 2019 - 2024", [
                    "Bir büyükşehir belediyesinin kamu kampanyalarını ve sosyal medya kanallarını planlayıp yürüttüm.",
                    "Kampanya metinlerini yazıp düzenledim; dijital kanallar için grafik ve video ürettim.",
                    "Reklam ve medya ajanslarına brif verdim, işlerini teslime kadar denetledim.",
                    "Mesajın ve görsel kimliğin kanallar ve birimler arasında tutarlı kalmasını sağladım.",
                    "Belediyenin bir saha ekibi üzerine kısa bir belgesel yazdım, çektim ve kurguladım.",
                    "Kamu verisini yöneticilere anlatan paneller ve görsel raporlar hazırladım.",
                ]),
                ("Dijital Gazeteci ve Editör", NEWSROOMS + " | 2014 - 2019", [
                    "Dijital masalar için günlük yayın temposunda haber yazdım, doğruladım ve düzenledim.",
                    "Haberlerde teyit yaptım; kaynakları ve resmi kayıtları doğruladım.",
                    "Genel okur için açıklayıcı içerikler ve grafikler hazırladım.",
                ]),
            ],
        },
    },
]


def build(cv, lang):
    data = cv[lang]
    heads = HEADINGS[lang]
    suffix = "_TR" if lang == "tr" else ""
    path = OUT / f"{cv['file']}{suffix}.pdf"

    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_Y,
        bottomMargin=MARGIN_Y,
        title=f"{NAMES[lang]} - {data['headline']}",
        author=NAMES[lang],
        subject=data["headline"],
        keywords=data["keywords"],
        lang=lang,
    )

    story = [
        Paragraph(NAMES[lang], S["name"]),
        Paragraph(data["headline"], S["headline"]),
        Spacer(1, 6),
        *[Paragraph(line, S["contact"]) for line in CONTACT_LINES[lang]],
    ]

    for key in data["order"]:
        story += section(heads[key])
        if key == "summary":
            story.append(Paragraph(data["summary"], S["body"]))
        elif key == "skills":
            for label, text in [*data["skills"], LANGUAGES[lang]]:
                story.append(Paragraph(f"<b>{label}:</b> {text}", S["body"]))
                story.append(Spacer(1, 2))
        elif key == "experience":
            for title, meta, bullets in data["experience"]:
                story.append(entry(title, meta, bullets))
        elif key == "education":
            for degree, meta, note in EDUCATION[lang]:
                story.append(entry(f"{degree} | {meta}", note))

    doc.build(story)
    status = "ok" if doc.page == 1 else f"WARNING: {doc.page} pages"
    print(f"{path.relative_to(ROOT)}  {status}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for cv in CVS:
        for lang in ("en", "tr"):
            build(cv, lang)


if __name__ == "__main__":
    main()
