# Generates public/anilkaraca.pdf and cvs/*.pdf — keep in sync with src/lib/resume.ts
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
                  textColor=PALETTE["secondary"], spaceAfter=2.2),

    # ── toolkit ──────────────────────────────────────────────────────
    "tool_cat": _s("ToolCat", _BASE["BodyText"],
                    fontName=FONT_BOLD, fontSize=8.3, leading=10.5,
                    textColor=PALETTE["ink"]),

    "tool_body": _s("ToolBody", _BASE["BodyText"],
                     fontName=FONT, fontSize=8.4, leading=11.2,
                     textColor=PALETTE["secondary"], spaceAfter=2.5),

    # ── education ────────────────────────────────────────────────────
    "edu_inst": _s("EduInst", _BASE["BodyText"],
                    fontName=FONT, fontSize=9.0, leading=11.5,
                    textColor=PALETTE["ink"], spaceAfter=1),

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
    parts.append(Spacer(1, 4.0))
    return KeepTogether(parts)


def _toolkit(groups):
    """Clean, single-column un-tabulated text list for core skills."""
    parts = []
    for cat, body in groups:
        text = f"<b>{cat}</b>: {body}"
        parts.append(Paragraph(text, S["tool_body"]))
    return KeepTogether(parts)


def _education(entries):
    """Clean, single-column un-tabulated text rows for education."""
    parts = []
    for i, e in enumerate(entries):
        header_text = f"<b>{e['institution']}</b> – {e['degree']} ({e['period']}) · {e['grade']}"
        parts.append(Paragraph(header_text, S["edu_inst"]))
        if e.get("notes"):
            parts.append(Paragraph(e["notes"], S["edu_detail"]))
        if i < len(entries) - 1:
            parts.append(Spacer(1, 2.5))
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
        "institution": "Kadir Has University",
        "degree": "Master's Degree, New Media",
        "period": "2017 - 2019",
        "grade": "GPA 3.68/4.00",
        "notes": "Focused on digital media, data analysis, and quantitative research methods."
    },
    {
        "institution": "Ege University",
        "degree": "Bachelor's Degree, Journalism",
        "period": "2011 - 2015",
        "grade": "GPA 2.94/4.00",
        "notes": "Completed an Erasmus exchange semester at the University of Lodz in 2014; GPA 3.75/4.00."
    }
]


# ═══════════════════════════════════════════════════════════════════════
# RESUME DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════

