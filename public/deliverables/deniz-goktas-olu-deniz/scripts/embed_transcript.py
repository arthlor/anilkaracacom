from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REPORT_PATH = ROOT / "report.html"
COPY_PATH = ROOT / "copy.txt"
SECTIONS_PATH = ROOT / "data" / "transcript-sections.csv"
PASSAGES_PATH = ROOT / "data" / "questioned-passages.csv"

START_MARKER = "    <!-- TRANSCRIPT_DATA_START -->"
END_MARKER = "    <!-- TRANSCRIPT_DATA_END -->"
INSERT_ANCHOR = "    <script>\n      let anatomyChart;"


def build_payload() -> dict[str, object]:
    lines = COPY_PATH.read_text(encoding="utf-8-sig").splitlines()
    with SECTIONS_PATH.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    sections: list[dict[str, object]] = []
    covered_lines: list[int] = []

    for row in rows:
        start_line = int(row["start_line"])
        end_line = int(row["end_line"])
        source_lines = lines[start_line - 1 : end_line]
        if not source_lines:
            raise ValueError(f"Section {row['section_id']} has no source lines.")

        paragraphs = [
            {"line": line_number, "text": lines[line_number - 1]}
            for line_number in range(start_line + 1, end_line + 1)
        ]
        covered_lines.extend(range(start_line, end_line + 1))
        passage_ids = [
            passage_id
            for passage_id in row["questioned_passage_ids"].split(";")
            if passage_id
        ]

        sections.append(
            {
                "id": int(row["section_id"]),
                "title": source_lines[0].strip(),
                "chartTitle": row["title"],
                "startLine": start_line,
                "endLine": end_line,
                "wordCount": int(row["word_count"]),
                "theme": row["primary_theme"],
                "passageIds": passage_ids,
                "paragraphs": paragraphs,
            }
        )

    expected_lines = list(range(2, len(lines) + 1))
    if covered_lines != expected_lines:
        raise ValueError("Section line ranges do not cover copy.txt exactly once.")

    with PASSAGES_PATH.open(encoding="utf-8-sig", newline="") as handle:
        passage_rows = list(csv.DictReader(handle))

    questioned_passages: list[dict[str, object]] = []
    for row in passage_rows:
        line_start, line_end = (
            [int(value) for value in row["transcript_lines"].split("-", 1)]
            if "-" in row["transcript_lines"]
            else [int(row["transcript_lines"]), int(row["transcript_lines"])]
        )
        questioned_passages.append(
            {
                "id": row["passage_id"],
                "label": row["short_label"],
                "sectionId": int(row["section_id"]),
                "lineStart": line_start,
                "lineEnd": line_end,
                "focus": row["prosecutor_focus"],
            }
        )

    return {
        "documentTitle": lines[0],
        "source": "embedded-transcript",
        "lineCount": len(lines),
        "sectionCount": len(sections),
        "wordCount": sum(int(section["wordCount"]) for section in sections),
        "sections": sections,
        "questionedPassages": questioned_passages,
    }


def main() -> None:
    payload = build_payload()
    json_text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    json_text = json_text.replace("</", "<\\/")
    block = (
        f"{START_MARKER}\n"
        f"    <script type=\"application/json\" id=\"transcript-data\">{json_text}</script>\n"
        f"{END_MARKER}\n\n"
    )

    report = REPORT_PATH.read_text(encoding="utf-8")
    if START_MARKER in report and END_MARKER in report:
        before, remainder = report.split(START_MARKER, 1)
        _, after = remainder.split(END_MARKER, 1)
        report = before + block + after.lstrip("\n")
    elif INSERT_ANCHOR in report:
        report = report.replace(INSERT_ANCHOR, block + INSERT_ANCHOR, 1)
    else:
        raise ValueError("Could not find transcript data insertion point in report.html.")

    REPORT_PATH.write_text(report, encoding="utf-8")
    print(
        f"Embedded {payload['wordCount']:,} words across "
        f"{payload['sectionCount']} sections and {payload['lineCount']} source lines."
    )


if __name__ == "__main__":
    main()
