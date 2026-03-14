from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 18 * mm
MARGIN_Y = 16 * mm
CONTENT_W = PAGE_WIDTH - (MARGIN_X * 2)
CONTENT_H = PAGE_HEIGHT - (MARGIN_Y * 2)

# ── colour system ────────────────────────────────────────────────────
PALETTE = {
    "paper": colors.HexColor("#fafaf8"),
    "ink": colors.HexColor("#1a1a1a"),
    "secondary": colors.HexColor("#4a5568"),
    "muted": colors.HexColor("#718096"),
    "accent": colors.HexColor("#0d7377"),
    "accent_light": colors.HexColor("#e6f4f1"),
    "rule": colors.HexColor("#cbd5e0"),
    "rule_light": colors.HexColor("#e2e8f0"),
    "tag_bg": colors.HexColor("#f0f4f8"),
    "sidebar": colors.HexColor("#f7f7f5"),
}


def _s(name: str, parent: ParagraphStyle, **kw) -> ParagraphStyle:
    return ParagraphStyle(name=name, parent=parent, **kw)


_BASE = getSampleStyleSheet()

S = {
    # ── header block ─────────────────────────────────────────────────
    "name": _s("Name", _BASE["Heading1"],
               fontName="Helvetica-Bold", fontSize=26, leading=28,
               textColor=PALETTE["ink"], spaceAfter=0),

    "subtitle": _s("Subtitle", _BASE["BodyText"],
                    fontName="Helvetica", fontSize=10.5, leading=14,
                    textColor=PALETTE["accent"], spaceAfter=0),

    "contact": _s("Contact", _BASE["BodyText"],
                   fontName="Helvetica", fontSize=8.4, leading=12,
                   textColor=PALETTE["muted"], spaceAfter=0),

    # ── summary area ─────────────────────────────────────────────────
    "headline": _s("Headline", _BASE["BodyText"],
                    fontName="Helvetica-Bold", fontSize=12.5, leading=16.5,
                    textColor=PALETTE["ink"], spaceAfter=4),

    "summary": _s("Summary", _BASE["BodyText"],
                   fontName="Helvetica", fontSize=9.4, leading=14.2,
                   textColor=PALETTE["secondary"], spaceAfter=0),

    # ── key-value highlights ─────────────────────────────────────────
    "kv_label": _s("KVLabel", _BASE["BodyText"],
                    fontName="Helvetica-Bold", fontSize=8, leading=10,
                    textColor=PALETTE["accent"], spaceAfter=0),

    "kv_value": _s("KVValue", _BASE["BodyText"],
                    fontName="Helvetica", fontSize=8.6, leading=12,
                    textColor=PALETTE["ink"], spaceAfter=0),

    # ── section headings ─────────────────────────────────────────────
    "section": _s("Section", _BASE["BodyText"],
                   fontName="Helvetica-Bold", fontSize=9, leading=11,
                   textColor=PALETTE["accent"], spaceAfter=2),

    "section_sub": _s("SectionSub", _BASE["BodyText"],
                       fontName="Helvetica", fontSize=8.8, leading=12.6,
                       textColor=PALETTE["muted"], spaceAfter=0),

    # ── experience entries ───────────────────────────────────────────
    "role": _s("Role", _BASE["BodyText"],
               fontName="Helvetica-Bold", fontSize=10.6, leading=13,
               textColor=PALETTE["ink"], spaceAfter=1),

    "org": _s("Org", _BASE["BodyText"],
              fontName="Helvetica-Bold", fontSize=8.6, leading=11,
              textColor=PALETTE["accent"], spaceAfter=2),

    "date": _s("Date", _BASE["BodyText"],
               fontName="Helvetica", fontSize=8.2, leading=11,
               textColor=PALETTE["muted"], alignment=TA_RIGHT),

    "bullet": _s("Bullet", _BASE["BodyText"],
                  fontName="Helvetica", fontSize=9, leading=13.2,
                  leftIndent=10, firstLineIndent=-7,
                  textColor=PALETTE["secondary"], spaceAfter=2),

    # ── toolkit ──────────────────────────────────────────────────────
    "tool_cat": _s("ToolCat", _BASE["BodyText"],
                    fontName="Helvetica-Bold", fontSize=8.2, leading=11,
                    textColor=PALETTE["accent"]),

    "tool_body": _s("ToolBody", _BASE["BodyText"],
                     fontName="Helvetica", fontSize=8.8, leading=13,
                     textColor=PALETTE["secondary"]),

    # ── education ────────────────────────────────────────────────────
    "edu_inst": _s("EduInst", _BASE["BodyText"],
                    fontName="Helvetica-Bold", fontSize=9.4, leading=12,
                    textColor=PALETTE["ink"], spaceAfter=1),

    "edu_degree": _s("EduDegree", _BASE["BodyText"],
                      fontName="Helvetica", fontSize=8.6, leading=11,
                      textColor=PALETTE["accent"], spaceAfter=0),

    "edu_detail": _s("EduDetail", _BASE["BodyText"],
                      fontName="Helvetica", fontSize=8, leading=11,
                      textColor=PALETTE["muted"], spaceAfter=0),

    # ── publication ──────────────────────────────────────────────────
    "pub_title": _s("PubTitle", _BASE["BodyText"],
                     fontName="Helvetica-BoldOblique", fontSize=9.2, leading=12,
                     textColor=PALETTE["ink"], spaceAfter=1),

    "pub_meta": _s("PubMeta", _BASE["BodyText"],
                    fontName="Helvetica", fontSize=8.4, leading=11,
                    textColor=PALETTE["accent"], spaceAfter=2),

    "pub_body": _s("PubBody", _BASE["BodyText"],
                    fontName="Helvetica", fontSize=8.4, leading=12,
                    textColor=PALETTE["muted"], spaceAfter=0),

    # ── misc ─────────────────────────────────────────────────────────
    "note": _s("Note", _BASE["BodyText"],
               fontName="Helvetica-Oblique", fontSize=8.2, leading=11.5,
               textColor=PALETTE["muted"], spaceAfter=0),

    "badge": _s("Badge", _BASE["BodyText"],
                 fontName="Helvetica-Bold", fontSize=7, leading=9,
                 textColor=PALETTE["accent"], alignment=TA_CENTER),
}


