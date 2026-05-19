"""Tests for framework seed data hierarchy metadata."""

import pytest
from django.core.management import call_command
from django.db.models import Count

from assessments.models import AssessmentQuestion, AssessmentTemplate


@pytest.mark.django_db
@pytest.mark.integrated
def test_seed_frameworks_populates_eo100_and_cgwg_unique_question_banks():
    call_command("seed_frameworks")

    eo100_templates = AssessmentTemplate.objects.filter(
        framework__slug="eo100-standard",
        status=AssessmentTemplate.Status.PUBLISHED,
    )
    assert eo100_templates.count() == 3
    assert {template.supplement_type for template in eo100_templates} == {
        AssessmentTemplate.SupplementType.DEFAULT,
        AssessmentTemplate.SupplementType.PROCESSING,
        AssessmentTemplate.SupplementType.TRANSMISSION_STORAGE,
    }

    eo100_questions = AssessmentQuestion.objects.filter(template__in=eo100_templates)
    assert eo100_questions.count() == 629
    assert (
        eo100_questions.exclude(external_question_id__isnull=True)
        .exclude(external_question_id="")
        .count()
        == 629
    )
    assert (
        eo100_questions.values("external_question_id")
        .annotate(total=Count("id"))
        .filter(total__gt=1)
        .count()
        == 0
    )
    eo100_question = eo100_questions.order_by("order").first()
    assert eo100_question is not None
    assert [item["level"] for item in eo100_question.hierarchy] == [
        "principle",
        "objective",
        "performance_target",
    ]

    cgwg_template = AssessmentTemplate.objects.get(slug="cgwg-saq-2024")
    cgwg_questions = AssessmentQuestion.objects.filter(template=cgwg_template)
    assert cgwg_questions.count() == 15
    assert cgwg_questions.values("text").distinct().count() == 15
    assert (
        cgwg_questions.exclude(external_question_id__isnull=True)
        .exclude(external_question_id="")
        .count()
        == 15
    )
    cgwg_question = cgwg_questions.order_by("order").first()
    assert cgwg_question is not None
    assert [item["level"] for item in cgwg_question.hierarchy] == [
        "questionnaire",
        "section",
        "question",
    ]
