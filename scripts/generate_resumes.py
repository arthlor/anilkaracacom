from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
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
PAGE_MARGIN_X = 16 * mm
PAGE_MARGIN_Y = 16 * mm
CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN_X * 2)
CONTENT_HEIGHT = PAGE_HEIGHT - (PAGE_MARGIN_Y * 2)

PALETTE = {
    "paper": colors.HexColor("#fbfaf7"),
    "ink": colors.HexColor("#16212b"),
    "muted": colors.HexColor("#5d6a73"),
    "accent": colors.HexColor("#1c6b64"),
    "accent_soft": colors.HexColor("#eef4f2"),
    "line": colors.HexColor("#d7dee0"),
    "label_bg": colors.HexColor("#f1efe8"),
}


def style(name: str, parent: ParagraphStyle, **kwargs):
    return ParagraphStyle(name=name, parent=parent, **kwargs)


BASE_STYLES = getSampleStyleSheet()
STYLES = {
    "pretitle": style(
        "Pretitle",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.2,
        leading=10,
        textColor=PALETTE["accent"],
        spaceAfter=3,
    ),
    "name": style(
        "Name",
        BASE_STYLES["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=30,
        textColor=PALETTE["ink"],
        spaceAfter=0,
    ),
    "title": style(
        "Title",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10.2,
        leading=13,
        textColor=PALETTE["accent"],
        spaceAfter=3,
    ),
    "intro": style(
        "Intro",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=9.3,
        leading=13.2,
        textColor=PALETTE["muted"],
        spaceAfter=4,
    ),
    "availability": style(
        "Availability",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.4,
        leading=9,
        textColor=PALETTE["accent"],
        alignment=TA_RIGHT,
    ),
    "meta": style(
        "Meta",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=8.7,
        leading=12,
        textColor=PALETTE["muted"],
        spaceAfter=0,
    ),
    "lead": style(
        "Lead",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=14.1,
        leading=18,
        textColor=PALETTE["ink"],
        spaceAfter=5,
    ),
    "summary": style(
        "Summary",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=9.6,
        leading=14.5,
        textColor=PALETTE["muted"],
        spaceAfter=0,
    ),
    "stats": style(
        "Stats",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.2,
        textColor=PALETTE["ink"],
        spaceAfter=0,
    ),
    "note": style(
        "Note",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Oblique",
        fontSize=8.4,
        leading=11.8,
        textColor=PALETTE["muted"],
        spaceAfter=0,
    ),
    "panel_label": style(
        "PanelLabel",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=7.4,
        leading=9,
        textColor=PALETTE["accent"],
        spaceAfter=4,
    ),
    "panel_body": style(
        "PanelBody",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=8.8,
        leading=12.4,
        textColor=PALETTE["ink"],
        spaceAfter=2,
    ),
    "section": style(
        "Section",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.1,
        leading=10,
        textColor=PALETTE["accent"],
        spaceAfter=2,
    ),
    "section_intro": style(
        "SectionIntro",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=9.1,
        leading=13.2,
        textColor=PALETTE["muted"],
        spaceAfter=0,
    ),
    "entry_role": style(
        "EntryRole",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=11.1,
        leading=13,
        textColor=PALETTE["ink"],
        spaceAfter=1,
    ),
    "entry_org": style(
        "EntryOrg",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.8,
        leading=11,
        textColor=PALETTE["accent"],
        spaceAfter=3,
    ),
    "entry_date": style(
        "EntryDate",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.4,
        leading=11,
        textColor=PALETTE["muted"],
        alignment=TA_RIGHT,
    ),
    "bullet": style(
        "Bullet",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        leftIndent=12,
        firstLineIndent=-8,
        textColor=PALETTE["ink"],
        spaceAfter=2,
    ),
    "work_name": style(
        "WorkName",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.8,
        leading=12,
        textColor=PALETTE["ink"],
        spaceAfter=1,
    ),
    "work_body": style(
        "WorkBody",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=8.9,
        leading=13.1,
        textColor=PALETTE["muted"],
        spaceAfter=0,
    ),
    "tool_label": style(
        "ToolLabel",
        BASE_STYLES["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=PALETTE["accent"],
    ),
    "tool_body": style(
        "ToolBody",
        BASE_STYLES["BodyText"],
        fontName="Helvetica",
        fontSize=8.9,
        leading=13,
        textColor=PALETTE["ink"],
    ),
}


def link_markup(label: str, url: str, color: str):
    return f'<link href="{url}" color="{color}">{label}</link>'


def find_sidebar_link(doc_def, label: str):
    for link_label, link_url in doc_def["sidebar_links"]:
        if link_label.lower() == label.lower():
            return link_url
    return None


def status_badge(text: str):
    badge = Table([[Paragraph(text, STYLES["availability"])]], colWidths=[70 * mm])
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALETTE["accent_soft"]),
                ("BOX", (0, 0), (-1, -1), 0.5, PALETTE["line"]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return badge


def contact_row(doc_def):
    items = [
        link_markup("anilkaraca140@gmail.com", "mailto:anilkaraca140@gmail.com", PALETTE["accent"].hexval()),
        link_markup("anilkaraca.com", "https://anilkaraca.com/", PALETTE["accent"].hexval()),
    ]

    linkedin_url = find_sidebar_link(doc_def, "LinkedIn")
    if linkedin_url:
        items.append(link_markup("LinkedIn", linkedin_url, PALETTE["accent"].hexval()))

    github_url = find_sidebar_link(doc_def, "GitHub")
    contact_url = find_sidebar_link(doc_def, "Contact")
    if github_url:
        items.append(link_markup("GitHub", github_url, PALETTE["accent"].hexval()))
    elif contact_url:
        items.append(link_markup("Contact", contact_url, PALETTE["accent"].hexval()))

    return Paragraph("  /  ".join(items), STYLES["meta"])


def stats_line(items):
    parts = []
    for item in items:
        parts.append(f'<b>{item["label"]}:</b> {item["value"]}')
    return Paragraph("  |  ".join(parts), STYLES["stats"])


def info_panel(title: str, content, width: float):
    flowables = [Paragraph(title.upper(), STYLES["panel_label"])]
    for item in content:
        if isinstance(item, Paragraph):
            flowables.append(item)
        else:
            flowables.append(Paragraph(item, STYLES["panel_body"]))

    panel = Table([[flowables]], colWidths=[width])
    panel.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALETTE["accent_soft"]),
                ("BOX", (0, 0), (-1, -1), 0.5, PALETTE["line"]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return panel


def info_band(doc_def):
    panel_gap = 5 * mm
    panel_width = (CONTENT_WIDTH - (panel_gap * 2)) / 3

    link_cells = [
        Paragraph(link_markup(label, url, PALETTE["ink"].hexval()), STYLES["panel_body"])
        for label, url in doc_def["sidebar_links"]
    ]

    band = Table(
        [[
            info_panel("Target roles", doc_def["target_roles"], panel_width),
            info_panel("Core strengths", doc_def["strengths"], panel_width),
            info_panel("Key links", link_cells, panel_width),
        ]],
        colWidths=[panel_width, panel_width, panel_width],
    )
    band.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("COLSPAN", (0, 0), (0, 0), 0),
            ]
        )
    )
    return band