# ── link helper ──────────────────────────────────────────────────────
def _link(label: str, url: str) -> str:
    return f'<link href="{url}" color="{PALETTE["accent"].hexval()}">{label}</link>'


# ═══════════════════════════════════════════════════════════════════════
# LAYOUT COMPONENTS
# ═══════════════════════════════════════════════════════════════════════

def _header(data):
    """Name + subtitle on left, availability badge on right."""
    badge_text = Paragraph(data["availability"], S["badge"])
    badge = Table([[badge_text]], colWidths=[62 * mm])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALETTE["accent_light"]),
        ("ROUNDEDCORNERS", [3, 3, 3, 3]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))

    left = [
        Paragraph("Anil Karaca", S["name"]),
        Spacer(1, 2),
        Paragraph(data["subtitle"], S["subtitle"]),
    ]

    row = Table([[left, badge]], colWidths=[CONTENT_W - 66 * mm, 66 * mm])
    row.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ("VALIGN",       (0, 0), (0, 0), "BOTTOM"),
        ("VALIGN",       (1, 0), (1, 0), "TOP"),
    ]))
    return row


def _contact_bar(data):
    """Compact contact strip: email / site / linkedin / github."""
    items = [
        _link("anilkaraca140@gmail.com", "mailto:anilkaraca140@gmail.com"),
        _link("anilkaraca.com", "https://anilkaraca.com"),
        _link("LinkedIn", "https://www.linkedin.com/in/anil-karaca/"),
        _link("GitHub", "https://github.com/arthlor"),
    ]
    return Paragraph("    ·    ".join(items), S["contact"])


def _highlights_band(data):
    """Two-column key-value highlights below the summary."""
    rows = []
    highlights = data["highlights"]
    # pair them into two-column rows
    for i in range(0, len(highlights), 2):
        left = highlights[i]
        right = highlights[i + 1] if i + 1 < len(highlights) else None
        left_cell = [Paragraph(left["label"].upper(), S["kv_label"]),
                     Paragraph(left["value"], S["kv_value"])]
        if right:
            right_cell = [Paragraph(right["label"].upper(), S["kv_label"]),
                          Paragraph(right["value"], S["kv_value"])]
        else:
            right_cell = []
        rows.append([left_cell, right_cell])

    half = (CONTENT_W - 8 * mm) / 2
    tbl = Table(rows, colWidths=[half, half])
    tbl.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), PALETTE["tag_bg"]),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING",   (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 7),
        ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ("LINEAFTER",    (0, 0), (0, -1), 0.4, PALETTE["rule_light"]),
    ]))
    return tbl


def _section_head(title: str, subtitle: Optional[str] = None):
    """Accented section heading with horizontal rule."""
    parts = [
        Spacer(1, 16),
        Paragraph(title.upper(), S["section"]),
        HRFlowable(width="100%", thickness=0.6, color=PALETTE["rule"]),
    ]
    if subtitle:
        parts.extend([Spacer(1, 4), Paragraph(subtitle, S["section_sub"])])
    return parts


