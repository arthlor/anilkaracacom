# Generates public/anilkaraca_tr.pdf and cvs/*_TR.pdf — keep in sync with src/lib/resume.ts
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

# ── Register TTF fonts for full Unicode / Turkish character support ───
_FONT_DIR = Path("/System/Library/Fonts/Supplemental")
pdfmetrics.registerFont(TTFont("Arial",       _FONT_DIR / "Arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold",   _FONT_DIR / "Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", _FONT_DIR / "Arial Italic.ttf"))
pdfmetrics.registerFont(TTFont("Arial-BI",     _FONT_DIR / "Arial Bold Italic.ttf"))
pdfmetrics.registerFontFamily(
    "Arial",
    normal="Arial", bold="Arial-Bold",
    italic="Arial-Italic", boldItalic="Arial-BI",
)

FONT = "Arial"
FONT_BOLD = "Arial-Bold"
FONT_ITALIC = "Arial-Italic"


class HeightReporter(Flowable):
    def __init__(self, label):
        Flowable.__init__(self)
        self.label = label
    def wrap(self, availWidth, availHeight):
        print(f"[HeightReporter] {self.label} | availHeight: {availHeight:.1f} pt")
        return 0, 0
    def draw(self):
        pass

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CVS_DIR = ROOT / "public" / "cvs"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 15 * mm
MARGIN_Y = 7.0 * mm
CONTENT_W = PAGE_WIDTH - (MARGIN_X * 2)
CONTENT_H = PAGE_HEIGHT - (MARGIN_Y * 2)

# ── colour system (near-monochrome, very restrained) ─────────────────
PALETTE = {
    "paper": colors.white,
    "ink": colors.HexColor("#1d201e"),       # charcoal ink
    "primary": colors.HexColor("#1b5e3a"),   # premium forest green
    "secondary": colors.HexColor("#4a514d"), # deep slate grey
    "muted": colors.HexColor("#7a837e"),     # soft grey
    "rule": colors.HexColor("#d5dbd7"),      # light grey rule
    "rule_light": colors.HexColor("#eef1ef"),# ultra-light rule
    "link": colors.HexColor("#1b5e3a"),      # links match primary
}


def _s(name: str, parent: ParagraphStyle, **kw) -> ParagraphStyle:
    return ParagraphStyle(name=name, parent=parent, **kw)


_BASE = getSampleStyleSheet()

