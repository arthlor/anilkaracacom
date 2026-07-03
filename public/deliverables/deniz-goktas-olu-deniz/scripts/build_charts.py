from __future__ import annotations

import argparse
import csv
import math
import os
from collections import Counter
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib-deniz-report")

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from matplotlib.lines import Line2D
from matplotlib.patches import Patch
import numpy as np
import pandas as pd
import seaborn as sns


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
ASSET_DIR = ROOT / "assets"

TOKENS = {
    "surface": "#F6F1E8",
    "panel": "#FFFCF7",
    "ink": "#1D1A17",
    "muted": "#6E665F",
    "grid": "#DED7CD",
    "axis": "#C9C0B5",
    "accent": "#B83B32",
}

THEME_COLORS = {
    "Siyaset ve kurumlar": "#B83B32",
    "Kimlik ve inanç": "#C7964D",
    "Gündelik hayat ve ilişkiler": "#507A78",
    "Medya ve kültür": "#6E6484",
    "Şiddet ve güvenlik": "#3F4650",
}

# Unified outcome colors matching the report design system
OUTCOME_COLORS = {
    "Mahkûmiyet": "#B83B32",
    "Beraat": "#507A78",
    "HAGB": "#C7964D",
    "Diğer": "#8E867F",
}

FONT_FAMILY = ["Inter", "DejaVu Sans", "Arial", "sans-serif"]
MONO_FONT_FAMILY = ["SFMono-Regular", "DejaVu Sans Mono", "Menlo", "monospace"]


def use_chart_theme() -> None:
    sns.set_theme(
        style="whitegrid",
        rc={
            "figure.facecolor": TOKENS["surface"],
            "savefig.facecolor": TOKENS["surface"],
            "axes.facecolor": TOKENS["panel"],
            "axes.edgecolor": TOKENS["axis"],
            "axes.labelcolor": TOKENS["ink"],
            "axes.grid": True,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "grid.color": TOKENS["grid"],
            "grid.linewidth": 0.8,
            "font.family": "sans-serif",
            "font.sans-serif": FONT_FAMILY,
            "font.monospace": MONO_FONT_FAMILY,
            "patch.linewidth": 1.0,
        },
    )


def add_chart_header(fig, ax, title: str, subtitle: str) -> None:
    ax.set_title("")
    fig.subplots_adjust(top=0.78)
    left = ax.get_position().x0
    fig.text(
        left,
        0.965,
        title,
        ha="left",
        va="top",
        fontsize=16,
        fontweight="bold",
        color=TOKENS["ink"],
    )
    fig.text(
        left,
        0.905,
        subtitle,
        ha="left",
        va="top",
        fontsize=10.5,
        color=TOKENS["muted"],
        linespacing=1.35,
    )


def load_data() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    sections = pd.read_csv(DATA_DIR / "transcript-sections.csv")
    passages = pd.read_csv(DATA_DIR / "questioned-passages.csv")
    outcomes = pd.read_csv(DATA_DIR / "court-outcomes.csv")
    return sections, passages, outcomes


def validate_data(
    sections: pd.DataFrame, passages: pd.DataFrame, outcomes: pd.DataFrame
) -> None:
    assert len(sections) == 34, f"Expected 34 transcript sections, got {len(sections)}"
    assert int(sections["word_count"].sum()) == 11208, "Transcript word total drifted"
    assert sections["section_id"].is_unique, "Section IDs must be unique"
    assert set(sections["primary_theme"]) == set(THEME_COLORS), "Theme map mismatch"

    assert len(passages) == 10, f"Expected 10 questioned passages, got {len(passages)}"
    assert passages["passage_id"].is_unique, "Passage IDs must be unique"
    assert set(passages["section_id"]).issubset(set(sections["section_id"])), (
        "A questioned passage points to a missing section"
    )

    for row in outcomes.itertuples(index=False):
        counted = (
            row.conviction_count
            + row.acquittal_count
            + row.hagb_count
            + row.other_count
        )
        assert counted == row.denominator, f"Outcome counts do not sum for {row.statute}"
        shares = (
            row.conviction_share
            + row.acquittal_share
            + row.hagb_share
            + row.other_share
        )
        assert math.isclose(shares, 100.0, abs_tol=0.2), (
            f"Rounded shares do not sum to 100 for {row.statute}: {shares}"
        )


def turkish_int(value: float, _position: int | None = None) -> str:
    return f"{int(value):,}".replace(",", ".")