RESUMES = [
    # ── 1. Corporate Communications Specialist CV ────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Communications_Manager.pdf",
        "title": "Anil Karaca - Corporate Communications Specialist",
        "subtitle": "Corporate Communications Specialist",
        "subject": "Corporate Communications Specialist",
        "keywords": "corporate communications, public relations, brand governance, B2G, stakeholder engagement, media relations, copy editing, video production",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "dob": "Born: 12.09.1993",
        "location": "Available remotely worldwide | On-site: İzmir, Türkiye",
        "page_break_before_projects": True,
        "show_projects": False,
        "summary": (
            "Corporate communications specialist with extensive experience in public relations, brand governance, B2G stakeholder "
            "engagement, and multi-agency coordination. Combines newsroom discipline, crisis communication standards, and "
            "product-minded digital execution to govern brand consistency and deliver high-impact executive messaging across channels."
        ),
        "skills_title": "CORE SKILLS",
        "tool_groups": [
            ("Corporate & Brand Communications", "Public Relations, Brand Governance, Stakeholder Engagement, Crisis & Risk Communication, Executive Messaging"),
            ("Content & Media Production", "Corporate Social Media Management, Video Production, Graphic Design, Copywriting, Editorial Standards"),
            ("Agency & Campaign Operations", "Agency Briefing, Vendor Coordination, Campaign Strategy, Project Tracking, Quality Control"),
            ("Languages", "Turkish (Native), English (Professional)"),
        ],
        "experience": [
            {
                "role": "Independent App Developer and Digital Storyteller",
                "org": "Self-directed work | Remote",
                "date": "2025 - Present",
                "bullets": [
                    "Product Messaging & Launch Strategy: Directed end-to-end product messaging and launch communications for 4 consumer iOS applications on the App Store.",
                    "Digital Storytelling & Case Studies: Built web portfolios, interactive visual explainers, and public case studies combining editorial clarity and visual design."
                ]
            },
            {
                "role": "Communications Advisor / Corporate Communications Specialist",
                "org": f"{_link('İzmir Metropolitan Municipality', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Brand & Media Strategy: Led multi-platform brand communications for a metropolitan municipality serving 4.5M+ residents; managed organic social accounts and video content campaigns.",
                    "Agency & Vendor Management: Coordinated workflows with external advertising and media agencies, optimizing creative briefs and brand consistency guidelines.",
                    "Stakeholder Communication & Reporting: Built web reporting portals and visual dashboards to translate complex civic topics into clear executive messaging."
                ]
            },
            {
                "role": "Digital Journalist / Editor",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Newsroom Reporting & Editorial: Produced deadline-driven digital coverage across civic and public-interest topics adhering to strict editorial standards.",
                    "Election Visualizations & Data Stories: Created interactive charts, vote breakdown maps, and data-driven graphics for election coverage.",
                    "Public Records & Verification: Conducted investigative research, fact-checking, and public records verification under newsroom deadline pressure."
                ]
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Full project breakdowns and interactive portfolio: {_link('anilkaraca.com', 'https://anilkaraca.com')}",
    },

    # ── 2. Data Analyst CV ──────────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Data_CV.pdf",
        "title": "Anil Karaca - Data Analyst & Data Journalist",
        "subtitle": "Data Analyst & Data Journalist",
        "subject": "Data Analyst & Data Journalist",
        "keywords": "data analyst, data journalism, SQL, PostgreSQL, Python, Pandas, ETL pipelines, data visualization, scrollytelling, D3.js",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "dob": "Born: 12.09.1993",
        "location": "Available remotely worldwide | On-site: İzmir, Türkiye",
        "page_break_before_projects": True,
        "show_projects": False,
        "summary": (
            "I am a data journalist and visual storyteller driven by investigative curiosity and editorial standards. "
            "Combining newsroom discipline with modern data analysis tools, I transform unstructured public records "
            "into interactive visual explainers, executive & stakeholder dashboards, and high-impact data-driven narratives."
        ),
        "skills_title": "CORE SKILLS",
        "tool_groups": [
            ("Data Systems & Processing", "SQL (PostgreSQL), Python (Pandas, NumPy, Web Scraping), Supabase, Unstructured Data Parsing, Database Schema Design"),
            ("Data Storytelling & Front-end", "D3.js, React, Astro, Interactive Scrollytelling, SVG, Framer Motion, GeoJSON Mapping, Interactive Dashboards"),
            ("Journalistic & BI Tools", "Tableau, Flourish, Datawrapper, QGIS (Geospatial Analysis), GeoJSON, Excel, Data Verification"),
            ("Languages", "Turkish (Native), English (Professional)"),
        ],
        "experience": [
            {
                "role": "Independent App Developer and Data Journalist",
                "org": "Self-directed work | Remote",
                "date": "2025 - Present",
                "bullets": [
                    "Quantitative Research & Visual Storytelling: Built custom interactive graphics, scrollytelling data stories, and data explainers using React, Astro, and D3.js.",
                    "Mobile Product & User Analytics: Designed PostgreSQL database schemas and tracked user engagement funnels in Supabase for 4 consumer iOS apps.",
                    "Data Processing: Wrote Python and SQL scripts to clean, structure, and manage datasets for web stories and mobile products."
                ]
            },
            {
                "role": "Communications Advisor & Data Specialist",
                "org": f"{_link('İzmir Metropolitan Municipality', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Executive & Stakeholder Dashboards: Built comprehensive self-serve web portals, executive reporting dashboards, and custom D3.js charts for organizational partners to support data-driven decision-making.",
                    "Data Narratives & Executive Reports: Converted raw civic datasets into executive briefings, visual assets, and public data stories."
                ]
            },
            {
                "role": "Digital Journalist / Editor",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Public Records & Election Analysis: Analyzed public records and election databases using SQL, Python, and Excel to uncover stories under tight newsroom deadlines.",
                    "Election Visualizations & Data Stories: Created interactive charts, vote breakdown maps, and data-driven graphics for election coverage.",
                    "Data Sourcing & Verification: Sourced, cleaned, and verified unstructured public records and survey datasets under newsroom deadline pressure."
                ]
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Full interactive data projects, case studies, and live code breakdowns: {_link('anilkaraca.com', 'https://anilkaraca.com')}",
    },

    # ── 3. Mobile Product Specialist & Developer CV ───────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Product_Specialist.pdf",
        "title": "Anil Karaca - Mobile Product Specialist & Developer",
        "subtitle": "Mobile Product Specialist & Developer",
        "subject": "Mobile Product Specialist & Developer",
        "keywords": "mobile product specialist, app developer, React Native, Expo, mobile UX, onboarding, subscription flows, RevenueCat, Supabase, product analytics",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "dob": "Born: 12.09.1993",
        "location": "Available remotely worldwide | On-site: İzmir, Türkiye",
        "page_break_before_projects": True,
        "show_projects": False,
        "summary": (
            "Mobile product specialist and independent app developer with hands-on experience shipping consumer iOS applications from discovery "
            "to App Store launch. Skilled in React Native, Expo, mobile UX, onboarding, subscription flows, RevenueCat, Supabase, and product "
            "analytics. Combines technical execution, data analysis, and user research to improve retention and product growth."
        ),
        "skills_title": "CORE SKILLS",
        "tool_groups": [
            ("Mobile Product & UX", "React Native, Expo, iOS App Store Publishing, Mobile UX, Onboarding Funnels, Subscription Monetization (RevenueCat)"),
            ("Technical Stack", "TypeScript, JavaScript, React, Astro, Tailwind CSS, Supabase Auth & DB, PostgreSQL, Git/GitHub"),
            ("Product Strategy & Analytics", "Product Discovery, Feature Scoping, Roadmaps, Product Telemetry, User Cohort Analysis, Python, SQL"),
            ("Languages", "Turkish (Native), English (Professional)"),
        ],
        "experience": [
            {
                "role": "Independent App Developer & Product Specialist",
                "org": "Self-directed work | Remote",
                "date": "2025 - Present",
                "bullets": [
                    "Mobile App Publishing: Shipped 4 consumer iOS apps to the App Store from concept to launch using React Native and Expo.",
                    "UX & Subscription Funnels: Implemented Supabase auth and database flows; integrated RevenueCat paywalls to optimize user onboarding and trial conversion.",
                    "Product Telemetry & Iteration: Tracked user engagement events and built gamification mechanics (such as streak tracking and progress milestones for ChoreUs)."
                ]
            },
            {
                "role": "Communications Advisor",
                "org": f"{_link('İzmir Metropolitan Municipality', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Product Analytics & Web Tools: Translated municipal stakeholder needs into custom web portals, reporting tools, and interactive dashboards.",
                    "Feature Scoping & Alignment: Scoped requirements and aligned stakeholders, designers, and developers on digital product delivery."
                ]
            },
            {
                "role": "Digital Journalist / Editor",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Analytical Research & Tools: Built data-driven graphics and parsed public databases with SQL and Python under tight deadlines.",
                    "Product Execution: Applied a delivery-oriented mindset to launch fast-moving newsroom content and interactive reader tools."
                ]
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Full product case studies and live app links: {_link('anilkaraca.com', 'https://anilkaraca.com')}",
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
        subject=data.get("subject", "Data Journalist, Developer, Product Builder — Resume"),
        keywords=data.get("keywords", "data journalism, developer, React Native, Expo, Python, D3.js, Astro, frontend, mobile apps"),
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
    skills_title = data.get("skills_title", "Skills")
    story += _section_head(skills_title)
    story.append(_toolkit(data["tool_groups"]))

    # ── experience ───────────────────────────────────────────────────
    story += _section_head("Experience")
    for entry in data["experience"]:
        story.append(_experience(entry))

    # ── education ────────────────────────────────────────────────────
    story += _section_head("Education")
    story += _education(data["education"])

    # ── projects ─────────────────────────────────────────────────────
    if data.get("show_projects") and data.get("projects"):
        projects_title = data.get("projects_title", "Selected Projects")
        story += _section_head(projects_title)
        for proj in data["projects"]:
            story.append(_project(proj))


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