def section_heading(title: str, subtitle: Optional[str] = None):
    flowables = [
        Spacer(1, 14),
        Paragraph(title.upper(), STYLES["section"]),
        HRFlowable(width="100%", thickness=0.55, color=PALETTE["line"]),
    ]
    if subtitle:
        flowables.extend([Spacer(1, 4), Paragraph(subtitle, STYLES["section_intro"])])
    return flowables


def experience_entry(entry):
    header = Table(
        [[Paragraph(entry["role"], STYLES["entry_role"]), Paragraph(entry["date"], STYLES["entry_date"])]],
        colWidths=[CONTENT_WIDTH - (34 * mm), 34 * mm],
    )
    header.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    flowables = [header, Paragraph(entry["org"], STYLES["entry_org"])]
    flowables.extend(Paragraph(f"- {item}", STYLES["bullet"]) for item in entry["bullets"])
    flowables.extend(
        [
            Spacer(1, 5),
            HRFlowable(width="100%", thickness=0.45, color=PALETTE["line"]),
            Spacer(1, 4),
        ]
    )
    return KeepTogether(flowables)


def work_items(items):
    flowables = []
    for index, item in enumerate(items):
        flowables.append(Paragraph(item["name"], STYLES["work_name"]))
        flowables.append(Paragraph(item["detail"], STYLES["work_body"]))
        if index < len(items) - 1:
            flowables.extend(
                [
                    Spacer(1, 4),
                    HRFlowable(width="100%", thickness=0.4, color=PALETTE["line"]),
                    Spacer(1, 5),
                ]
            )
    return flowables


