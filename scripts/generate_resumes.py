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
                    fontName=FONT, fontSize=9, leading=11,
                    textColor=PALETTE["ink"], spaceAfter=1.5),

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
        "location": "Available remotely worldwide | On-site: İzmir, Türkiye",
        "page_break_before_projects": True,
        "summary": (
            "Corporate communications specialist with extensive experience in public relations, brand governance, B2G stakeholder "
            "engagement, and multi-agency coordination. Combines newsroom discipline, crisis/risk communication standards, and "
            "product-minded digital execution to govern brand consistency and deliver high-impact executive messaging across channels."
        ),
        "skills_title": "CORE SKILLS",
        "tool_groups": [
            ("Corporate Communications", "Communication Strategy, Public Affairs, Stakeholder Engagement, Brand Governance, Crisis & Risk Communication, Executive Messaging"),
            ("Social Media Management", "Corporate Account Management, Editorial Calendars, Channel Planning, Campaign Strategy, Performance Reporting, Community Engagement"),
            ("Content Production", "Video Production, Graphic Design, Copywriting, Editing, Digital Assets, Executive Presentations"),
            ("Agency & Vendor Management", "Agency Briefing, Creative Feedback, Project Management, Quality Control, Brand Consistency, Timeline Management"),
            ("Editorial & Media", "Editorial Standards, Fact-Checking, Public Records Research, Election Coverage, Investigative Reporting"),
            ("Digital & Analytics", "Civic Data Visualization, Interactive Dashboards, D3.js, React, Astro, PostgreSQL, Python, Excel, Power BI"),
            ("Languages", "Turkish (Native), English (Professional)"),
        ],
        "experience": [
            {
                "role": "Independent App Developer and Digital Storyteller",
                "org": "Self-directed work | Remote",
                "date": "2025 - Present",
                "bullets": [
                    "Mobile Product & UX Strategy: Directed end-to-end product messaging and launch communications for 4 self-launched consumer iOS applications on the App Store.",
                    "Interactive Visual Storytelling: Developed web portfolios, interactive data visualizations, and public case studies combining editorial clarity and technical design.",
                    f"Maintained a professional portfolio and project archive at {_link('anilkaraca.com', 'https://anilkaraca.com')}."
                ]
            },
            {
                "role": "Communications Advisor / Corporate Communications Specialist",
                "org": f"{_link('İzmir Metropolitan Municipality', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Social Media Strategy & Engagement: Spearheaded the multi-platform brand strategy for a metropolitan municipality serving 4.5M+ residents; grew organic social channels and supported growth in organic engagement through targeted, video-first content campaigns.",
                    "Agency & Vendor Management: Governed relationships and creative workflows with external advertising and media agencies; optimized creative brief processes to reduce asset turnaround times while ensuring complete compliance with strict brand governance guidelines.",
                    "Stakeholder Alignment & Reporting: Translated highly complex, civic data sets into interactive visual dashboards and corporate reports, improving communication transparency for B2G stakeholders."
                ]
            },
            {
                "role": "Digital Journalist / Editor",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Produced deadline-driven digital coverage across civic, political, and public-interest topics with strong editorial standards.",
                    "Built real-time election graphics and digital explainers that helped audiences understand fast-changing public information.",
                    "Conducted investigative reporting, fact-checking, source verification, and public records research under newsroom pressure."
                ]
            }
        ],
        "projects_title": "SELECTED PROJECTS & EVIDENCE",
        "projects": [
            {
                "title": "Corporate Social Media Account Management",
                "date": "2019 - 2024",
                "summary": "Managed corporate social media channels, overseeing content planning, publishing coordination, and institutional approval workflows.",
                "stack": "Corporate & Public-Sector Communications"
            },
            {
                "title": _link("Ekmeğimizi Büyütüyoruz – Civic Documentary", "https://www.youtube.com/watch?v=iZtaIuGnjzU"),
                "date": "2021",
                "summary": "Wrote, shot, and edited a 9-minute civic documentary detailing service delivery in under-served neighborhoods, showcasing end-to-end video production and storytelling.",
                "stack": "Digital Content Production"
            },
            {
                "title": "Agency and Vendor Management",
                "date": "2019 - 2024",
                "summary": "Coordinated external agencies through briefs, creative feedback, production tracking, and quality review.",
                "stack": "Corporate Communications Operations"
            },
            {
                "title": _link("Civic Reports, Dashboards and Public Narratives", "https://anilkaraca.com/articles/izmir-toplu-tasima"),
                "date": "2019 - 2024",
                "summary": "Translated complex civic topics and datasets into clear reports, dashboards, graphics, and audience-friendly public narratives.",
                "stack": "Stakeholder-Facing Communication"
            },
            {
                "title": _link("Real-Time Election Coverage Graphics", "https://anilkaraca.com/articles/turkey-elections-red-wave"),
                "date": "2014 - 2019",
                "summary": "Built and supported live visual communication formats for fast-moving political coverage, combining speed, verification, and clarity.",
                "stack": "Digital Journalism & Public Communication"
            },
            {
                "title": f"{_link('Bohça', 'https://anilkaraca.com/projects/bohca')}, {_link('ChoreUs', 'https://anilkaraca.com/projects/choreus')}, and {_link('Yeşer', 'https://anilkaraca.com/projects/yeser')} Product Communication",
                "date": "2025 - Present",
                "summary": "Created user-facing app communication, onboarding logic, and portfolio case studies for independently shipped consumer iOS products.",
                "stack": "Product Messaging & Copywriting"
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Full project breakdowns: {_link('anilkaraca.com', 'https://anilkaraca.com')}",
    },

    # ── 2. Data Analyst CV ──────────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Data_CV.pdf",
        "title": "Anil Karaca - Data Journalist & Data Analyst",
        "subtitle": "Data Journalist & Data Analyst",
        "subject": "Data Journalist & Data Analyst",
        "keywords": "data journalism, data analyst, SQL, PostgreSQL, Python, Pandas, data visualization, ETL, scrollytelling, D3.js",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "location": "Available remotely worldwide | On-site: İzmir, Türkiye",
        "page_break_before_projects": True,
        "summary": (
            "Data journalist and analyst with experience in database design, ETL pipelines, data cleaning, and descriptive/diagnostic analytics. "
            "Skilled in SQL, Python, Pandas, and data visualization, transforming unstructured public records and product data into structured datasets, "
            "interactive dashboards, and clear visual explainers for decision-making."
        ),
        "skills_title": "CORE SKILLS",
        "tool_groups": [
            ("Data Analysis & BI", "Python, Pandas, NumPy, SQL, PostgreSQL, Supabase, Geospatial Analysis (QGIS), ETL Pipelines, Database Schema Design, BI Tools (Tableau, Power BI), Excel"),
            ("Data Visualization", "Interactive Scrollytelling, D3.js, Plotly, React, Astro, SVG, Framer Motion, Interactive Dashboards, Geographic Maps"),
            ("Journalism & Media", "Investigative Reporting, Public Records, Election Data, Fact-Checking, Editorial Standards, Data Acquisition, Survey Methodology"),
            ("Product & Web", "Astro & MDX Content Systems, JavaScript, TypeScript, Tailwind CSS, Product Analytics, Agile Workflows, Git/GitHub"),
            ("Languages", "Turkish (Native), English (Professional)"),
        ],
        "experience": [
            {
                "role": "Independent App Developer and Data Journalist",
                "org": "Self-directed work | Remote",
                "date": "2025 - Present",
                "bullets": [
                    "Quantitative Research & Visualization: Shipped custom interactive graphics, scrollytelling stories, and exploratory analyses in React and Astro.",
                    "Data Modeling & Operations: Analyzed product telemetry and database events for 4 self-launched consumer iOS applications, optimizing SQL query performance and data collection pathways.",
                    "ETL Pipelines: Managed data parsing, cleansing, and storage pipelines using Python, SQL, and Supabase integrations."
                ]
            },
            {
                "role": "Communications Advisor",
                "org": f"{_link('İzmir Metropolitan Municipality', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Data Modeling & ETL: Leveraged civic tech capabilities to design PostgreSQL database schemas and automate ETL pipelines for over 17,000 high-volume municipal transit and traffic-collision records, optimizing internal reporting and communication systems.",
                    "Business Intelligence (BI) & Dashboards: Built interactive, self-serve dashboards and custom D3.js visualizations for municipal partners to support data-driven transit policy decisions.",
                    "Descriptive & Diagnostic Reports: Converted raw datasets into clean visual assets, executive reports, and public-facing data-driven narratives."
                ]
            },
            {
                "role": "Digital Journalist / Editor",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Exploratory Data Analysis (EDA): Conducted complex exploratory analysis on unstructured public records and election databases using advanced SQL queries (CTEs, joins, window functions) and Python; translated raw datasets into real-time tracking systems that supported national news coverage under tight deadlines.",
                    "Real-Time Data Products: Engineered newsroom dashboards and live results trackers for high-stakes election broadcasts.",
                    "Data Acquisition & Verification: Sourced, cleaned, and verified public records and survey data under deadline pressure."
                ]
            }
        ],
        "projects_title": "SELECTED PROJECTS & EVIDENCE",
        "projects": [
            {
                "title": _link("İzmir Traffic Corridor Risk Study", "https://anilkaraca.com/articles/izmir-trafik-kazasi-raporu"),
                "date": "2024",
                "summary": "Time-density mapping and street-level risk modeling analysis of 17K+ collision logs using Python, Pandas, Plotly, React, and Astro.",
                "stack": "Data & Visualization"
            },
            {
                "title": _link("İstanbul İtfaiyesi Pati Mesaisi", "https://anilkaraca.com/articles/yanginlarin-otesinde-itfaiye-faaliyet-raporu"),
                "date": "2026",
                "summary": "Interactive analysis of 296K+ emergency dispatches, mapping seasonal animal rescue anomalies with React, D3.js, Framer Motion, and SVG.",
                "stack": "Interactive Data Story"
            },
            {
                "title": _link("Real-Time Election Results Trackers", "https://anilkaraca.com/articles/turkey-elections-red-wave"),
                "date": "2014 - 2019",
                "summary": "Built live graphics and election-results workflows for digital newsrooms, combining speed, verification, SQL/Excel analysis, and clear visual presentation.",
                "stack": "Newsroom Data Products"
            },
            {
                "title": _link("Clickbait Perception Research", "https://hdl.handle.net/20.500.12469/2753"),
                "date": "2019",
                "summary": "Graduate research combining quantitative survey analysis, statistical coding, and interviews with digital news executives.",
                "stack": "Thesis & Publication"
            },
            {
                "title": _link("Data Dashboards & Public Reports", "https://anilkaraca.com/articles/izmir-toplu-tasima"),
                "date": "2019 - 2024",
                "summary": "Designed data dashboards and public-facing visual reports to make complex datasets, traffic patterns, and public records more legible.",
                "stack": "Communication & Analytics Tools"
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Full project breakdowns: {_link('anilkaraca.com', 'https://anilkaraca.com')}",
    },

    # ── 3. Mobile Product Specialist & Developer CV ───────────────────────────────────
    {
        "path": CVS_DIR / "Anil_Karaca_Product_Specialist.pdf",
        "title": "Anil Karaca - Mobile Product Specialist & Developer",
        "subtitle": "Mobile Product Specialist & Developer",
        "subject": "Mobile Product Specialist & Developer",
        "keywords": "mobile product specialist, app developer, React Native, Expo, mobile UX, onboarding, subscription flows, RevenueCat, Supabase, product analytics",
        "phone": _link("+90 554 656 01 50", "tel:+905546560150"),
        "location": "Available remotely worldwide | On-site: İzmir, Türkiye",
        "page_break_before_projects": True,
        "summary": (
            "Mobile product specialist and independent app developer with hands-on experience shipping consumer iOS applications from discovery "
            "to App Store launch. Skilled in React Native, Expo, mobile UX, onboarding, subscription flows, RevenueCat, Supabase, and product "
            "analytics. Combines technical execution, data analysis, and stakeholder communication to improve retention and growth."
        ),
        "skills_title": "CORE SKILLS",
        "tool_groups": [
            ("Product Management", "Product Discovery, Feature Scoping, Roadmapping, PRDs, RICE Prioritization, Product Analytics, Agile, Stakeholder Alignment, AI-assisted product iteration"),
            ("Mobile Product", "React Native, Expo, iOS App Store Delivery, Mobile UX, Onboarding Experiences, Gamification Loops, Habit Design & Streaks, Subscription Monetization (RevenueCat)"),
            ("Technical Stack", "TypeScript, JavaScript, React, Astro, Tailwind CSS, Supabase Auth, PostgreSQL, SQL, Real-Time Data Sync, Git/GitHub"),
            ("Data & Analytics", "Python, Pandas, Product Metrics, A/B Testing, User Cohort Analysis, Excel, Google Sheets"),
            ("Communication", "Product Messaging, Editorial Standards, Fact-Checking, Cross-Functional Communication, Documentation"),
            ("Languages", "Turkish (Native), English (Professional)"),
        ],
        "experience": [
            {
                "role": "Independent App Developer and Product Developer",
                "org": "Self-directed work | Remote",
                "date": "2025 - Present",
                "bullets": [
                    "Full Lifecycle Product Shipping: Shipped 4 consumer iOS products to the App Store from initial concept (MVP) to launch; managed cross-functional workflows using React Native and Expo, maintaining active App Store applications.",
                    "Mobile UX & Monetization Optimization: Implemented secure Supabase auth and database flows, integrating RevenueCat subscription infrastructure; designed an intuitive, multi-step subscription paywall to support trial conversion and lower onboarding funnel friction.",
                    "Data-Driven Feature Iteration: Analyzed user behavior logs and designed gamification structures (such as mascot progression mechanics for ChoreUs); coordinated A/B tests on mobile onboarding journeys to optimize user retention.",
                    f"Maintained product portfolio and case-study documentation at {_link('anilkaraca.com', 'https://anilkaraca.com')}."
                ]
            },
            {
                "role": "Communications Advisor",
                "org": f"{_link('İzmir Metropolitan Municipality', 'https://www.izmir.bel.tr/')} & {_link('İZBETON', 'https://www.izbeton.com.tr/')} | İzmir, Türkiye",
                "date": "2019 - 2024",
                "bullets": [
                    "Product Analytics & Dashboards: Leveraged civic tech capabilities to translate stakeholder needs into custom web dashboards and reporting portals.",
                    "Feature Scoping & Alignment: Scoped requirements and aligned municipal stakeholders, content creators, and developers on digital product delivery.",
                    "UX & Public Transparency: Designed custom web tools and visual dashboards to assist decision-making and public communication."
                ]
            },
            {
                "role": "Digital Journalist / Editor",
                "org": f"{_link('BirGün', 'https://www.birgun.net/')} | {_link('dokuz8HABER', 'https://www.dokuz8haber.net/')} | {_link('Ege\'de Sonsöz', 'https://www.egedesonsoz.com/')} | Türkiye",
                "date": "2014 - 2019",
                "bullets": [
                    "Live Data Tools: Shipped real-time election tracking products requiring extreme speed, reliability, and visual clarity.",
                    "Analytical Research: Analyzed election databases and public records with SQL and Excel to support investigative data products.",
                    "Deadline-Driven Execution: Developed a delivery-oriented mindset through rapid content release and real-time audience-facing tools."
                ]
            }
        ],
        "projects_title": "SELECTED PROJECTS & EVIDENCE",
        "projects": [
            {
                "title": _link("Bohça - Collaborative Çeyiz Planner", "https://anilkaraca.com/projects/bohca"),
                "date": "2026",
                "summary": "Collaborative wedding-prep iOS app built around synchronized workspaces, media-backed records, and RevenueCat subscription boundaries.",
                "stack": "Collaborative iOS App"
            },
            {
                "title": _link("ChoreUs - Gamified Household App", "https://anilkaraca.com/projects/choreus"),
                "date": "2025",
                "summary": "Gamified family task coordination app designed around task completion, progress milestones, user accounts, and visual rewards using React Native, Expo, and mobile UX design.",
                "stack": "Consumer iOS App"
            },
            {
                "title": _link("AI Fit Check - Image-Based Styling App", "https://anilkaraca.com/projects/ai-fit-check"),
                "date": "2025",
                "summary": "Consumer iOS app integrating OpenAI styling logic into a photo upload flow, built to evaluate user engagement with AI features in a mobile UX.",
                "stack": "AI Mobile Product"
            },
            {
                "title": _link("İzmir Traffic Corridor Risk Study", "https://anilkaraca.com/articles/izmir-trafik-kazasi-raporu"),
                "date": "2024",
                "summary": "Created a civic data product combining Python analysis, Plotly visualization, React interfaces, and Astro-based storytelling.",
                "stack": "Interactive Data Product"
            },
            {
                "title": _link("Data Dashboards and D3.js Charts", "https://anilkaraca.com/articles/izmir-toplu-tasima"),
                "date": "2019 - 2024",
                "summary": "Designed dashboard systems and visual interfaces that translated raw datasets into usable stakeholder-facing products.",
                "stack": "Data & Communication Products"
            }
        ],
        "education": SHARED_EDUCATION,
        "footer": f"Full project breakdowns: {_link('anilkaraca.com', 'https://anilkaraca.com')}",
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
    story.append(Spacer(1, 1))
    story.append(_contact_bar(data))

    # ── summary ──────────────────────────────────────────────────────
    story.append(Spacer(1, 2))
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