def build_transcript_chart(sections: pd.DataFrame, passages: pd.DataFrame) -> None:
    use_chart_theme()
    fig, ax = plt.subplots(figsize=(14, 7.2), dpi=180)

    cumulative = 0.0
    centers: dict[int, tuple[float, float, float]] = {}
    lane_order = [
        "Şiddet ve güvenlik",
        "Siyaset ve kurumlar",
        "Medya ve kültür",
        "Kimlik ve inanç",
        "Gündelik hayat ve ilişkiler",
    ]
    lane_y = {label: 4 - index for index, label in enumerate(lane_order)}
    path_x: list[float] = []
    path_y: list[float] = []
    for row in sections.itertuples(index=False):
        width = float(row.word_count)
        y = lane_y[row.primary_theme]
        center = cumulative + width / 2
        ax.broken_barh(
            [(cumulative, width)],
            (y - 0.25, 0.5),
            facecolors=THEME_COLORS[row.primary_theme],
            edgecolors=TOKENS["panel"],
            linewidth=1.2,
            zorder=3,
        )
        centers[int(row.section_id)] = (center, width, y)
        path_x.append(center)
        path_y.append(y)
        cumulative += width

    # Sleek narrative path line connecting sections sequentially
    ax.plot(
        path_x,
        path_y,
        color="#BDB4A8",
        linewidth=1.0,
        linestyle="--",
        alpha=0.6,
        zorder=1,
    )

    counts = Counter(int(value) for value in passages["section_id"])
    seen: Counter[int] = Counter()
    for passage in passages.itertuples(index=False):
        section_id = int(passage.section_id)
        seen[section_id] += 1
        center, width, y = centers[section_id]
        n = counts[section_id]
        offset = (seen[section_id] - (n + 1) / 2) * min(width * 0.16, 35)
        ax.scatter(
            center + offset,
            y + 0.42,
            marker="D",
            s=54,
            color=TOKENS["accent"],
            edgecolor=TOKENS["panel"],
            linewidth=1.0,
            zorder=6,
        )

    ax.set_xlim(0, cumulative)
    ax.set_ylim(-0.65, 4.82)
    ax.set_yticks([lane_y[label] for label in lane_order])
    ax.set_yticklabels(lane_order, fontsize=10.5, fontweight="semibold")
    ax.set_xlabel("Dökümdeki kümülatif söz sayısı", labelpad=12, fontsize=11)
    ax.xaxis.set_major_locator(mticker.MaxNLocator(7))
    ax.xaxis.set_major_formatter(mticker.FuncFormatter(turkish_int))
    ax.grid(axis="x", linestyle=":", linewidth=0.8, color=TOKENS["grid"])
    ax.grid(axis="y", color="#E9E2D9", linestyle="-", linewidth=0.8)
    ax.spines["left"].set_visible(False)

    handles = [
        Line2D(
            [0],
            [0],
            marker="D",
            color="none",
            markerfacecolor=TOKENS["accent"],
            markeredgecolor=TOKENS["panel"],
            markersize=8,
            label="Savcılıkta sorulduğu aktarılan pasaj",
        )
    ]
    ax.legend(
        handles=handles,
        loc="upper left",
        bbox_to_anchor=(0, -0.16),
        frameon=False,
        fontsize=9.5,
    )

    add_chart_header(
        fig,
        ax,
        "Ölü Deniz Transkriptinin Yapısal Dağılımı ve Soruşturma Konusu Pasajlar",
        "34 editoryal bölümün kelime uzunluklarına göre dağılımı. İşaretçiler, savcılık sorgusuna konu olan 10 pasajın konumunu göstermektedir.",
    )
    fig.text(
        ax.get_position().x0,
        0.025,
        "Not: Bölüm sınıfları editoryal kodlamadır; işaretler kelime hassasiyetinde zaman kodu değil, bölüm eşleşmesidir. Kaynak: Kullanıcı tarafından sağlanan döküm ve yayımlanan savcılık ifadesi.",
        ha="left",
        va="bottom",
        fontsize=8.5,
        color=TOKENS["muted"],
    )
    fig.subplots_adjust(bottom=0.28)
    for ext in ("png", "svg"):
        fig.savefig(
            ASSET_DIR / f"transcript-anatomy.{ext}",
            bbox_inches="tight",
            dpi=220,
        )
    plt.close(fig)