def toolkit_table(groups):
    rows = []
    for label, body in groups:
        rows.append([Paragraph(label, STYLES["tool_label"]), Paragraph(body, STYLES["tool_body"])])

    table = Table(rows, colWidths=[44 * mm, CONTENT_WIDTH - (44 * mm)], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), PALETTE["label_bg"]),
                ("LINEABOVE", (0, 0), (-1, 0), 0.55, PALETTE["line"]),
                ("LINEBELOW", (0, -1), (-1, -1), 0.55, PALETTE["line"]),
                ("LINEBELOW", (0, 0), (-1, -2), 0.35, PALETTE["line"]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return table


def draw_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PALETTE["paper"])
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    canvas.setFillColor(PALETTE["accent"])
    canvas.rect(PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_Y + (3 * mm), CONTENT_WIDTH, 1.5 * mm, fill=1, stroke=0)

    canvas.setStrokeColor(PALETTE["line"])
    canvas.setLineWidth(0.5)
    canvas.line(PAGE_MARGIN_X, 12 * mm, PAGE_WIDTH - PAGE_MARGIN_X, 12 * mm)

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(PALETTE["muted"])
    canvas.drawString(PAGE_MARGIN_X, 7.5 * mm, "anilkaraca.com")
    canvas.drawRightString(PAGE_WIDTH - PAGE_MARGIN_X, 7.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_resume(doc_def):
    frame = Frame(
        PAGE_MARGIN_X,
        PAGE_MARGIN_Y,
        CONTENT_WIDTH,
        CONTENT_HEIGHT,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
        id="content",
    )

    doc = BaseDocTemplate(
        str(doc_def["path"]),
        pagesize=A4,
        leftMargin=PAGE_MARGIN_X,
        rightMargin=PAGE_MARGIN_X,
        topMargin=PAGE_MARGIN_Y,
        bottomMargin=PAGE_MARGIN_Y,
        title=doc_def["title"],
        author="Anil Karaca",
    )
    doc.addPageTemplates([PageTemplate(id="resume", frames=[frame], onPage=draw_page)])

    header = Table(
        [[Paragraph("Anil Karaca", STYLES["name"]), status_badge(doc_def["availability"])]],
        colWidths=[CONTENT_WIDTH - (74 * mm), 74 * mm],
    )
    header.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )

    story = [
        Paragraph(doc_def["title"].upper(), STYLES["pretitle"]),
        header,
        Paragraph(doc_def["sidebar_intro"], STYLES["intro"]),
        contact_row(doc_def),
        Spacer(1, 9),
        Paragraph(doc_def["headline"], STYLES["lead"]),
        Paragraph(doc_def["summary"], STYLES["summary"]),
        Spacer(1, 7),
        stats_line(doc_def["stats"]),
        Spacer(1, 10),
        info_band(doc_def),
    ]

    if doc_def.get("sidebar_note"):
        story.extend([Spacer(1, 7), Paragraph(doc_def["sidebar_note"], STYLES["note"])])

    story.extend(section_heading("Selected experience", doc_def["experience_intro"]))
    story.extend(experience_entry(entry) for entry in doc_def["experience"])

    story.extend(section_heading(doc_def["work_section_title"], doc_def["work_intro"]))
    story.extend(work_items(doc_def["work"]))

    story.extend(section_heading("Toolkit", doc_def["toolkit_intro"]))
    story.append(toolkit_table(doc_def["tool_groups"]))

    if doc_def.get("footer_note"):
        story.extend([Spacer(1, 8), Paragraph(doc_def["footer_note"], STYLES["note"])])

    doc.build(story)