S = {
    # ── header block ─────────────────────────────────────────────────
    "name": _s("Name", _BASE["Heading1"],
               fontName=FONT_BOLD, fontSize=22, leading=24,
               textColor=PALETTE["ink"], spaceAfter=0),

    "subtitle": _s("Subtitle", _BASE["BodyText"],
                    fontName=FONT, fontSize=9.5, leading=13,
                    textColor=PALETTE["primary"], spaceAfter=0),

    "contact": _s("Contact", _BASE["BodyText"],
                   fontName=FONT, fontSize=8.2, leading=11,
                   textColor=PALETTE["muted"], spaceAfter=0),

    # ── summary area ─────────────────────────────────────────────────
    "summary": _s("Summary", _BASE["BodyText"],
                   fontName=FONT, fontSize=9.0, leading=12.2,
                   textColor=PALETTE["secondary"], spaceAfter=0),

    # ── section headings ─────────────────────────────────────────────
    "section": _s("Section", _BASE["BodyText"],
                   fontName=FONT_BOLD, fontSize=8.8, leading=11,
                   textColor=PALETTE["primary"], spaceAfter=2),

    # ── experience entries ───────────────────────────────────────────
    "role": _s("Role", _BASE["BodyText"],
               fontName=FONT_BOLD, fontSize=9.5, leading=12,
               textColor=PALETTE["ink"], spaceAfter=1),

    "org": _s("Org", _BASE["BodyText"],
              fontName=FONT, fontSize=8.3, leading=10.5,
              textColor=PALETTE["muted"], spaceAfter=2.0),

    "date": _s("Date", _BASE["BodyText"],
               fontName=FONT, fontSize=8.2, leading=10.5,
               textColor=PALETTE["muted"], alignment=TA_RIGHT),

    "bullet": _s("Bullet", _BASE["BodyText"],
                  fontName=FONT, fontSize=8.4, leading=11.2,
                  leftIndent=8, firstLineIndent=-6,
                  textColor=PALETTE["secondary"], spaceAfter=2.0),

    # ── toolkit ──────────────────────────────────────────────────────
    "tool_cat": _s("ToolCat", _BASE["BodyText"],
                    fontName=FONT_BOLD, fontSize=8.3, leading=10.5,
                    textColor=PALETTE["ink"]),

    "tool_body": _s("ToolBody", _BASE["BodyText"],
                     fontName=FONT, fontSize=8.4, leading=11.2,
                     textColor=PALETTE["secondary"]),

    # ── education ────────────────────────────────────────────────────
    "edu_inst": _s("EduInst", _BASE["BodyText"],
                    fontName=FONT_BOLD, fontSize=9.0, leading=11.5,
                    textColor=PALETTE["ink"], spaceAfter=0.5),

    "edu_degree": _s("EduDegree", _BASE["BodyText"],
                      fontName=FONT, fontSize=8.3, leading=10.5,
                      textColor=PALETTE["secondary"], spaceAfter=0),

    "edu_detail": _s("EduDetail", _BASE["BodyText"],
                      fontName=FONT, fontSize=8.0, leading=10.5,
                      textColor=PALETTE["muted"], spaceAfter=0),

    # ── publication ──────────────────────────────────────────────────
    "pub_title": _s("PubTitle", _BASE["BodyText"],
                     fontName=FONT_ITALIC, fontSize=8.5, leading=10.5,
                     textColor=PALETTE["ink"], spaceAfter=1),

    "pub_meta": _s("PubMeta", _BASE["BodyText"],
                    fontName=FONT, fontSize=8, leading=9.8,
                    textColor=PALETTE["muted"], spaceAfter=2),

    "pub_body": _s("PubBody", _BASE["BodyText"],
                    fontName=FONT, fontSize=8.1, leading=10.0,
                    textColor=PALETTE["secondary"], spaceAfter=0),

    # ── misc ─────────────────────────────────────────────────────────
    "note": _s("Note", _BASE["BodyText"],
               fontName=FONT, fontSize=8.0, leading=10.5,
               textColor=PALETTE["muted"], spaceAfter=0),
}


# ── link helper ──────────────────────────────────────────────────────
def _link(label: str, url: str) -> str:
    return f'<link href="{url}" color="{PALETTE["link"].hexval()}">{label}</link>'


# ═══════════════════════════════════════════════════════════════════════
# LAYOUT COMPONENTS
# ═══════════════════════════════════════════════════════════════════════

def _header(data):
    """Name + subtitle, clean and simple."""
    return [
        Paragraph("ANIL KARACA", S["name"]),
        Spacer(1, 1),
        Paragraph(data["subtitle"], S["subtitle"]),
    ]


def _contact_bar(data):
    """Compact contact strip: phone / email / site / linkedin / github + dob + location (if present)."""
    items = []
    if data.get("phone"):
        items.append(data["phone"])
    items.extend([
        _link("anilkaraca140@gmail.com", "mailto:anilkaraca140@gmail.com"),
        _link("anilkaraca.com", "https://anilkaraca.com"),
        _link("linkedin.com/in/anil-karaca", "https://www.linkedin.com/in/anil-karaca/"),
        _link("github.com/arthlor", "https://github.com/arthlor"),
    ])
    if data.get("dob"):
        items.append(data["dob"])
    if data.get("location"):
        items.append(data["location"])
    return Paragraph("  ·  ".join(items), S["contact"])


def _section_head(title: str):
    """Simple section heading with thin rule."""
    return [
        Spacer(1, 5.0),
        Paragraph(title, S["section"]),
        HRFlowable(width="100%", thickness=0.4, color=PALETTE["rule"], spaceBefore=1.5, spaceAfter=4.0),
    ]


def _experience(entry):
    """Single experience block with role / org / date and bullets."""
    hdr = Table(
        [[Paragraph(entry["role"], S["role"]),
          Paragraph(entry["date"], S["date"])]],
        colWidths=[CONTENT_W - 34 * mm, 34 * mm],
    )
    hdr.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))

    parts = [hdr, Paragraph(entry["org"], S["org"])]
    for b in entry["bullets"]:
        parts.append(Paragraph(f"• {b}", S["bullet"]))
    parts.append(Spacer(1, 3.0))
    return KeepTogether(parts)