def _experience(entry):
    """Single experience block with role / org / date and bullets."""
    hdr = Table(
        [[Paragraph(entry["role"], S["role"]),
          Paragraph(entry["date"], S["date"])]],
        colWidths=[CONTENT_W - 36 * mm, 36 * mm],
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
        parts.append(Paragraph(f"– {b}", S["bullet"]))
    parts.extend([
        Spacer(1, 6),
        HRFlowable(width="100%", thickness=0.35, color=PALETTE["rule_light"]),
        Spacer(1, 4),
    ])
    return KeepTogether(parts)


def _toolkit(groups):
    """Category / body table for skills."""
    rows = [[Paragraph(cat, S["tool_cat"]),
             Paragraph(body, S["tool_body"])] for cat, body in groups]
    tbl = Table(rows, colWidths=[40 * mm, CONTENT_W - 40 * mm], hAlign="LEFT")
    tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (0, -1), PALETTE["tag_bg"]),
        ("LINEABOVE",   (0, 0), (-1, 0), 0.5, PALETTE["rule"]),
        ("LINEBELOW",   (0, -1),(-1, -1), 0.5, PALETTE["rule"]),
        ("LINEBELOW",   (0, 0), (-1, -2), 0.3, PALETTE["rule_light"]),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",(0, 0), (-1, -1), 8),
        ("TOPPADDING",  (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",(0, 0),(-1, -1), 7),
        ("VALIGN",      (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl


def _education(entries):
    """Compact education rows."""
    parts = []
    for i, e in enumerate(entries):
        left = [Paragraph(e["institution"], S["edu_inst"]),
                Paragraph(e["degree"], S["edu_degree"])]
        if e.get("notes"):
            left.append(Paragraph(e["notes"], S["edu_detail"]))
        right = [Paragraph(e["period"], S["date"]),
                 Paragraph(e["grade"], S["edu_detail"])]
        row = Table([[left, right]], colWidths=[CONTENT_W - 38 * mm, 38 * mm])
        row.setStyle(TableStyle([
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING",   (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
            ("VALIGN",       (0, 0), (-1, -1), "TOP"),
        ]))
        parts.append(row)
        if i < len(entries) - 1:
            parts += [Spacer(1, 4),
                      HRFlowable(width="100%", thickness=0.3, color=PALETTE["rule_light"]),
                      Spacer(1, 5)]
    return parts


def _publication(entry):
    """Publication block."""
    return KeepTogether([
        Paragraph(entry["title"], S["pub_title"]),
        Paragraph(f'{entry["publisher"]}  ·  {entry["year"]}', S["pub_meta"]),
        Paragraph(entry["summary"], S["pub_body"]),
    ])


# ═══════════════════════════════════════════════════════════════════════
# PAGE CHROME
# ═══════════════════════════════════════════════════════════════════════

def _draw_page(canvas, doc):
    canvas.saveState()

    # background
    canvas.setFillColor(PALETTE["paper"])
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    # top accent bar
    canvas.setFillColor(PALETTE["accent"])
    canvas.rect(MARGIN_X, PAGE_HEIGHT - MARGIN_Y + 3 * mm,
                CONTENT_W, 1.2 * mm, fill=1, stroke=0)

    # thin left accent rule (subtle design touch)
    canvas.setStrokeColor(PALETTE["accent"])
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN_X - 4 * mm, PAGE_HEIGHT - MARGIN_Y,
                MARGIN_X - 4 * mm, MARGIN_Y)

    # footer rule
    canvas.setStrokeColor(PALETTE["rule"])
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN_X, 13 * mm, PAGE_WIDTH - MARGIN_X, 13 * mm)

    # footer text
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(PALETTE["muted"])
    canvas.drawString(MARGIN_X, 8.5 * mm, "anilkaraca.com")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 8.5 * mm,
                           f"Page {doc.page}")
    canvas.restoreState()


# ═══════════════════════════════════════════════════════════════════════
# RESUME DATA
# ═══════════════════════════════════════════════════════════════════════

RESUME = {
    "path": PUBLIC / "anilkaraca-cv.pdf",
    "title": "Anil Karaca — Resume",
    "subtitle": "Data Journalist  ·  Developer  ·  Product Builder",
    "availability": "OPEN TO FULL-TIME ROLES",

    "headline": "Strongest where reporting, analysis, interface design, and delivery converge.",
    "summary": (
        "Data journalist and developer who has covered elections, built civic data "
        "investigations, shipped consumer mobile apps, and designed interactive story "
        "formats. I move from raw source material through analysis and narrative "
        "framing to the published interface."
    ),

    "highlights": [
        {"label": "Experience", "value": "10+ years across journalism and digital product work"},
        {"label": "Open to", "value": "Full-time roles with global or remote teams"},
        {"label": "Core skills", "value": "Data journalism, frontend development, mobile apps"},
        {"label": "Stack", "value": "Python, React Native, Expo, React, Astro, D3.js"},
    ],

    "experience_intro": "The through-line is the same: make complex things understandable and useful.",
    "experience": [
        {
            "role": "Independent app developer and data journalist",
            "org": "Self-directed work",
            "date": "2025 – Present",
            "bullets": [
                "Shipped React Native and Expo apps to the App Store while continuing public-interest data reporting.",
                "Built interactive case studies connecting reporting, interface design, and engineering execution.",
                "Demonstrated end-to-end product ownership from concept through release.",
            ],
        },
        {
            "role": "Communications advisor",
            "org": "Izmir Metropolitan Municipality & Izbeton",
            "date": "2024",
            "bullets": [
                "Produced digital communication assets and documentary work inside a civic institution with public accountability.",
                "Bridged reporting instincts with message clarity across video, web, and editorial delivery.",
            ],
        },
        {
            "role": "Senior digital journalist",
            "org": "BirGun  ·  dokuz8HABER  ·  Egede SonSoz",
            "date": "2014 – 2024",
            "bullets": [
                "Covered elections, civic systems, transportation, and political accountability across multiple newsrooms.",
                "Worked across fast-paced newsroom publishing and deeper analytical formats including visual explainers.",
                "Developed the reporting habits that now shape product and interface decisions.",
            ],
        },
    ],

    "toolkit_intro": "A hybrid toolkit for editorial, analytical, and product work.",
    "tool_groups": [
        ("Reporting & data",   "Python, Pandas, SQL, D3.js, Plotly, Flourish, data cleaning, editorial framing"),
        ("Frontend & mobile",  "React Native, Expo, React, Astro, JavaScript, TypeScript, pragmatic UI work"),
        ("Supporting skills",  "Story design, scrollytelling, documentary production, AI-assisted iteration"),
    ],

    "education": [
        {"institution": "Kadir Has University",
         "degree": "Master's degree, New Media",
         "period": "2017 – 2019", "grade": "GPA 3.68"},
        {"institution": "Ege University",
         "degree": "Bachelor's degree, Journalism",
         "period": "2011 – 2015", "grade": "GPA 2.94"},
        {"institution": "University of Lodz",
         "degree": "Bachelor's degree, Journalism (Erasmus)",
         "period": "2014", "grade": "GPA 3.75"},
    ],

    "publication": {
        "title": "News readers' perception of clickbait news",
        "publisher": "Kadir Has University",
        "year": "2019",
        "summary": (
            "Graduate research combining survey data, open-ended responses, "
            "and interviews with digital news executives to examine how "
            "online news readers perceive clickbait."
        ),
    },

    "footer": "Full project breakdowns and case studies available at anilkaraca.com",
}


# ═══════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════

def build_resume(data):
    frame = Frame(MARGIN_X, MARGIN_Y, CONTENT_W, CONTENT_H,
                  leftPadding=0, rightPadding=0,
                  topPadding=0, bottomPadding=0, id="main")

    doc = BaseDocTemplate(
        str(data["path"]), pagesize=A4,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_Y, bottomMargin=MARGIN_Y,
        title=data["title"], author="Anil Karaca",
    )
    doc.addPageTemplates([PageTemplate(id="cv", frames=[frame],
                                       onPage=_draw_page)])

    story = [
        # ── header ───────────────────────────────────────────────────
        _header(data),
        Spacer(1, 5),
        _contact_bar(data),

        # ── summary ──────────────────────────────────────────────────
        Spacer(1, 12),
        Paragraph(data["headline"], S["headline"]),
        Spacer(1, 2),
        Paragraph(data["summary"], S["summary"]),

        # ── highlights ───────────────────────────────────────────────
        Spacer(1, 10),
        _highlights_band(data),
    ]

    # ── experience ───────────────────────────────────────────────────
    story += _section_head("Experience", data["experience_intro"])
    for entry in data["experience"]:
        story.append(_experience(entry))

    # ── toolkit ──────────────────────────────────────────────────────
    story += _section_head("Toolkit", data["toolkit_intro"])
    story.append(_toolkit(data["tool_groups"]))

    # ── education ────────────────────────────────────────────────────
    story += _section_head("Education")
    story += _education(data["education"])

    # ── publication ──────────────────────────────────────────────────
    story += _section_head("Publication")
    story.append(_publication(data["publication"]))

    # ── footer note ──────────────────────────────────────────────────
    if data.get("footer"):
        story += [Spacer(1, 10), Paragraph(data["footer"], S["note"])]

    doc.build(story)


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)

    build_resume(RESUME)

    # master copy at project root
    master = ROOT / "anilkaraca.pdf"
    master.write_bytes(RESUME["path"].read_bytes())


if __name__ == "__main__":
    main()