RESUMES = [
    {
        "path": PUBLIC / "anilkaraca-cv.pdf",
        "title": "Data Journalist and Developer",
        "sidebar_intro": "Public-interest storyteller and product-minded builder with 10+ years across journalism, civic communications, and shipped digital work.",
        "sidebar_links": [
            ("Data journalism lane", "https://anilkaraca.com/data-journalism"),
            ("Developer lane", "https://anilkaraca.com/developer"),
            ("LinkedIn", "https://www.linkedin.com/in/anil-karaca/"),
            ("GitHub", "https://github.com/arthlor"),
        ],
        "target_roles": [
            "Data journalist",
            "Editorial product",
            "Frontend or mobile developer",
        ],
        "strengths": [
            "Reporting plus implementation",
            "Clear product communication",
            "Fast, resourceful execution",
        ],
        "sidebar_note": "Academic paper: News readers' perception of clickbait news.",
        "availability": "OPEN TO FULL-TIME INTERNATIONAL ROLES",
        "headline": "I am strongest in roles where reporting, analysis, interface design, and delivery need to work together.",
        "summary": "Data journalist and developer with a track record spanning elections, civic systems, mobile apps, and custom story formats. I can move from raw source material to analysis, narrative framing, and the final interface.",
        "stats": [
            {"label": "Experience", "value": "10+ years across journalism and digital product work"},
            {"label": "Core lanes", "value": "Data journalism and frontend or mobile delivery"},
            {"label": "Current focus", "value": "Full-time roles with global or remote teams"},
        ],
        "experience_intro": "The through-line is the same in each role: make complex things understandable and useful.",
        "experience": [
            {
                "role": "Independent app developer and data journalist",
                "org": "Self-directed work | 2025 - Present",
                "date": "2025 - Present",
                "bullets": [
                    "Shipping mobile apps while continuing political and civic data reporting.",
                    "Combining product execution with newsroom-style analysis and presentation.",
                ],
            },
            {
                "role": "Communications advisor",
                "org": "Izmir Metropolitan Municipality and Izbeton | 2024",
                "date": "2024",
                "bullets": [
                    "Produced civic communications, documentary work, and digital storytelling for large public audiences.",
                    "Built clarity around public-service topics across video, web, and editorial formats.",
                ],
            },
            {
                "role": "Senior digital journalist",
                "org": "BirGun, dokuz8HABER, Egede SonSoz | 2014 - 2024",
                "date": "2014 - 2024",
                "bullets": [
                    "Reported, edited, visualized, and published multi-format journalism with a digital-first approach.",
                    "Worked across breaking stories, long-form reporting, visual explainers, and audience-facing web formats.",
                ],
            },
        ],
        "work_section_title": "Selected work",
        "work_intro": "Examples that show the mix of editorial judgment and product delivery.",
        "work": [
            {"name": "Crackdown on CHP", "detail": "Data-led investigation documenting political pressure on Turkey's main opposition party."},
            {"name": "Parliament Analysis", "detail": "Interactive reporting product that turns parliamentary data into an explorable interface."},
            {"name": "Yeser, ChoreUs, AI Fit Check", "detail": "Released mobile apps built with React Native and Expo, covering wellness, household coordination, and AI-assisted consumer UX."},
            {"name": "Izmir civic data analyses", "detail": "Traffic collision and public-transportation investigations built from municipal open data and custom visual presentation."},
        ],
        "toolkit_intro": "A hybrid toolkit for editorial, analytical, and product work.",
        "tool_groups": [
            ("Reporting and analysis", "Python, Pandas, SQL, D3.js, Plotly, Flourish, data cleaning, and editorial framing."),
            ("Frontend and mobile", "React Native, Expo, React, Astro, JavaScript, TypeScript, and pragmatic product implementation."),
            ("Supporting capabilities", "Story design, scrollytelling, documentary production, communication strategy, and AI-assisted iteration."),
        ],
        "footer_note": "Portfolio links in this resume point to the role-specific landing pages so recruiters can review the most relevant work quickly.",
    },
    {
        "path": PUBLIC / "anil-karaca-data-journalism-cv.pdf",
        "title": "Data Journalist",
        "sidebar_intro": "Data journalist focused on elections, civic systems, accountability stories, and interactive reporting that makes public evidence easier to understand.",
        "sidebar_links": [
            ("Portfolio", "https://anilkaraca.com/"),
            ("Data journalism lane", "https://anilkaraca.com/data-journalism"),
            ("Contact", "https://anilkaraca.com/contact"),
            ("LinkedIn", "https://www.linkedin.com/in/anil-karaca/"),
        ],
        "target_roles": [
            "Data journalist",
            "Data reporter",
            "Investigative / visual reporting",
        ],
        "strengths": [
            "Public-interest analysis",
            "Web-native storytelling",
            "Source-to-story workflow",
        ],
        "sidebar_note": "Strong fit for editorial product teams that need reporting and implementation in the same role.",
        "availability": "OPEN TO DATA REPORTING AND EDITORIAL PRODUCT ROLES",
        "headline": "I report with data, but I also know how to structure and publish the story around it.",
        "summary": "My journalism work focuses on politics, urban systems, elections, and civic accountability. I can handle the full path from raw public datasets through cleaning, analysis, story framing, visualization, and final web delivery.",
        "stats": [
            {"label": "Coverage focus", "value": "Politics, civic systems, elections, and city data"},
            {"label": "Editorial edge", "value": "Analysis, visualization, and web-native formats"},
            {"label": "Hiring fit", "value": "Data reporting and editorial product roles"},
        ],
        "experience_intro": "The strongest fit is with teams that need rigorous analysis and publishable storytelling in one workflow.",
        "experience": [
            {
                "role": "Independent data journalist and reporter",
                "org": "Self-directed work | 2025 - Present",
                "date": "2025 - Present",
                "bullets": [
                    "Continuing public-interest analysis while building story-led digital formats.",
                    "Publishing work that connects politics, civic data, and public understanding.",
                ],
            },
            {
                "role": "Communications advisor",
                "org": "Izmir Metropolitan Municipality and Izbeton | 2024",
                "date": "2024",
                "bullets": [
                    "Produced civic storytelling and documentary work that improved clarity on public-service topics.",
                    "Strengthened narrative pacing, interview structure, and audience-oriented communication.",
                ],
            },
            {
                "role": "Senior digital journalist",
                "org": "BirGun, dokuz8HABER, Egede SonSoz | 2014 - 2024",
                "date": "2014 - 2024",
                "bullets": [
                    "Worked across reporting, editing, visual explainers, and digital-first publication workflows.",
                    "Developed a newsroom approach that combines speed, verification, and clear story architecture.",
                ],
            },
        ],
        "work_section_title": "Selected journalism work",
        "work_intro": "Projects chosen for editorial clarity, analytical depth, and public-interest relevance.",
        "work": [
            {"name": "Crackdown on CHP", "detail": "Data-led documentation of judicial pressure on Turkey's main opposition party."},
            {"name": "Parliament Analysis", "detail": "Interactive public-interest reporting on legislative behavior and party dynamics."},
            {"name": "Turkey Elections: Red Wave Conquers Anatolia", "detail": "English-language election analysis built with maps, charts, and contextual reporting."},
            {"name": "Izmir traffic and transportation analyses", "detail": "Civic-data stories built from large municipal datasets and turned into readable public explanations."},
        ],
        "toolkit_intro": "The editorial toolkit behind the stories.",
        "tool_groups": [
            ("Data workflow", "Python, Pandas, SQL, data cleaning, source normalization, and analysis for public-facing stories."),
            ("Visual storytelling", "D3.js, Plotly, Flourish, custom embeds, and scrollytelling-oriented presentation."),
            ("Editorial collaboration", "Story framing, digital publishing, interview-informed structure, and newsroom-adjacent product thinking."),
        ],
        "footer_note": "This version is intentionally optimized for recruiters and editors reviewing me for journalism-focused roles.",
    },
    {
        "path": PUBLIC / "anil-karaca-developer-cv.pdf",
        "title": "Frontend and Mobile Developer",
        "sidebar_intro": "Frontend and mobile developer with strong product instincts and a journalism background that improves clarity, prioritization, and user communication.",
        "sidebar_links": [
            ("Portfolio", "https://anilkaraca.com/"),
            ("Developer lane", "https://anilkaraca.com/developer"),
            ("Contact", "https://anilkaraca.com/contact"),
            ("GitHub", "https://github.com/arthlor"),
        ],
        "target_roles": [
            "Frontend developer",
            "Product engineer",
            "Mobile developer",
        ],
        "strengths": [
            "Product-minded implementation",
            "Content-aware UX decisions",
            "Fast iteration under constraints",
        ],
        "sidebar_note": "Best fit for teams that value clarity, communication, and shipping discipline alongside code quality.",
        "availability": "OPEN TO FRONTEND, MOBILE, AND PRODUCT ENGINEERING ROLES",
        "headline": "I build interfaces and apps that make complicated ideas feel clear, useful, and shippable.",
        "summary": "I ship React Native, Expo, React, and Astro work with a strong bias toward product clarity and execution. My journalism background makes me especially effective on content-heavy, data-heavy, or audience-facing products.",
        "stats": [
            {"label": "Primary stack", "value": "React Native, Expo, React, Astro, JavaScript"},
            {"label": "Best fit", "value": "Frontend, mobile, and editorial product teams"},
            {"label": "Differentiator", "value": "Strong writing, analysis, and product communication"},
        ],
        "experience_intro": "The common thread is product delivery shaped by editorial clarity and limited-resource execution.",
        "experience": [
            {
                "role": "Independent app developer and data journalist",
                "org": "Self-directed work | 2025 - Present",
                "date": "2025 - Present",
                "bullets": [
                    "Shipped consumer-facing mobile apps while continuing interactive editorial work.",
                    "Used AI-assisted workflows for speed while keeping final implementation and scope decisions disciplined.",
                ],
            },
            {
                "role": "Communications advisor",
                "org": "Izmir Metropolitan Municipality and Izbeton | 2024",
                "date": "2024",
                "bullets": [
                    "Built digital story packages and documentary work with strong audience and delivery constraints.",
                    "Developed a practical sense for prioritization, pacing, and communication in public-facing products.",
                ],
            },
            {
                "role": "Senior digital journalist",
                "org": "BirGun, dokuz8HABER, Egede SonSoz | 2014 - 2024",
                "date": "2014 - 2024",
                "bullets": [
                    "Created custom storytelling experiences that required editorial and technical execution together.",
                    "Worked close to content, audience, and product needs rather than isolated engineering tasks.",
                ],
            },
        ],
        "work_section_title": "Selected builds",
        "work_intro": "Projects chosen to show product judgment, not just code samples.",
        "work": [
            {"name": "Yeser", "detail": "Wellness app focused on repeat journaling, habit support, and clean mobile UX."},
            {"name": "ChoreUs", "detail": "Gamified household coordination app designed around participation and retention mechanics."},
            {"name": "AI Fit Check", "detail": "Consumer mobile app exploring AI-assisted feedback inside a playful product experience."},
            {"name": "Parliament Analysis", "detail": "React and D3.js interface for exploring parliamentary data as an editorial product."},
            {"name": "Attack on Ozgur Ozel", "detail": "Scrollytelling landing page built as a custom storytelling UI rather than a standard article."},
        ],
        "toolkit_intro": "The toolkit I use to move from concept to shipped interface.",
        "tool_groups": [
            ("Frontend and mobile", "React Native, Expo, React, Astro, JavaScript, TypeScript, and practical UI implementation."),
            ("Product workflow", "Rapid scoping, interaction design, content-aware UX, and AI-assisted iteration where it improves delivery speed."),
            ("Supporting data skills", "Python and analysis workflows for transforming raw inputs into usable product and visualization layers."),
        ],
        "footer_note": "This version foregrounds shipped apps and product execution while keeping editorial product work visible as a differentiator.",
    },
]


def export_master_copy():
    master_copy = ROOT / "anilkaraca.pdf"
    master_copy.write_bytes((PUBLIC / "anilkaraca-cv.pdf").read_bytes())


def build_text_copy():
    text_copy = ROOT / "tmp" / "pdfs" / "resume-copy.txt"
    text_copy.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    for resume in RESUMES:
        lines.append(resume["path"].name)
        lines.append(resume["title"])
        lines.append(resume["headline"])
        for entry in resume["experience"]:
            lines.append(entry["role"])
            lines.extend(entry["bullets"])
        lines.append("")
    text_copy.write_text("\n".join(lines), encoding="utf-8")


def main():
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for resume in RESUMES:
        build_resume(resume)
    export_master_copy()
    build_text_copy()


if __name__ == "__main__":
    main()
