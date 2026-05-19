"""Helpers for canonical assessment question hierarchy metadata.

AssessmentQuestion.hierarchy is the framework-neutral navigation contract used by
importers, questionnaire snapshotting, and the frontend tree sidebar.
"""

from __future__ import annotations

from typing import Any

HierarchyItem = dict[str, str]


EO100_PRINCIPLE_NAMES = {
    1: "Ethics & Compliance",
    2: "Transparency & Accountability",
    3: "Community Engagement",
    4: "Indigenous Peoples' Rights",
    5: "Labor Rights",
    6: "Health & Safety",
    7: "Environment",
    8: "Climate Change",
    9: "Biodiversity",
    10: "Decommissioning",
}


def _clean(value: Any, default: str = "") -> str:
    """Return a stripped string value safe for JSON hierarchy metadata."""
    if value is None:
        return default
    cleaned = str(value).strip()
    return cleaned or default


def _item(level: str, code: Any, label: Any) -> HierarchyItem:
    return {
        "level": level,
        "code": _clean(code),
        "label": _clean(label, _clean(code, level.replace("_", " ").title())),
    }


def build_bettercoal_hierarchy(
    *,
    principle_code: Any,
    principle_label: Any,
    category_code: Any,
    category_label: Any,
    provision_code: Any,
    provision_label: Any | None = None,
) -> list[HierarchyItem]:
    """Canonical Bettercoal hierarchy: Principle → Category → Provision."""
    provision_code_text = _clean(provision_code)
    return [
        _item("principle", principle_code, principle_label),
        _item("category", category_code, category_label),
        _item(
            "provision",
            provision_code_text,
            provision_label or f"Provision {provision_code_text}".strip(),
        ),
    ]


def build_eo100_hierarchy(
    *,
    principle_number: int,
    objective_number: int,
    performance_target_level: int,
) -> list[HierarchyItem]:
    """Canonical EO100 hierarchy: Principle → Objective → Performance Target."""
    principle_name = EO100_PRINCIPLE_NAMES.get(
        principle_number, f"Principle {principle_number}"
    )
    return [
        _item(
            "principle",
            f"P{principle_number}",
            f"Principle {principle_number}: {principle_name}",
        ),
        _item("objective", f"O{objective_number}", f"Objective {objective_number}"),
        _item(
            "performance_target",
            f"PT{performance_target_level}",
            f"Performance Target {performance_target_level}",
        ),
    ]


def build_cgwg_hierarchy(
    *,
    questionnaire_code: Any,
    questionnaire_label: Any,
    section_code: Any,
    section_label: Any,
    question_code: Any,
    question_label: Any | None = None,
) -> list[HierarchyItem]:
    """Canonical CGWG hierarchy: Questionnaire/Category → Section → Question."""
    return [
        _item("questionnaire", questionnaire_code, questionnaire_label),
        _item("section", section_code, section_label),
        _item(
            "question",
            question_code,
            question_label or f"Question {_clean(question_code)}",
        ),
    ]