def _toolkit(groups):
    """Category / body table for skills, no background fills."""
    rows = [[Paragraph(f"{cat}:", S["tool_cat"]),
             Paragraph(body, S["tool_body"])] for cat, body in groups]
    tbl = Table(rows, colWidths=[38 * mm, CONTENT_W - 38 * mm], hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("LINEBELOW",   (0, 0), (-1, -2), 0.25, PALETTE["rule_light"]),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",(0, 0), (-1, -1), 6),
        ("TOPPADDING",  (0, 0), (-1, -1), 1.0),
        ("BOTTOMPADDING",(0, 0),(-1, -1), 1.0),
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def _education(entries):
    """Clean, single-column un-tabulated text rows for education."""
    parts = []
    for i, e in enumerate(entries):
        header_text = f"<b>{e['institution']}</b> – {e['degree']} ({e['period']}) · {e['grade']}"
        parts.append(Paragraph(header_text, S["edu_inst"]))
        if e.get("notes"):
            parts.append(Paragraph(e["notes"], S["edu_detail"]))
        if i < len(entries) - 1:
            parts.append(Spacer(1, 1.5))
    return parts


def _project(entry):
    """Compact project block."""
    hdr = Table(
        [[Paragraph(entry["title"], S["role"]),
          Paragraph(entry["date"], S["date"])]],
        colWidths=[CONTENT_W - 34 * mm, 34 * mm],
    )
    hdr.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
    ]))
    
    parts = [
        hdr,
        Paragraph(f'{entry["summary"]} &nbsp; <font color="{PALETTE["primary"].hexval()}"><b>//</b> {entry["stack"]}</font>', S["pub_body"]),
    ]
    return KeepTogether(parts)


# ═══════════════════════════════════════════════════════════════════════
# PAGE CHROME
# ═══════════════════════════════════════════════════════════════════════

def _draw_page(canvas, doc):
    canvas.saveState()

    # clean white background
    canvas.setFillColor(PALETTE["paper"])
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    print(f"Drawing page {doc.page}...")
    canvas.restoreState()


# ═══════════════════════════════════════════════════════════════════════
# SHARED DATA
# ═══════════════════════════════════════════════════════════════════════

SHARED_EDUCATION = [
    {
        "institution": "Kadir Has Üniversitesi",
        "degree": "Yüksek Lisans, Yeni Medya",
        "period": "2017 - 2019",
        "grade": "GNO: 3.68 / 4.00",
        "notes": "Dijital medya, veri analitiği ve nicel araştırma metodolojileri üzerine yoğunlaşarak akademik projeler gerçekleştirdim."
    },
    {
        "institution": "Ege Üniversitesi",
        "degree": "Lisans, Gazetecilik",
        "period": "2011 - 2015",
        "grade": "GNO: 2.94 / 4.00",
        "notes": "2014 yılında Polonya’daki Lodz Üniversitesi’nde Erasmus+ değişim programını başarıyla tamamladım (Dönem GNO: 3.75 / 4.00)."
    }
]


# ═══════════════════════════════════════════════════════════════════════
# REVIZE EDILMIS RESUMES VERI TANIMLAMALARI
# ═══════════════════════════════════════════════════════════════════════