def build_outcomes_chart(outcomes: pd.DataFrame) -> None:
    use_chart_theme()
    fig, axes = plt.subplots(1, 2, figsize=(13.4, 7.2), dpi=180)

    categories = [
        ("Mahkûmiyet", "conviction_share", "conviction_count"),
        ("Beraat", "acquittal_share", "acquittal_count"),
        ("HAGB", "hagb_share", "hagb_count"),
        ("Diğer", "other_share", "other_count"),
    ]

    for ax, row in zip(axes, outcomes.itertuples(index=False)):
        dot_categories: list[str] = []
        running = 0
        for index, (label, share_field, _) in enumerate(categories):
            share = float(getattr(row, share_field))
            dots = int(round(share)) if index < len(categories) - 1 else 100 - running
            running += dots
            dot_categories.extend([label] * dots)

        x = np.tile(np.arange(10), 10)
        y = np.repeat(np.arange(9, -1, -1), 10)
        colors = [OUTCOME_COLORS[label] for label in dot_categories]
        
        # Waffle plot using custom square markers for a premium look
        ax.scatter(
            x,
            y,
            s=220,
            c=colors,
            marker="s",  # Elegant square dots
            edgecolors=TOKENS["panel"],
            linewidths=1.2,
        )

        statute_label = "TCK 299–301*" if row.statute == "TCK 299–301" else row.statute
        ax.text(
            0,
            10.45,
            statute_label,
            fontsize=15,
            fontweight="bold",
            color=TOKENS["ink"],
            ha="left",
        )
        ax.text(
            9,
            10.45,
            f"n = {turkish_int(row.denominator)}",
            fontsize=9.5,
            color=TOKENS["muted"],
            ha="right",
            fontfamily=MONO_FONT_FAMILY[0],
        )

        # Legend/Footer position tweaks
        footer_positions = [(0, -1.05), (0, -1.72), (0, -2.39), (0, -3.06)]
        for (label, share_field, count_field), (fx, fy) in zip(categories, footer_positions):
            share = float(getattr(row, share_field))
            count = int(getattr(row, count_field))
            ax.scatter(
                [fx],
                [fy],
                s=65,
                color=OUTCOME_COLORS[label],
                marker="s",
                edgecolor="none",
                clip_on=False,
            )
            ax.text(
                fx + 0.42,
                fy,
                f"{label}  %{str(share).replace('.', ',')} · {turkish_int(count)} kişi",
                ha="left",
                va="center",
                fontsize=9.0,
                color=TOKENS["ink"],
                clip_on=False,
            )

        ax.set_xlim(-0.55, 9.55)
        ax.set_ylim(-3.42, 11.0)
        ax.set_aspect("equal")
        ax.axis("off")

    left = axes[0].get_position().x0
    fig.text(
        left,
        0.975,
        "Her 100 Karardan Kaçı Mahkûmiyetle Sonuçlandı?",
        ha="left",
        va="top",
        fontsize=16,
        fontweight="bold",
        color=TOKENS["ink"],
    )
    fig.text(
        left,
        0.925,
        "2025’te ceza mahkemelerinde karara bağlanan sanıklar. Her kare %1'i temsil etmektedir; kesin oranlar matrislerin altındadır.",
        ha="left",
        va="top",
        fontsize=10.5,
        color=TOKENS["muted"],
    )
    fig.text(
        left,
        0.055,
        "* TCK 299 (Cumhurbaşkanına hakaret), 300 ve 301 ayrı ayrı yayımlanmadığı için bu satır yalnızca TCK 299 verisi değildir. HAGB: Hükmün açıklanmasının geri bırakılması.",
        ha="left",
        va="bottom",
        fontsize=8.5,
        color=TOKENS["muted"],
    )
    fig.text(
        left,
        0.023,
        "Kaynak: T.C. Adalet Bakanlığı, Adalet İstatistikleri 2025, ceza mahkemelerinde karara bağlanan dosyalar tablosu.",
        ha="left",
        va="bottom",
        fontsize=8.5,
        color=TOKENS["muted"],
    )
    fig.subplots_adjust(left=0.06, right=0.98, top=0.82, bottom=0.18, wspace=0.18)
    for ext in ("png", "svg"):
        fig.savefig(
            ASSET_DIR / f"court-outcomes.{ext}",
            bbox_inches="tight",
            dpi=220,
        )
    plt.close(fig)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate report data and build charts.")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()

    sections, passages, outcomes = load_data()
    validate_data(sections, passages, outcomes)
    print("Validated: 34 sections, 11,208 words, 10 questioned passages.")
    print("Validated: court-outcome counts and rounded shares.")
    if args.validate_only:
        return

    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    build_transcript_chart(sections, passages)
    build_outcomes_chart(outcomes)
    print(f"Wrote charts to {ASSET_DIR}")


if __name__ == "__main__":
    main()
