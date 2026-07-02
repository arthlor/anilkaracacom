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
MARGIN_Y = 8 * mm
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
                   fontName=FONT, fontSize=8, leading=11,
                   textColor=PALETTE["muted"], spaceAfter=0),

    # ── summary area ─────────────────────────────────────────────────
    "summary": _s("Summary", _BASE["BodyText"],
                   fontName=FONT, fontSize=9, leading=12,
                   textColor=PALETTE["secondary"], spaceAfter=0),

    # ── section headings ─────────────────────────────────────────────
    "section": _s("Section", _BASE["BodyText"],
                   fontName=FONT_BOLD, fontSize=8.5, leading=10,
                   textColor=PALETTE["primary"], spaceAfter=3),

    # ── experience entries ───────────────────────────────────────────
    "role": _s("Role", _BASE["BodyText"],
               fontName=FONT_BOLD, fontSize=9.5, leading=12,
               textColor=PALETTE["ink"], spaceAfter=0.5),

    "org": _s("Org", _BASE["BodyText"],
              fontName=FONT, fontSize=8.2, leading=10,
              textColor=PALETTE["muted"], spaceAfter=0.5),

    "date": _s("Date", _BASE["BodyText"],
               fontName=FONT, fontSize=8, leading=10,
               textColor=PALETTE["muted"], alignment=TA_RIGHT),

    "bullet": _s("Bullet", _BASE["BodyText"],
                  fontName=FONT, fontSize=8.4, leading=10.5,
                  leftIndent=8, firstLineIndent=-6,
                  textColor=PALETTE["secondary"], spaceAfter=0.3),

    # ── toolkit ──────────────────────────────────────────────────────
    "tool_cat": _s("ToolCat", _BASE["BodyText"],
                    fontName=FONT_BOLD, fontSize=8, leading=10,
                    textColor=PALETTE["ink"]),

    "tool_body": _s("ToolBody", _BASE["BodyText"],
                     fontName=FONT, fontSize=8.4, leading=11,
                     textColor=PALETTE["secondary"]),

    # ── education ────────────────────────────────────────────────────
    "edu_inst": _s("EduInst", _BASE["BodyText"],
                    fontName=FONT_BOLD, fontSize=9, leading=11,
                    textColor=PALETTE["ink"], spaceAfter=0.5),

    "edu_degree": _s("EduDegree", _BASE["BodyText"],
                      fontName=FONT, fontSize=8.2, leading=10,
                      textColor=PALETTE["secondary"], spaceAfter=0),

    "edu_detail": _s("EduDetail", _BASE["BodyText"],
                      fontName=FONT, fontSize=7.8, leading=10,
                      textColor=PALETTE["muted"], spaceAfter=0),

    # ── publication ──────────────────────────────────────────────────
    "pub_title": _s("PubTitle", _BASE["BodyText"],
                     fontName=FONT_ITALIC, fontSize=8.8, leading=11,
                     textColor=PALETTE["ink"], spaceAfter=1),

    "pub_meta": _s("PubMeta", _BASE["BodyText"],
                    fontName=FONT, fontSize=8, leading=10,
                    textColor=PALETTE["muted"], spaceAfter=2),

    "pub_body": _s("PubBody", _BASE["BodyText"],
                    fontName=FONT, fontSize=8.2, leading=10.2,
                    textColor=PALETTE["secondary"], spaceAfter=0),

    # ── misc ─────────────────────────────────────────────────────────
    "note": _s("Note", _BASE["BodyText"],
               fontName=FONT, fontSize=7.8, leading=10,
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
    """Compact contact strip: phone / email / site / linkedin / github + location (if present)."""
    items = []
    if data.get("phone"):
        items.append(data["phone"])
    items.extend([
        _link("anilkaraca140@gmail.com", "mailto:anilkaraca140@gmail.com"),
        _link("anilkaraca.com", "https://anilkaraca.com"),
        _link("linkedin.com/in/anil-karaca", "https://www.linkedin.com/in/anil-karaca/"),
        _link("github.com/arthlor", "https://github.com/arthlor"),
    ])
    if data.get("location"):
        items.append(data["location"])
    return Paragraph("  ·  ".join(items), S["contact"])


def _section_head(title: str):
    """Simple section heading with thin rule."""
    return [
        Spacer(1, 1),
        Paragraph(title, S["section"]),
        HRFlowable(width="100%", thickness=0.4, color=PALETTE["rule"], spaceBefore=1, spaceAfter=2),
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
    parts.append(Spacer(1, 1))
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
        ("TOPPADDING",  (0, 0), (-1, -1), 1.5),
        ("BOTTOMPADDING",(0, 0),(-1, -1), 1.5),
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
        "location": "Global uzaktan | İzmir’de yerinde",
        "page_break_before_projects": True,
        "summary": (
            "Kurumsal iletişim, halkla ilişkiler, marka yönetimi, kamu paydaş ilişkileri ve çoklu ajans koordinasyonu alanlarında deneyimli bir iletişim uzmanıyım. "
            "Haber merkezi disiplini, kriz/risk iletişimi yaklaşımı ve ürün odaklı dijital bakış açısını birleştirerek; farklı kanallarda marka tutarlılığını güçlendiren, "
            "yönetici iletişimini ve kurumsal mesajları netleştiren çalışmalar yürütüyorum."
        ),
        "skills_title": "TEMEL BECERİLER",
        "tool_groups": [
            ("Kurumsal İletişim", "İletişim Stratejisi, Kamu İlişkileri, Paydaş Koordinasyonu, Kurum İçi ve Dışı İletişim, Marka Yönetimi, Kriz & Risk İletişimi, yönetici iletişimi"),
            ("Sosyal Medya Yönetimi", "Kurumsal Hesap Yönetimi, İçerik Takvimi Hazırlama, Kanal Planlaması, Kampanya Yönetimi, Sosyal Medya Raporlaması, Topluluk Yönetimi"),
            ("İçerik Üretimi", "Belgesel & Video Prodüksiyonu, Grafik Tasarım, Video Kurgu, Metin Yazarlığı, Editörlük, görsel hikâye anlatımı, sunum & rapor tasarımı"),
            ("Ajans & Tedarikçi Yönetimi", "Ajans Brifing Süreçleri, Kreatif Geri Bildirim, Takvim & Proje Yönetimi, Kalite Kontrolü, Marka Tutarlılığı, Süreç Yönetimi"),
            ("Yayıncılık & Medya", "Yayıncılık Standartları, Doğruluk Kontrolü (Fact-Checking), Medya Projeleri, Haber Merkezi Editörlüğü, Kamu Kayıtları Araştırması, Araştırmacı Gazetecilik"),
            ("Dijital & Analitik", "Kamusal veri görselleştirme, etkileşimli kontrol panelleri (dashboard), D3.js, React, Astro, PostgreSQL, Python, Excel, Power BI"),
            ("Diller", "Türkçe (Ana Dil), İngilizce (Profesyonel Düzey)"),
        ],
        "experience": [
            {
                "role": "Bağımsız Uygulama Geliştirici ve Dijital Hikaye Anlatıcısı",
                "org": "Serbest Zamanlı ve Bağımsız Projeler | Uzaktan",
                "date": "2025 - Günümüz",
                "bullets": [
                    "Mobil Ürün ve UX Stratejisi: Son kullanıcıya yönelik (B2C) iOS uygulamalarını App Store'da başarıyla yayınladım; onboarding (kullanıcı alıştırma) akışlarını, ürün mesajlarını ve kullanıcı odaklı iletişim süreçlerini tasarladım.",
                    "Etkileşimli Görsel Anlatım: Editöryal netlik ile teknik tasarımı birleştiren web portföyleri, interaktif veri görselleştirmeleri ve kamuya açık vaka çalışmaları (case study) hazırladım.",
                    f"Dijital Varlık Yönetimi: Kişisel portföyümün ve projelerimin yer aldığı anilkaraca.com web sitesinin tüm tasarım ve geliştirme süreçlerini uçtan uca üstlendim. ({_link('anilkaraca.com', 'https://anilkaraca.com')})"
                ]
            },
            {
                "role": "İletişim Danışmanı / Kurumsal İletişim Uzmanı",
                "org": f"{_link('İzmir Büyükşehir Belediyesi', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Sosyal Medya Stratejisi ve Etkileşim: 4,5 milyondan fazla nüfusa sahip bir büyükşehir belediyesinin çok platformlu marka stratejisini yönettim; hedef odaklı ve video temelli içerik kampanyalarıyla organik sosyal kanalları büyüterek organik etkileşimde büyüme sağladım.",
                    "Ajans ve Tedarikçi Yönetimi: Reklam ve medya ajanslarıyla ilişkileri ve kreatif iş akışlarını koordine ettim; kreatif brifing süreçlerini optimize ederek teslim sürelerini kısalttım ve kurumsal marka standartlarına tam uyum sağladım.",
                    "Paydaş Koordinasyonu ve Raporlama: Karmaşık kamusal veri kümelerini etkileşimli görsel kontrol panellerine (dashboard) ve kurumsal raporlara dönüştürerek, kamu paydaşları için iletişimde şeffaflığı artırdım."
                ]
            },
            {
                "role": "Dijital Gazeteci / Editör",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Güçlü yayıncılık standartlarına uygun olarak toplumsal, siyasi ve kamu yararını gözeten araştırmacı dijital haberler ürettim.",
                    "Kamuoyunun karmaşık gündemleri hızla kavramasını sağlayan gerçek zamanlı seçim grafikleri ve açıklayıcı dijital içerikler tasarladım.",
                    "Haber merkezi temposunda doğruluk kontrolü (fact-checking), kaynak doğrulama ve resmi kamu kayıtları araştırmaları yürüttüm."
                ]
            }
        ],
        "projects_title": "SEÇİLMİŞ PROJELER & KANITLAR",
        "projects": [
            {
                "title": "Kurumsal Sosyal Medya Hesap Yönetimi",
                "date": "2019 - 2024",
                "summary": "İçerik planlaması, yayın koordinasyonu ve kurumsal onay süreçlerini üstlenerek sosyal medya kanallarının yönetilmesi.",
                "stack": "Kurumsal & Kamu Sektörü İletişimi"
            },
            {
                "title": _link("Ekmeğimizi Büyütüyoruz – Toplumsal Belgesel", "https://www.youtube.com/watch?v=iZtaIuGnjzU"),
                "date": "2021",
                "summary": "Dezavantajlı mahallelerdeki hizmet sunumunu ve toplumsal hikayeleri anlatan; senaryosunu yazıp çekim ve kurgusunu üstlendiğim 9 dakikalık sosyal belgesel projesi.",
                "stack": "Dijital İçerik Üretimi"
            },
            {
                "title": "Ajans ve Tedarikçi Yönetimi",
                "date": "2019 - 2024",
                "summary": "Brief süreçleri, kreatif geri bildirim mekanizmaları, prodüksiyon takibi ve kalite kontrolleriyle dış kreatif ajansların yönetilmesi.",
                "stack": "Kurumsal İletişim Operasyonları"
            },
            {
                "title": _link("Toplumsal Raporlar, Paneller ve Kamu Anlatıları", "https://anilkaraca.com/articles/izmir-toplu-tasima"),
                "date": "2019 - 2024",
                "summary": "Karmaşık kentsel veri setlerini ve kamusal konuları anlaşılır kurumsal raporlara, interaktif panellere ve halka açık dijital hikayelere dönüştüren projeler.",
                "stack": "Paydaş Odaklı İletişim"
            },
            {
                "title": _link("Gerçek Zamanlı Seçim Yayını Grafikleri", "https://anilkaraca.com/articles/turkey-elections-red-wave"),
                "date": "2014 - 2019",
                "summary": "Hız, doğruluk kontrolü ve görsel netliği birleştirerek hareketli seçim geceleri için canlı görsel iletişim formatlarının kurgulanması.",
                "stack": "Dijital Gazetecilik & Kamu İletişimi"
            },
            {
                "title": f"{_link('Bohça', 'https://anilkaraca.com/projects/bohca')}, {_link('ChoreUs', 'https://anilkaraca.com/projects/choreus')}, ve {_link('Yeşer', 'https://anilkaraca.com/projects/yeser')} Ürün İletişimi",
                "date": "2025 - Günümüz",
                "summary": "Kendi geliştirdiğim iOS uygulamalarımın kullanıcı arayüzü metinleri, onboarding akış kurguları ve portföy vaka çalışması dokümantasyonlarının hazırlanması.",
                "stack": "Ürün Mesajlaşması & Metin Yazarlığı"
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Tüm proje detayları, ürün dokümantasyonları ve vaka çalışmaları {_link('anilkaraca.com', 'https://anilkaraca.com')} adresinde yer almaktadır.",
    },

    # ── 2. Veri Gazetecisi & Analisti CV (Data CV) ──────────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Data_CV_TR.pdf",
        "title": "Anil Karaca - Veri Gazetecisi & Veri Analisti",
        "subtitle": "Veri Gazetecisi & Veri Analisti",
        "subject": "Veri Gazetecisi & Veri Analisti",
        "keywords": "veri gazeteciliği, veri analisti, SQL, PostgreSQL, Python, Pandas, veri görselleştirme, ETL, scrollytelling, D3.js",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "location": "Global uzaktan | İzmir’de yerinde",
        "page_break_before_projects": True,
        "summary": (
            "Veritabanı tasarımı, ETL süreçleri ve tanısal veri analitiği alanlarında uzmanlaşmış bir veri analisti ve gazeteciyim. "
            "SQL, Python, Pandas ve veri temizleme süreçlerindeki deneyimimle; yapılandırılmamış verileri etkileşimli kontrol panellerine (dashboard) "
            "ve açıklayıcı veri hikayelerine dönüştürerek paydaşların veri odaklı stratejik kararlar almasını kolaylaştırıyorum."
        ),
        "skills_title": "TEMEL BECERİLER",
        "tool_groups": [
            ("Veri Analizi & İş Zekası (BI)", "Python, Pandas, NumPy, SQL, PostgreSQL, Supabase, Coğrafi Bilgi Sistemleri (QGIS), ETL Süreçleri, Veritabanı Tasarımı & Modelleme, İş Zekası Araçları (Tableau, Power BI), Excel"),
            ("Görselleştirme", "Etkileşimli Scrollytelling (Kaydırılabilir Hikaye Anlatımı), D3.js, Plotly, React, Astro, SVG, Framer Motion, Etkileşimli Paneller (Dashboard), Coğrafi Haritalar"),
            ("Gazetecilik & Medya", "Araştırmacı Gazetecilik, Kamu Kayıtları, Seçim Verisi, Doğruluk Kontrolü (Fact-Checking), Yayın Standartları, Veri Temini, Anket Metodolojisi"),
            ("Ürün & Geliştirme", "Astro & MDX İçerik Sistemleri, JavaScript, TypeScript, Tailwind CSS, Ürün Analitiği, Paydaş İletişimi, Çevik (Agile) İş Akışları, Git/GitHub"),
            ("Diller", "Türkçe (Ana Dil), İngilizce (Profesyonel Düzey)"),
        ],
        "experience": [
            {
                "role": "Bağımsız Uygulama Geliştirici ve Veri Gazetecisi",
                "org": "Serbest Zamanlı ve Bağımsız Projeler | Uzaktan",
                "date": "2025 - Günümüz",
                "bullets": [
                    "Nicel Araştırma ve Görselleştirme: React ve Astro kullanarak özel interaktif grafikler, scrollytelling hikayeleri ve keşifsel analizler tasarlayıp yayınladım.",
                    "Veri Modelleme ve Ürün Analitiği: Kendi yayınladığım 4 mobil uygulama için ürün telemetrisi ve veritabanı olaylarını analiz ettim, SQL sorgu performansını ve veri toplama yollarını optimize ettim.",
                    "ETL Süreçleri: Python, SQL ve Supabase entegrasyonları aracılığıyla veri ayrıştırma, temizleme ve depolama süreçlerini yönettim."
                ]
            },
            {
                "role": "İletişim Danışmanı",
                "org": f"{_link('İzmir Büyükşehir Belediyesi', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Veri Modelleme ve ETL Süreçleri: Kamu teknolojisi (civic tech) yetkinliklerimi kullanarak; 17.000'den fazla kentsel ulaşım ve trafik kazası kaydını temizlemek, kurumsal raporlama sistemlerini optimize etmek üzere PostgreSQL veritabanı şemaları ve otomatik ETL süreçleri tasarladım.",
                    "İş Zekası (BI) ve Kontrol Panelleri: Belediye iştiraklerinin veri odaklı ulaşım politikası kararları alabilmesi için etkileşimli, self-servis dashboard’lar ve özel D3.js görselleştirmeleri kurguladım.",
                    "Tanısal ve Açıklayıcı Raporlama: Karmaşık ham veri kümelerini şeffaf kamusal anlatılara, görsel raporlara ve yönetici özetlerine dönüştürdüm."
                ]
            },
            {
                "role": "Dijital Gazeteci / Editör",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Keşifsel Veri Analizi (EDA): Gelişmiş SQL sorguları (CTE'ler, join'ler, pencere fonksiyonları) ve Python kullanarak yapılandırılmamış resmi kamu kayıtlarını ve seçim verilerini analiz ettim; ulusal haber yayınlarını destekleyen gerçek zamanlı takip sistemleri kurguladım.",
                    "Gerçek Zamanlı Veri Ürünleri: Haber merkezleri için canlı seçim sonuç ekranları, dinamik görsel grafikler ve veri akışları tasarladım.",
                    "Veri Temini ve Doğrulama: Yoğun zaman kısıtları altında araştırmacı gazetecilik dosyaları için veri toplama, temizleme ve doğrulama çalışmaları yürüttüm."
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
        "location": "Global uzaktan | İzmir’de yerinde",
        "page_break_before_projects": True,
        "summary": (
            "Mobil uygulama geliştirme, veri analitiği ve paydaş yönetimi alanlarında hibrit deneyime sahip bir mobil ürün uzmanıyım. "
            "React Native, Expo, iOS App Store yayın süreçleri, mobil UX tasarımı, uygulama içi abonelik entegrasyonu ve onboarding "
            "akışlarını uçtan uca yönetiyorum. Kullanıcı ihtiyaçları ile teknik uygulanabilirliği uyumlu hale getirerek kullanıcı tutundurma (retention) "
            "ve büyüme metriklerini optimize ediyorum."
        ),
        "skills_title": "TEMEL BECERİLER",
        "tool_groups": [
            ("Ürün Yönetimi", "Ürün Keşfi (Product Discovery), Özellik Kapsamlandırma, Yol Haritası (Roadmapping), PRD'ler (Ürün Gereksinim Dokümanları), RICE Önceliklendirme, Ürün Analitiği, Çevik Metotlar, AI destekli ürün iterasyonu"),
            ("Mobil Ürün", "React Native, Expo, iOS App Store Yayıncılığı, Mobil UX Tasarımı, Onboarding Deneyimleri, Oyunlaştırma Döngüleri, alışkanlık tasarımı ve streak mekanikleri, RevenueCat abonelikleri"),
            ("Teknik Altyapı", "TypeScript, JavaScript, React, Astro, Tailwind CSS, Supabase Yetkilendirme (Auth), PostgreSQL, SQL, Gerçek Zamanlı Veri Senkronizasyonu, Git/GitHub"),
            ("Veri & Araştırma", "Python, Pandas, Ürün Metrikleri, A/B Testleri, Kullanıcı Kohort Analizi, Excel, Google Sheets"),
            ("İletişim", "Ürün Mesajlaşması, Yayıncılık Standartları, Doğruluk Kontrolü (Fact-Checking), Departmanlar Arası İletişim, Dokümantasyon"),
            ("Diller", "Türkçe (Ana Dil), İngilizce (Profesyonel Düzey)"),
        ],
        "experience": [
            {
                "role": "Bağımsız Mobil Uygulama Geliştiricisi ve Ürün Uzmanı",
                "org": "Serbest Zamanlı ve Bağımsız Projeler | Uzaktan",
                "date": "2025 - Günümüz",
                "bullets": [
                    "Uçtan Uca Ürün Teslimi: Konsept aşamasından (MVP) lansmana kadar son kullanıcı odaklı 4 iOS ürününü App Store'da yayınladım; React Native ve Expo ile geliştirme süreçlerini yöneterek aktif App Store ürünlerini başarıyla hayata geçirdim.",
                    "Mobil UX ve Gelir Optimizasyonu: Güvenli Supabase yetkilendirme (auth) ve veritabanı akışları kurguladım, RevenueCat abonelik altyapısını entegre ettim; onboarding adımlarındaki sürtünmeyi azaltan ve deneme sürümüne dönüşümü (trial conversion) destekleyen çok aşamalı abonelik ödeme duvarları (paywall) tasarladım.",
                    "Veri Odaklı Özellik İterasyonu: Kullanıcı davranış loglarını analiz ederek ChoreUs uygulaması için oyunlaştırma döngüleri (ilerleme mekanikleri) geliştirdim; kullanıcı tutundurma (retention) oranını optimize etmek amacıyla A/B testleri yürüttüm.",
                    f"Kişisel portföyümde ürün vaka çalışmalarını ve teknik dokümantasyonları yayınladım. ({_link('anilkaraca.com', 'https://anilkaraca.com')})"
                ]
            },
            {
                "role": "İletişim Danışmanı",
                "org": f"{_link('İzmir Büyükşehir Belediyesi', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Ürün Analitiği ve Raporlama: Paydaş gereksinimlerini ve kentsel veri kümelerini etkileşimli kontrol panellerine, raporlara ve dijital portallara dönüştürdüm.",
                    "Gereksinim Yönetimi: B2G paydaşlarını, içerik ekiplerini ve yazılım mühendislerini ortak bir ürün teslim hedefi doğrultusunda koordine ettim.",
                    "UX ve Karar Desteği: Stratejik karar alma süreçlerini destekleyen ve kamusal şeffaflığı artıran özel web araçları ve görsel kontrol panelleri tasarladım."
                ]
            },
            {
                "role": "Dijital Gazeteci / Editör",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Canlı Veri Araçları: Hız, güvenilirlik ve yüksek görsel netlik gerektiren gerçek zamanlı canlı seçim sonuç takip sistemleri ve grafikleri geliştirdim.",
                    "Analitik Araştırmalar: Veri odaklı yayıncılık projelerini desteklemek amacıyla SQL ve Excel kullanarak seçim veritabanlarını ve kamu kayıtlarını analiz ettim.",
                    "Teslimat Odaklı Çalışma: Yoğun haber yayını temposu ve kitleye dönük gerçek zamanlı araçlar sayesinde sonuç odaklı (delivery-oriented) bir ürün zihniyeti geliştirdim."
                ]
            }
        ],
        "projects_title": "SEÇİLMİŞ PROJELER & KANITLAR",
        "projects": [
            {
                "title": _link("Bohça - Ortaklaşa Çeyiz Planlayıcı", "https://anilkaraca.com/projects/bohca"),
                "date": "2026",
                "summary": "Senkronize çalışma alanları, medya destekli kayıtlar ve RevenueCat abonelik kurgusu üzerine tasarlayıp geliştirdiğim ortaklaşa çeyiz hazırlığı iOS uygulaması.",
                "stack": "Ortaklaşa Çalışabilen iOS Uygulaması"
            },
            {
                "title": _link("ChoreUs - Oyunlaştırılmış Ev İşleri Uygulaması", "https://anilkaraca.com/projects/choreus"),
                "date": "2025",
                "summary": "React Native ve Expo kullanarak; görev tamamlama, ilerleme basamakları ve görsel ödüllerle kurguladığım oyunlaştırılmış ev işleri uygulaması.",
                "stack": "Tüketici Odaklı iOS Uygulaması"
            },
            {
                "title": _link("AI Fit Check - Görsel Tabanlı Stil Uygulaması", "https://anilkaraca.com/projects/ai-fit-check"),
                "date": "2025",
                "summary": "Mobil kullanıcı deneyimi (UX) içinde yapay zeka entegrasyonunun etkileşime etkisini test etmek amacıyla OpenAI stil belirleme motorunu entegre ederek geliştirdiğim mobil ürün.",
                "stack": "Yapay Zeka Mobil Ürünü"
            },
            {
                "title": _link("İzmir Trafik Koridoru Risk Analizi", "https://anilkaraca.com/articles/izmir-trafik-kazasi-raporu"),
                "date": "2024",
                "summary": "Python veri analitiği, Plotly görselleştirmesi, React arayüzleri ve Astro tabanlı hikaye anlatıcılığını bir araya getiren etkileşimli kentsel veri projesi.",
                "stack": "Etkileşimli Veri Ürünü"
            },
            {
                "title": _link("Dijital Kontrol Panelleri ve D3.js Grafikleri", "https://anilkaraca.com/articles/izmir-toplu-tasima"),
                "date": "2019 - 2025",
                "summary": "Karmaşık veri setlerini paydaşların kolayca yorumlayabileceği etkileşimli kontrol panellerine (dashboards) ve görsel arayüzlere dönüştüren sistem tasarımları.",
                "stack": "Veri & İletişim Ürünleri"
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Tüm proje detayları, ürün dokümantasyonları ve vaka çalışmaları {_link('anilkaraca.com', 'https://anilkaraca.com')} adresinde yer almaktadır.",
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
    story.append(Spacer(1, 1))
    story.append(_contact_bar(data))

    # ── summary ──────────────────────────────────────────────────────
    story.append(Spacer(1, 2))
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
        story += [Spacer(1, 3), Paragraph(data["footer"], S["note"])]

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