RESUMES = [
    # ── 1. Kurumsal İletişim Uzmanı CV (Corporate Communications) ──────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Communications_Manager_TR.pdf",
        "title": "Anil Karaca - Kurumsal İletişim Uzmanı",
        "subtitle": "Kurumsal İletişim Uzmanı",
        "subject": "Kurumsal İletişim Uzmanı",
        "keywords": "kurumsal iletişim, halkla ilişkiler, marka yönetimi, B2G, paydaş ilişkileri, medya ilişkileri, editörlük, video prodüksiyonu",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "dob": "Doğum Tarihi: 12.09.1993",
        "location": "Global uzaktan | İzmir’de yerinde",
        "page_break_before_projects": True,
        "show_projects": False,
        "summary": (
            "Kurumsal iletişim, halkla ilişkiler, marka yönetimi, kamu paydaş ilişkileri ve çoklu ajans koordinasyonu alanlarında deneyimli bir iletişim uzmanıyım. "
            "Haber merkezi disiplini, kriz iletişimi yaklaşımı ve ürün odaklı dijital bakış açısını birleştirerek; farklı kanallarda marka tutarlılığını güçlendiren, "
            "yönetici iletişimini ve kurumsal mesajları netleştiren çalışmalar yürütüyorum."
        ),
        "skills_title": "TEMEL BECERİLER",
        "tool_groups": [
            ("Kurumsal & Marka İletişimi", "Halkla İlişkiler, Marka Yönetimi, Paydaş Koordinasyonu, Kriz & Risk İletişimi, Yönetici İletişimi"),
            ("İçerik & Medya Prodüksiyonu", "Kurumsal Sosyal Medya Yönetimi, Video Prodüksiyonu, Grafik Tasarım, Metin Yazarlığı, Editöryal Standartlar"),
            ("Ajans & Kampanya Operasyonları", "Ajans Brifing Süreçleri, Tedarikçi Koordinasyonu, Kampanya Stratejisi, Proje Takibi, Kalite Kontrolü"),
            ("Diller", "Türkçe (Ana Dil), İngilizce (Profesyonel Düzey)"),
        ],
        "experience": [
            {
                "role": "Bağımsız Uygulama Geliştirici ve Dijital Hikaye Anlatıcısı",
                "org": "Serbest Zamanlı ve Bağımsız Projeler | Uzaktan",
                "date": "2025 - Günümüz",
                "bullets": [
                    "Ürün Mesajlaşması ve Lansman Stratejisi: App Store'da yayınlanan 4 iOS uygulaması için uçtan uca ürün mesajlarını ve lansman iletişim süreçlerini yönettim.",
                    "Dijital Hikaye Anlatıcılığı ve Vaka Çalışmaları: Editöryal netlik ile görsel tasarımı harmanlayan web portföyleri, interaktif görsel anlatılar ve vaka çalışmaları hazırladım."
                ]
            },
            {
                "role": "İletişim Danışmanı / Kurumsal İletişim Uzmanı",
                "org": f"{_link('İzmir Büyükşehir Belediyesi', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Marka ve Medya Stratejisi: 4,5 milyondan fazla nüfusa sahip bir büyükşehir belediyesinin çok platformlu marka iletişimini yönettim; organik sosyal medya hesaplarını ve video içerik kampanyalarını yürüttüm.",
                    "Ajans ve Tedarikçi Yönetimi: Dış reklam ve medya ajanslarıyla iş akışlarını koordine ettim; kreatif brifing süreçlerini ve marka standartlarına uyumu optimize ettim.",
                    "Paydaş İletişimi ve Raporlama: Karmaşık kamusal konuları yönetici mesajlarına dönüştüren web raporlama portalları ve görsel paneller kurguladım."
                ]
            },
            {
                "role": "Dijital Gazeteci / Editör",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Haber Merkezi Editörlüğü: Yayıncılık standartlarına uygun olarak kamu yararını gözeten araştırmacı dijital haberler ve içerikler ürettim.",
                    "Seçim Görselleştirmeleri ve Veri Haberleri: Seçim haberleri için etkileşimli grafikler, haritalar ve veri odaklı görsel anlatılar kurguladım.",
                    "Kamu Kayıtları ve Doğrulama: Haber merkezi temposunda doğruluk kontrolü (fact-checking), kaynak doğrulama ve kamu kayıtları araştırmaları yürüttüm."
                ]
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Tüm proje detayları, ürün dokümantasyonları ve vaka çalışmaları {_link('anilkaraca.com', 'https://anilkaraca.com')} adresinde yer almaktadır.",
    },

    # ── 2. Veri Gazetecisi & Analisti CV (Data CV) ──────────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Data_CV_TR.pdf",
        "title": "Anil Karaca - Veri Analisti & Veri Gazetecisi",
        "subtitle": "Veri Analisti & Veri Gazetecisi",
        "subject": "Veri Analisti & Veri Gazetecisi",
        "keywords": "veri analisti, veri gazeteciliği, SQL, PostgreSQL, Python, Pandas, veri görselleştirme, ETL, scrollytelling, D3.js",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "dob": "Doğum Tarihi: 12.09.1993",
        "location": "Global uzaktan | İzmir’de yerinde",
        "page_break_before_projects": True,
        "show_projects": False,
        "summary": (
            "Araştırmacı merak ve editoryal standartlarla hareket eden bir veri gazetecisi ve görsel anlatıcıyım. "
            "Haber merkezi disiplinini modern veri analizi araçlarıyla harmanlayarak; yapılandırılmamış resmi kayıtları ve kamu verilerini "
            "etkileşimli görsel anlatılara, yöneticiler ve paydaşlar için kapsamlı kontrol panellerine ve yüksek etkili veri haberlerine dönüştürüyorum."
        ),
        "skills_title": "TEMEL BECERİLER",
        "tool_groups": [
            ("Veri Sistemleri & İşleme", "SQL (PostgreSQL), Python (Pandas, NumPy, Web Kazıma / Scraping), Supabase, Yapılandırılmamış Veri İşleme, Şema Tasarımı"),
            ("Veri Anlatıcılığı & Ön Yüz", "D3.js, React, Astro, Etkileşimli Scrollytelling, SVG, Framer Motion, GeoJSON Haritalama, Kontrol Panelleri"),
            ("Gazetecilik & İş Zekası (BI)", "Tableau, Flourish, Datawrapper, Coğrafi Bilgi Sistemleri (QGIS), GeoJSON, Excel, Veri Doğrulama"),
            ("Diller", "Türkçe (Ana Dil), İngilizce (Profesyonel Düzey)"),
        ],
        "experience": [
            {
                "role": "Bağımsız Uygulama Geliştirici ve Veri Gazetecisi",
                "org": "Serbest Zamanlı ve Bağımsız Projeler | Uzaktan",
                "date": "2025 - Günümüz",
                "bullets": [
                    "Nicel Araştırma ve Görsel Anlatıcılık: React, Astro ve D3.js kullanarak özel etkileşimli grafikler, scrollytelling veri hikayeleri ve görsel anlatılar kurguladım.",
                    "Mobil Ürün ve Kullanıcı Analitiği: Kendi geliştirdiğim 4 iOS uygulaması için Supabase üzerinde veritabanı şemaları tasarladım ve kullanıcı dönüşüm hunilerini izledim.",
                    "Veri İşleme: Web hikayeleri ve mobil ürünler için veri kümelerini temizleyen ve yapılandıran Python ve SQL betikleri yazdım."
                ]
            },
            {
                "role": "İletişim Danışmanı & Veri Uzmanı",
                "org": f"{_link('İzmir Büyükşehir Belediyesi', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Yönetici ve Paydaş Kontrol Panelleri: Kurumsal paydaşlar ve üst düzey yöneticiler için kapsamlı self-servis web panelleri, raporlama sistemleri ve özel D3.js grafikleri kurguladım.",
                    "Veri Anlatıları ve Yönetici Raporları: Ham kentsel veri kümelerini yönetici özetlerine, görsel materyallere ve kamuya açık veri hikayelerine dönüştürdüm."
                ]
            },
            {
                "role": "Dijital Gazeteci / Editör",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Kamu Kayıtları ve Seçim Analitiği: Yoğun haber merkezi temposu altında haber dosyaları çıkarmak için SQL, Python ve Excel ile kamu kayıtlarını ve seçim verilerini analiz ettim.",
                    "Seçim Görselleştirmeleri ve Veri Haberleri: Seçim haberleri ve analiz dosyaları için etkileşimli grafikler, haritalar ve veri odaklı görsel anlatılar kurguladım.",
                    "Veri Temini ve Doğrulama: Haber dosyaları için yapılandırılmamış resmi kayıtları ve anket verilerini topladım, temizledim ve doğruladım."
                ]
            }
        ],
        "projects_title": "SEÇİLMİŞ PROJELER & KANITLAR",
        "projects": [
            {
                "title": _link("İzmir Trafik Koridoru Risk Analizi", "https://anilkaraca.com/articles/izmir-trafik-kazasi-raporu"),
                "date": "2024",
                "summary": "Python (Pandas), Plotly, React ve Astro kullanarak, 17.000'i aşkın kaza kaydından elde edilen veriler üzerinden kurguladığım zaman-yoğunluk haritalaması ve risk analizi çalışması.",
                "stack": "Veri & Görselleştirme"
            },
            {
                "title": _link("İstanbul İtfaiyesi Pati Mesaisi", "https://anilkaraca.com/articles/yanginlarin-otesinde-itfaiye-faaliyet-raporu"),
                "date": "2026",
                "summary": "React, D3.js, Framer Motion ve SVG ile 296.000'den fazla acil durum müdahale kaydını inceleyerek hazırladığım etkileşimli veri hikayesi çalışması.",
                "stack": "Etkileşimli Veri Hikayesi"
            },
            {
                "title": _link("Gerçek Zamanlı Seçim Sonuçları Takipçileri", "https://anilkaraca.com/articles/turkey-elections-red-wave"),
                "date": "2014 - 2019",
                "summary": "Hız, doğruluk kontrolü, SQL/Excel veri analizi ve net görsel anlatımı birleştirerek haber merkezleri için canlı grafik ve takip sistemlerinin tasarlanması.",
                "stack": "Haber Merkezi Veri Ürünleri"
            },
            {
                "title": _link("Tık Tuzağı Algısı Araştırması", "https://hdl.handle.net/20.500.12469/2753"),
                "date": "2019",
                "summary": "Nicel anket analizi ile dijital haber yöneticileriyle gerçekleştirilen derinlemesine mülakatları harmanlayan yüksek lisans tez çalışması.",
                "stack": "Tez & Yayın"
            },
            {
                "title": _link("Veri Kontrol Panelleri & Analitik Raporlar", "https://anilkaraca.com/articles/izmir-toplu-tasima"),
                "date": "2019 - 2024",
                "summary": "Karmaşık veri setlerini ve resmi kayıtları daha şeffaf kılmak için etkileşimli veri kontrol panelleri (dashboards) ve görsel raporlar tasarladığım çalışmalarım.",
                "stack": "Veri & İletişim Araçları"
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Tüm proje detayları ve analitik çalışmalar {_link('anilkaraca.com', 'https://anilkaraca.com')} adresinde yer almaktadır.",
    },

    # ── 3. Mobil Ürün Uzmanı & Geliştirici CV ───────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Product_Specialist_TR.pdf",
        "title": "Anil Karaca - Mobil Ürün Uzmanı & Geliştirici",
        "subtitle": "Mobil Ürün Uzmanı & Geliştirici",
        "subject": "Mobil Ürün Uzmanı & Geliştirici",
        "keywords": "mobil ürün uzmanı, uygulama geliştirici, React Native, Expo, mobil UX, onboarding, abonelik sistemleri, RevenueCat, Supabase, ürün analitiği",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "dob": "Doğum Tarihi: 12.09.1993",
        "location": "Global uzaktan | İzmir’de yerinde",
        "page_break_before_projects": True,
        "show_projects": False,
        "summary": (
            "Mobil uygulama geliştirme, veri analitiği ve paydaş yönetimi alanlarında deneyimli bir mobil ürün uzmanıyım. "
            "React Native, Expo, iOS App Store yayın süreçleri, mobil UX tasarımı, abonelik entegrasyonu ve onboarding "
            "akışlarını uçtan uca yönetiyorum. Kullanıcı ihtiyaçları ile teknik altyapıyı uyumlu hale getirerek kullanıcı tutundurma ve ürün büyümesini optimize ediyorum."
        ),
        "skills_title": "TEMEL BECERİLER",
        "tool_groups": [
            ("Mobil Ürün & UX", "React Native, Expo, iOS App Store Yayıncılığı, Mobil UX Tasarımı, Onboarding Akışları, RevenueCat Abonelikleri"),
            ("Teknik Altyapı", "TypeScript, JavaScript, React, Astro, Tailwind CSS, Supabase Auth & DB, PostgreSQL, Git/GitHub"),
            ("Ürün Stratejisi & Analitik", "Ürün Keşfi, Özellik Kapsamlandırma, Yol Haritası, Ürün Telemetrisi, Kullanıcı Kohort Analizi, Python, SQL"),
            ("Diller", "Türkçe (Ana Dil), İngilizce (Profesyonel Düzey)"),
        ],
        "experience": [
            {
                "role": "Bağımsız Mobil Uygulama Geliştiricisi ve Ürün Uzmanı",
                "org": "Serbest Zamanlı ve Bağımsız Projeler | Uzaktan",
                "date": "2025 - Günümüz",
                "bullets": [
                    "Mobil Uygulama Yayıncılığı: React Native ve Expo kullanarak 4 iOS uygulamasını konsept aşamasından lansmana kadar App Store'da yayınladım.",
                    "UX ve Abonelik Akışları: Supabase yetkilendirme ve veritabanı altyapısını kurguladım; kullanıcı alıştırma adımlarını ve abonelik dönüşümlerini optimize eden RevenueCat paywall entegrasyonu sağladım.",
                    "Ürün Telemetrisi ve İterasyon: Kullanıcı etkileşim loglarını takip ettim; ChoreUs için alışkanlık takibi ve ilerleme dinamikleri içeren oyunlaştırma kurguları geliştirdim."
                ]
            },
            {
                "role": "İletişim Danışmanı",
                "org": f"{_link('İzmir Büyükşehir Belediyesi', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Ürün Analitiği ve Web Araçları: Paydaş ihtiyaçlarını özel web portallarına, raporlama sistemlerine ve etkileşimli panellere dönüştürdüm.",
                    "Gereksinim Yönetimi: Paydaşları, tasarımcıları ve yazılım mühendislerini ürün teslim hedefleri doğrultusunda koordine ettim."
                ]
            },
            {
                "role": "Dijital Gazeteci / Editör",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Analitik Araştırma ve Araçlar: Yoğun haber temposu altında SQL ve Python ile kamu verilerini analiz ederek veri odaklı grafikler ürettim.",
                    "Ürün Odaklı Uygulama: Hızlı yayınlanan içerikler ve okuyucu odaklı etkileşimli araçlar için teslimat odaklı yaklaşım sergiledim."
                ]
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Tüm ürün vaka çalışmaları ve uygulama bağlantıları {_link('anilkaraca.com', 'https://anilkaraca.com')} adresinde yer almaktadır.",
    },
]


