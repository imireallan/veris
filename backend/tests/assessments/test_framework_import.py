"""Regression tests for framework import production failure modes."""

import pytest


@pytest.mark.django_db
def test_import_service_truncates_bounded_question_fields(make_org):
    from assessments.models import AssessmentQuestion
    from assessments.services.framework_import import FrameworkImportService

    org = make_org()
    service = FrameworkImportService("/tmp/import.csv", original_filename="import.csv")
    long_name = "Framework " + ("x" * 260)
    long_principle = "Principle " + ("p" * 260)
    long_category = "Category " + ("c" * 260)
    long_code = "CODE-" + ("1" * 80)

    framework, template, questions_count = service.create_framework(
        name=long_name,
        version="1.0.0" + ("v" * 80),
        description="Imported long-field regression fixture",
        provisions=[
            {
                "principle_sequence": "1",
                "principle_name": long_principle,
                "category_sequence": "1.1",
                "category_name": long_category,
                "provision_code": long_code,
                "description": "Question text",
                "rating_choices": [0, 1, 2, 3, 4],
            }
        ],
        create_template=True,
        organization_id=org.id,
    )

    question = AssessmentQuestion.objects.get(template=template)
    assert questions_count == 1
    assert len(framework.name) == 200
    assert len(framework.version) == 50
    assert len(template.name) == 200
    assert len(template.slug) <= 200
    assert len(question.category) == 200
    assert len(question.external_question_id) == 50


@pytest.mark.django_db
def test_import_view_resolves_superuser_org_from_header(make_user, make_org):
    from rest_framework.test import APIRequestFactory

    from assessments.views.framework_import import FrameworkImportViewSet

    user = make_user(email="admin@example.com", is_superuser=True)
    org = make_org(name="Demo Automotive Inc", slug="demo-automotive")
    request = APIRequestFactory().post(
        "/api/frameworks/import/preview/",
        HTTP_X_ORGANIZATION_ID=str(org.id),
    )
    request.user = user

    view = FrameworkImportViewSet()

    assert view._get_request_organization(request) == org


@pytest.mark.django_db
def test_import_view_resolves_member_org_from_header(
    make_user, make_org, make_membership
):
    from rest_framework.test import APIRequestFactory

    from assessments.views.framework_import import FrameworkImportViewSet

    user = make_user(email="member@example.com")
    org = make_org(name="Member Org", slug="member-org")
    make_membership(user=user, organization=org, fallback_role="ADMIN")
    request = APIRequestFactory().post(
        "/api/frameworks/import/preview/",
        HTTP_X_ORGANIZATION_ID=str(org.id),
    )
    request.user = user

    view = FrameworkImportViewSet()

    assert view._get_request_organization(request) == org
