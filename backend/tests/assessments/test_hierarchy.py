"""Tests for canonical framework hierarchy builders."""

from assessments.services.hierarchy import (
    build_bettercoal_hierarchy,
    build_cgwg_hierarchy,
    build_eo100_hierarchy,
)
from seed_eo100_saq import iter_eo100_questions


def test_build_bettercoal_hierarchy_uses_principle_category_provision():
    hierarchy = build_bettercoal_hierarchy(
        principle_code=1,
        principle_label="Human Rights",
        category_code="1.1",
        category_label="Policy",
        provision_code="1.1.2",
    )

    assert hierarchy == [
        {"level": "principle", "code": "1", "label": "Human Rights"},
        {"level": "category", "code": "1.1", "label": "Policy"},
        {"level": "provision", "code": "1.1.2", "label": "Provision 1.1.2"},
    ]


def test_build_eo100_hierarchy_uses_principle_objective_performance_target():
    hierarchy = build_eo100_hierarchy(
        principle_number=1,
        objective_number=2,
        performance_target_level=3,
    )

    assert hierarchy == [
        {
            "level": "principle",
            "code": "P1",
            "label": "Principle 1: Ethics & Compliance",
        },
        {"level": "objective", "code": "O2", "label": "Objective 2"},
        {
            "level": "performance_target",
            "code": "PT3",
            "label": "Performance Target 3",
        },
    ]


def test_build_cgwg_hierarchy_uses_questionnaire_section_question():
    hierarchy = build_cgwg_hierarchy(
        questionnaire_code="cgwg-saq",
        questionnaire_label="CGWG SAQ",
        section_code="governance",
        section_label="Governance",
        question_code="Q4",
    )

    assert hierarchy == [
        {"level": "questionnaire", "code": "cgwg-saq", "label": "CGWG SAQ"},
        {"level": "section", "code": "governance", "label": "Governance"},
        {"level": "question", "code": "Q4", "label": "Question Q4"},
    ]


def test_iter_eo100_questions_flattens_legacy_nested_json():
    questions = list(
        iter_eo100_questions(
            {
                "100": {
                    "1": {
                        "2": {
                            "3": {
                                "text": "Operator keeps records.",
                                "pt": 2,
                                "description": "Record examples",
                            }
                        }
                    }
                }
            }
        )
    )

    assert questions == [
        {
            "external_id": "100.1.2.3",
            "principle_num": 1,
            "objective_num": 2,
            "pt_level": 2,
            "text": "Operator keeps records.",
            "description": "Record examples",
        }
    ]