# ═══════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════

def build_resume(data):
    frame = Frame(MARGIN_X, MARGIN_Y, CONTENT_W, CONTENT_H,
                  leftPadding=0, rightPadding=0,
                  topPadding=0, bottomPadding=0, id="main")
    print(f"Frame Height: {frame._height} pt, CONTENT_H: {CONTENT_H} pt")

    doc = BaseDocTemplate(
        str(data["path"]), pagesize=A4,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_Y, bottomMargin=MARGIN_Y,
        title=data["title"], author="ANIL KARACA",
        subject=data.get("subject", "Veri Gazetecisi, Geliştirici, Ürün Geliştirici — Özgeçmiş"),
        keywords=data.get("keywords", "veri gazeteciliği, geliştirici, React Native, Expo, Python, D3.js, Astro, ön uç, mobil uygulamalar"),
    )
    doc.addPageTemplates([PageTemplate(id="cv", frames=[frame],
                                       onPage=_draw_page)])

    story = []

    # ── header ───────────────────────────────────────────────────────
    story += _header(data)
    story.append(Spacer(1, 2))
    story.append(_contact_bar(data))

    # ── summary ──────────────────────────────────────────────────────
    story.append(Spacer(1, 4))
    story.append(Paragraph(data["summary"], S["summary"]))

    # ── toolkit (Skills moved to the top!) ───────────────────────────
    skills_title = data.get("skills_title", "Yetenekler")
    story += _section_head(skills_title)
    story.append(_toolkit(data["tool_groups"]))

    # ── experience ───────────────────────────────────────────────────
    story += _section_head("Deneyim")
    for entry in data["experience"]:
        story.append(_experience(entry))

    # ── education ────────────────────────────────────────────────────
    story += _section_head("Eğitim")
    story += _education(data["education"])

    # ── projects ─────────────────────────────────────────────────────
    # Projects section removed to keep the CVs on a single page.
    # Projects are instead referenced in the footer link to the website.


    # ── footer note ──────────────────────────────────────────────────
    if data.get("footer"):
        story += [Spacer(1, 4), Paragraph(data["footer"], S["note"])]

    story_with_reporters = []
    for idx, el in enumerate(story):
        # Determine descriptive name
        name = el.__class__.__name__
        if name == 'Paragraph':
            name += f" ({el.text[:20]}...)"
        story_with_reporters.append(HeightReporter(f"El {idx:02d} {name}"))
        story_with_reporters.append(el)

    doc.build(story_with_reporters)


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    CVS_DIR.mkdir(parents=True, exist_ok=True)

    for resume_data in RESUMES:
        print(f"Building resume: {resume_data['path'].name}")
        build_resume(resume_data)


if __name__ == "__main__":
    main()
