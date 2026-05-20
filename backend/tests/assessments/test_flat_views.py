"""Tests for flat assessment views, including aggregate endpoint."""

import sys
from types import SimpleNamespace

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from assessments.models import (
    Assessment,
    AssessmentActionInstance,
    AssessmentQuestion,
    AssessmentReport,
    AssessmentResponse,
    AssessmentTemplate,
    AssessmentWorkflowInstance,
    EvidenceCheckRun,
    Framework,
    WorkflowTemplate,
)
from assessments.services.workflows import (
    ensure_assessment_workflow,
    refresh_workflow_state,
)
from organizations.models import Organization, OrganizationMembership
from users.models import User
from users.roles import UserRole


@pytest.mark.django_db
class TestFlatAssessmentViewSet:
    """Test the FlatAssessmentViewSet and its aggregate endpoint."""

    def setup_method(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )

        # Create two organizations
        self.org1 = Organization.objects.create(name="Org 1", slug="org-1")
        self.org2 = Organization.objects.create(name="Org 2", slug="org-2")

        # Create memberships for both organizations
        self.membership1 = OrganizationMembership.objects.create(
            user=self.user, organization=self.org1, fallback_role=UserRole.OPERATOR
        )
        self.membership2 = OrganizationMembership.objects.create(
            user=self.user, organization=self.org2, fallback_role=UserRole.ASSESSOR
        )

        # Create assessments in both organizations
        self.assessment1 = Assessment.objects.create(
            organization=self.org1,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )
        self.assessment2 = Assessment.objects.create(
            organization=self.org2,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )

    def test_get_queryset_returns_all_user_assessments(self):
        """Test that get_queryset returns all assessments user has access to."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/assessments/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 2
        assessment_ids = {item["id"] for item in data["results"]}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids

    def test_get_queryset_filters_by_organization(self):
        """Test that get_queryset filters by organization when specified."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/assessments/?organization={self.org1.id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 1
        assert data["results"][0]["organization"] == str(self.org1.id)

    def test_aggregate_endpoint_returns_all_assessments(self):
        """Test that aggregate endpoint returns assessments from all user organizations."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assessment_ids = {item["id"] for item in data}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids

    def test_aggregate_endpoint_filters_by_specific_orgs(self):
        """Test that aggregate endpoint can filter by specific org IDs."""
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            f"/api/assessments/aggregate/?org_ids={self.org1.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["organization"] == str(self.org1.id)

    def test_aggregate_endpoint_with_multiple_org_ids(self):
        """Test that aggregate endpoint works with multiple org IDs."""
        self.client.force_authenticate(user=self.user)

        org_ids = f"{self.org1.id},{self.org2.id}"
        response = self.client.get(f"/api/assessments/aggregate/?org_ids={org_ids}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assessment_ids = {item["id"] for item in data}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids

    def test_aggregate_endpoint_does_not_leak_other_org_assessments(self):
        """Regular users cannot use org_ids to access assessments from other orgs."""
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        other_assessment = Assessment.objects.create(
            organization=other_org,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/assessments/aggregate/?org_ids={other_org.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        assert all(item["id"] != str(other_assessment.id) for item in data)

    def test_aggregate_endpoint_unauthenticated(self):
        """Test that aggregate endpoint returns 403 for unauthenticated users."""
        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_aggregate_endpoint_no_memberships(self):
        """Test that aggregate endpoint returns empty when user has no memberships."""
        user_no_memberships = User.objects.create_user(
            email="no-memberships@example.com",
            password="testpass123",
            name="No Memberships User",
        )
        self.client.force_authenticate(user=user_no_memberships)
        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_aggregate_endpoint_with_superadmin(self):
        """Test that superadmin can see all assessments."""
        # Create another org and assessment that user shouldn't have access to
        org3 = Organization.objects.create(name="Org 3", slug="org-3")
        assessment3 = Assessment.objects.create(
            organization=org3,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
        )

        superuser = User.objects.create_superuser(
            email="super2@example.com",  # Different email to avoid conflict
            password="superpass123",
            name="Super User 2",
        )

        self.client.force_authenticate(user=superuser)
        response = self.client.get("/api/assessments/aggregate/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Superadmin should see all assessments
        assert isinstance(data, list)
        assert len(data) == 3
        assessment_ids = {item["id"] for item in data}
        assert str(self.assessment1.id) in assessment_ids
        assert str(self.assessment2.id) in assessment_ids
        assert str(assessment3.id) in assessment_ids

    def test_create_with_template_snapshots_questionnaire_questions_and_responses(self):
        """Flat assessment creation must not create empty questionnaires when template is selected."""
        self.membership1.fallback_role = UserRole.ADMIN
        self.membership1.save(update_fields=["fallback_role"])
        framework = Framework.objects.create(name="CGWG", version="2024")
        template = AssessmentTemplate.objects.create(
            name="CGWG SAQ",
            slug="cgwg-saq-flat-create",
            framework=framework,
            organization=self.org1,
            owner_org=self.org1,
            is_public=False,
            status=AssessmentTemplate.Status.PUBLISHED,
            version="2024",
        )
        template_question = AssessmentQuestion.objects.create(
            template=template,
            organization=self.org1,
            text="Does the supplier have a due diligence policy?",
            category="Governance",
            hierarchy=[
                {"level": "section", "code": "A", "label": "Governance"},
                {"level": "topic", "code": "A1", "label": "Due diligence"},
            ],
            order=1,
            scoring_criteria={"type": "yes_no"},
            external_question_id="CGWG-1",
        )

        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )
        response = self.client.post(
            "/api/assessments/",
            {
                "organization": str(self.org1.id),
                "template": str(template.id),
                "framework": str(framework.id),
                "start_date": "2026-05-01T00:00:00Z",
                "due_date": "2026-06-01T23:59:59Z",
            },
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert response.status_code == status.HTTP_201_CREATED
        assessment = Assessment.objects.get(id=response.json()["id"])
        snapshot_question = AssessmentQuestion.objects.get(assessment=assessment)
        assert snapshot_question.template is None
        assert snapshot_question.source_template_question == template_question
        assert snapshot_question.text == template_question.text
        assert snapshot_question.hierarchy == template_question.hierarchy
        assert AssessmentResponse.objects.filter(
            assessment=assessment,
            question=snapshot_question,
            organization=self.org1,
            created_by=self.user,
        ).exists()


@pytest.mark.django_db
class TestFlatAssessmentReportViewSet:
    def setup_method(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="Report Org", slug="report-org")

        self.viewer = User.objects.create_user(
            email="viewer@example.com",
            password="testpass123",
            name="Viewer",
        )
        self.no_report_user = User.objects.create_user(
            email="operator@example.com",
            password="testpass123",
            name="Operator",
        )
        self.exporter = User.objects.create_user(
            email="executive@example.com",
            password="testpass123",
            name="Executive",
        )

        OrganizationMembership.objects.create(
            user=self.viewer,
            organization=self.org,
            fallback_role=UserRole.ASSESSOR,
        )
        OrganizationMembership.objects.create(
            user=self.no_report_user,
            organization=self.org,
            fallback_role=UserRole.OPERATOR,
        )
        OrganizationMembership.objects.create(
            user=self.exporter,
            organization=self.org,
            fallback_role=UserRole.EXECUTIVE,
        )

        self.assessment = Assessment.objects.create(
            organization=self.org,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.viewer,
        )
        self.report = AssessmentReport.objects.create(
            organization=self.org,
            assessment=self.assessment,
            title="Assessment Report",
            executive_summary="Read me",
        )

    def authenticate_with_org_context(self, user):
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

    def test_list_requires_report_view_permission(self):
        self.client.force_authenticate(user=self.no_report_user)

        response = self.client.get(
            f"/api/reports/?assessment={self.assessment.id}&org={self.org.id}"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_allows_user_with_report_view_permission(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.get(
            f"/api/reports/?assessment={self.assessment.id}&org={self.org.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["results"]) == 1
        assert data["results"][0]["id"] == str(self.report.id)

    def test_retrieve_requires_report_view_permission(self):
        self.client.force_authenticate(user=self.no_report_user)

        response = self.client.get(
            f"/api/reports/{self.report.id}/",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_retrieve_allows_user_with_report_view_permission(self):
        self.client.force_authenticate(user=self.viewer)

        response = self.client.get(
            f"/api/reports/{self.report.id}/",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["id"] == str(self.report.id)

    def test_export_requires_report_export_permission(self):
        self.authenticate_with_org_context(self.viewer)

        response = self.client.get(f"/api/reports/{self.report.id}/export/pdf/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json()["error"] == "Access denied"

    def test_export_allows_user_with_report_export_permission(self, monkeypatch):
        self.authenticate_with_org_context(self.exporter)

        class FakeReportGenerator:
            def __init__(self, report):
                self.report = report

            def generate_pdf(self):
                return b"%PDF-1.4 fake pdf bytes"

            def generate_filename(self):
                return "assessment-report.pdf"

        fake_reports_services = SimpleNamespace(
            ReportGenerator=FakeReportGenerator,
            ReportGenerationError=Exception,
        )
        monkeypatch.setitem(sys.modules, "reports.services", fake_reports_services)

        response = self.client.get(f"/api/reports/{self.report.id}/export/pdf/")

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "application/pdf"
        assert "assessment-report.pdf" in response["Content-Disposition"]
        assert response.content.startswith(b"%PDF-1.4")


@pytest.mark.django_db
class TestFlatAssessmentResponseViewSet:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="responses@example.com",
            password="testpass123",
            name="Responses User",
        )
        self.org1 = Organization.objects.create(
            name="Responses Org 1", slug="responses-org-1"
        )
        self.org2 = Organization.objects.create(
            name="Responses Org 2", slug="responses-org-2"
        )
        OrganizationMembership.objects.create(
            user=self.user,
            organization=self.org1,
            fallback_role=UserRole.OPERATOR,
        )
        self.assessment1 = Assessment.objects.create(
            organization=self.org1,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )
        self.assessment2 = Assessment.objects.create(
            organization=self.org2,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
        )
        self.question1 = AssessmentQuestion.objects.create(
            assessment=self.assessment1,
            organization=self.org1,
            text="Allowed questionnaire question",
            order=1,
        )
        self.response1 = AssessmentResponse.objects.create(
            assessment=self.assessment1,
            organization=self.org1,
            answer_text="Allowed response",
            created_by=self.user,
        )
        self.response2 = AssessmentResponse.objects.create(
            assessment=self.assessment2,
            organization=self.org2,
            answer_text="Other tenant response",
        )

    def test_detail_does_not_leak_response_from_inaccessible_org(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(f"/api/responses/{self.response2.id}/")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_detail_respects_active_organization_context(self):
        OrganizationMembership.objects.create(
            user=self.user,
            organization=self.org2,
            fallback_role=UserRole.OPERATOR,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            f"/api/responses/{self.response2.id}/",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_create_rejects_assessment_outside_active_organization(self):
        OrganizationMembership.objects.create(
            user=self.user,
            organization=self.org2,
            fallback_role=UserRole.OPERATOR,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/responses/",
            {
                "assessment": str(self.assessment2.id),
                "answer_text": "Cross-org create attempt",
            },
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_nested_create_updates_existing_assessment_question_response(self):
        self.client.force_authenticate(user=self.user)
        url = f"/api/organizations/{self.org1.id}/assessments/{self.assessment1.id}/responses/"

        first = self.client.post(
            url,
            {
                "question": str(self.question1.id),
                "answer_text": "Initial answer",
                "operator_answer": "Initial answer",
            },
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )
        second = self.client.post(
            url,
            {
                "question": str(self.question1.id),
                "answer_text": "Updated answer",
                "operator_answer": "Updated answer",
            },
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert first.status_code == status.HTTP_201_CREATED
        assert second.status_code == status.HTTP_201_CREATED
        responses = AssessmentResponse.objects.filter(
            assessment=self.assessment1,
            question=self.question1,
        )
        assert responses.count() == 1
        saved_response = responses.get()
        assert saved_response.answer_text == "Updated answer"
        assert second.data["id"] == str(saved_response.id)

    def test_validate_uses_detail_scope_without_assessment_query(self, monkeypatch):
        self.client.force_authenticate(user=self.user)

        def fake_validate_response(**kwargs):
            assert kwargs["response_text"] == "Allowed response"
            assert kwargs["organization_id"] == str(self.org1.id)
            assert kwargs["assessment_id"] == str(self.assessment1.id)
            return SimpleNamespace(
                validation_status="supported",
                confidence_score=0.91,
                citations=[{"document_id": "doc-1", "chunk_id": "chunk-1"}],
                similar_chunks=[{"id": "chunk-1"}],
                feedback="Supported by attached evidence.",
                result_json={
                    "status": "supported",
                    "summary": "Supported by attached evidence.",
                    "citations": [{"document_id": "doc-1", "chunk_id": "chunk-1"}],
                },
                evidence_snapshot={"attached_count": 1},
                model_provider="test-provider",
                model_name="test-model",
                prompt_version="evidence-check-test",
            )

        monkeypatch.setattr(
            "assessments.services.validation.validate_response",
            fake_validate_response,
        )

        response = self.client.post(
            f"/api/responses/{self.response1.id}/validate/",
            {},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["validation_status"] == "supported"
        self.response1.refresh_from_db()
        assert self.response1.validation_status == "supported"
        assert self.response1.confidence_score == 0.91
        run = EvidenceCheckRun.objects.get(response=self.response1)
        assert run.status == "supported"
        assert run.result_json["summary"] == "Supported by attached evidence."
        assert run.retrieved_evidence_snapshot == {"attached_count": 1}
        assert run.model_provider == "test-provider"

    def test_validate_service_failure_returns_json_error(self, monkeypatch):
        self.client.force_authenticate(user=self.user)

        def fake_validate_response(**kwargs):
            raise RuntimeError("Pinecone authentication failed")

        monkeypatch.setattr(
            "assessments.services.validation.validate_response",
            fake_validate_response,
        )

        response = self.client.post(
            f"/api/responses/{self.response1.id}/validate/",
            {},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert "Evidence check failed" in response.data["error"]

    def test_validate_does_not_leak_response_from_inaccessible_org(self, monkeypatch):
        self.client.force_authenticate(user=self.user)
        called = False

        def fake_validate_response(**kwargs):
            nonlocal called
            called = True

        monkeypatch.setattr(
            "assessments.services.validation.validate_response",
            fake_validate_response,
        )

        response = self.client.post(
            f"/api/responses/{self.response2.id}/validate/",
            {},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org1.id),
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert called is False


@pytest.mark.django_db
class TestFlatAssessmentWorkflowActionRoles:
    def setup_method(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="Workflow Org", slug="workflow-org")
        self.assessor = User.objects.create_user(
            email="workflow-assessor@example.com",
            password="testpass123",
            name="Workflow Assessor",
        )
        self.operator = User.objects.create_user(
            email="workflow-operator@example.com",
            password="testpass123",
            name="Workflow Operator",
        )
        self.other_assessor = User.objects.create_user(
            email="other-assessor@example.com",
            password="testpass123",
            name="Other Assessor",
        )
        OrganizationMembership.objects.create(
            user=self.assessor,
            organization=self.org,
            fallback_role=UserRole.ASSESSOR,
        )
        OrganizationMembership.objects.create(
            user=self.operator,
            organization=self.org,
            fallback_role=UserRole.OPERATOR,
        )
        OrganizationMembership.objects.create(
            user=self.other_assessor,
            organization=self.org,
            fallback_role=UserRole.ASSESSOR,
        )
        bettercoal_framework = Framework.objects.create(
            name="Bettercoal Assurance Framework",
            slug="bettercoal",
            version="2024",
        )
        self.assessment = Assessment.objects.create(
            organization=self.org,
            framework=bettercoal_framework,
            assigned_assessor=self.assessor,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.operator,
        )
        self.workflow = ensure_assessment_workflow(self.assessment)
        self.question = AssessmentQuestion.objects.create(
            assessment=self.assessment,
            organization=self.org,
            text="Does the supplier have a management system?",
            order=1,
            is_required=True,
        )
        self.response = AssessmentResponse.objects.create(
            assessment=self.assessment,
            organization=self.org,
            question=self.question,
            created_by=self.operator,
            answer_text="",
        )

    def complete_prerequisites_for(self, action_code, visited=None):
        visited = visited or set()
        action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code=action_code,
        )
        for prerequisite_code in action.action.prerequisite_codes or []:
            if prerequisite_code in visited:
                continue
            visited.add(prerequisite_code)
            self.complete_prerequisites_for(prerequisite_code, visited)
            prerequisite = AssessmentActionInstance.objects.get(
                workflow=self.workflow,
                action__code=prerequisite_code,
            )
            prerequisite.status = AssessmentActionInstance.Status.COMPLETED
            prerequisite.completed_by = self.operator
            prerequisite.save(update_fields=["status", "completed_by", "updated_at"])

    def make_action_available(self, action_code):
        self.complete_prerequisites_for(action_code)
        refresh_workflow_state(self.workflow)
        action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code=action_code,
        )
        return action

    def test_assessor_can_only_complete_assessor_steps(self):
        assessor_action = self.make_action_available("site_scope_submitted")

        self.client.force_authenticate(user=self.assessor)
        allowed_response = self.client.post(
            f"/api/assessment-actions/{assessor_action.id}/complete/",
            {},
            format="json",
        )
        supplier_action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code="supplier_questionnaire_submitted",
        )
        denied_response = self.client.post(
            f"/api/assessment-actions/{supplier_action.id}/complete/",
            {},
            format="json",
        )

        assert allowed_response.status_code == status.HTTP_200_OK
        assert denied_response.status_code == status.HTTP_403_FORBIDDEN

    def test_unassigned_assessor_cannot_complete_lead_assessor_step(self):
        assessor_action = self.make_action_available("site_scope_submitted")

        self.client.force_authenticate(user=self.other_assessor)
        response = self.client.post(
            f"/api/assessment-actions/{assessor_action.id}/complete/",
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_workflow_serializer_marks_only_current_user_actions_completable(self):
        assessor_action = self.make_action_available("site_scope_submitted")
        supplier_action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code="supplier_questionnaire_submitted",
        )

        self.client.force_authenticate(user=self.assessor)
        response = self.client.get(
            f"/api/assessment-workflows/?assessment={self.assessment.id}&org={self.org.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        workflow = response.json()["results"][0]
        actions = {
            action["id"]: action
            for step in workflow["steps"]
            for action in step["actions"]
        }
        assert actions[str(assessor_action.id)]["can_complete"] is True
        assert actions[str(supplier_action.id)]["can_complete"] is False

    def test_platform_superuser_can_complete_available_supplier_questionnaire_step(
        self,
    ):
        """Platform admins can unblock QA/demo workflows without tenant membership."""
        supplier_action = self.make_action_available("supplier_questionnaire_submitted")
        superuser = User.objects.create_superuser(
            email="workflow-superuser@example.com",
            password="testpass123",
            name="Workflow Superuser",
        )

        self.client.force_authenticate(user=superuser)
        response = self.client.post(
            f"/api/assessment-actions/{supplier_action.id}/complete/",
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        supplier_action.refresh_from_db()
        assert supplier_action.status == AssessmentActionInstance.Status.COMPLETED

    def test_platform_superuser_can_force_submit_blocked_questionnaire_step(self):
        """Questionnaire submit can complete blocked questionnaire action for platform QA."""
        supplier_action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code="supplier_questionnaire_submitted",
        )
        assert supplier_action.status == AssessmentActionInstance.Status.BLOCKED
        superuser = User.objects.create_superuser(
            email="workflow-force-superuser@example.com",
            password="testpass123",
            name="Workflow Force Superuser",
        )

        self.client.force_authenticate(user=superuser)
        response = self.client.post(
            f"/api/assessment-actions/{supplier_action.id}/complete/",
            {"force": True},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        supplier_action.refresh_from_db()
        assert supplier_action.status == AssessmentActionInstance.Status.COMPLETED
        for prerequisite_code in supplier_action.action.prerequisite_codes:
            prerequisite = AssessmentActionInstance.objects.get(
                workflow=self.workflow,
                action__code=prerequisite_code,
            )
            assert prerequisite.status == AssessmentActionInstance.Status.COMPLETED

    def test_blocked_questionnaire_submit_does_not_auto_force_for_operator(self):
        self.response.answer_text = "Yes, documented."
        self.response.save(update_fields=["answer_text", "updated_at"])
        supplier_action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code="supplier_questionnaire_submitted",
        )
        assert supplier_action.status == AssessmentActionInstance.Status.BLOCKED

        self.client.force_authenticate(user=self.operator)
        response = self.client.post(
            f"/api/assessments/{self.assessment.id}/submit-questionnaire/",
            {"force": False},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "blocked" in response.json()["error"].lower()
        supplier_action.refresh_from_db()
        assert supplier_action.status == AssessmentActionInstance.Status.BLOCKED

    def test_platform_superuser_cannot_force_submit_questionnaire_with_missing_answers(
        self,
    ):
        superuser = User.objects.create_superuser(
            email="workflow-force-missing@example.com",
            password="testpass123",
            name="Workflow Force Missing",
        )
        self.client.force_authenticate(user=superuser)

        response = self.client.post(
            f"/api/assessments/{self.assessment.id}/submit-questionnaire/",
            {"force": True},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["readiness"]["missing_required_count"] == 1

    def test_platform_superuser_can_force_submit_questionnaire_after_required_answers(
        self,
    ):
        self.response.answer_text = "Yes, documented."
        self.response.save(update_fields=["answer_text", "updated_at"])
        superuser = User.objects.create_superuser(
            email="workflow-force-submit@example.com",
            password="testpass123",
            name="Workflow Force Submit",
        )
        self.client.force_authenticate(user=superuser)

        response = self.client.post(
            f"/api/assessments/{self.assessment.id}/submit-questionnaire/",
            {"force": True},
            format="json",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        supplier_action = AssessmentActionInstance.objects.get(
            workflow=self.workflow,
            action__code="supplier_questionnaire_submitted",
        )
        assert supplier_action.status == AssessmentActionInstance.Status.COMPLETED
        assert response.json()["readiness"]["status"] == "SUBMITTED"

    def test_questionnaire_readiness_returns_blocking_prerequisite_titles(self):
        self.response.answer_text = "Yes, documented."
        self.response.save(update_fields=["answer_text", "updated_at"])
        self.client.force_authenticate(user=self.operator)

        response = self.client.get(
            f"/api/assessments/{self.assessment.id}/questionnaire-readiness/",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "BLOCKED"
        assert data["can_submit"] is False
        assert (
            data["blocking_prerequisites"][0]["title"]
            == "Site assessment scope submitted"
        )

    def test_questionnaire_readiness_counts_operator_answer_as_answered(self):
        """Typed questionnaire saves can use operator_answer while legacy paths use answer_text."""
        self.response.operator_answer = "Meets"
        self.response.save(update_fields=["operator_answer", "updated_at"])
        self.client.force_authenticate(user=self.operator)

        response = self.client.get(
            f"/api/assessments/{self.assessment.id}/questionnaire-readiness/",
            HTTP_X_ORGANIZATION_ID=str(self.org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["required_answered"] == 1
        assert data["missing_required_count"] == 0


@pytest.mark.django_db
class TestFrameworkSpecificAssessmentWorkflows:
    def setup_method(self):
        self.org = Organization.objects.create(
            name="Framework Workflow Org", slug="framework-workflow-org"
        )
        self.user = User.objects.create_user(
            email="framework-workflow@example.com",
            password="testpass123",
            name="Framework Workflow User",
        )
        OrganizationMembership.objects.create(
            user=self.user,
            organization=self.org,
            fallback_role=UserRole.OPERATOR,
        )

    def test_eo100_assessment_uses_eo100_workflow_not_bettercoal(self):
        framework = Framework.objects.create(
            name="EO100 Standard",
            slug="eo100-standard",
            version="2024",
        )
        assessment = Assessment.objects.create(
            organization=self.org,
            framework=framework,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )

        workflow = ensure_assessment_workflow(assessment)
        step_titles = list(
            workflow.template.steps.order_by("order").values_list("title", flat=True)
        )
        action_codes = set(
            AssessmentActionInstance.objects.filter(workflow=workflow).values_list(
                "action__code", flat=True
            )
        )

        assert workflow.template.slug == "eo100-certification"
        assert workflow.template.framework_slug == "eo100"
        assert "Due Diligence" in step_titles
        assert "Peer Review" in step_titles
        assert "Producer Commitment" not in step_titles
        assert "letter_of_commitment_uploaded" not in action_codes
        assert "self_assessment_submitted" in action_codes

    def test_cgwg_assessment_uses_questionnaire_workflow(self):
        framework = Framework.objects.create(
            name="CGWG Supplier Assessment Questionnaire",
            slug="cgwg-saq",
            version="2024",
        )
        assessment = Assessment.objects.create(
            organization=self.org,
            framework=framework,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )

        workflow = ensure_assessment_workflow(assessment)
        step_titles = list(
            workflow.template.steps.order_by("order").values_list("title", flat=True)
        )

        assert workflow.template.slug == "cgwg-saq"
        assert workflow.template.framework_slug == "cgwg"
        assert step_titles == [
            "Supplier Intake",
            "Self-assessment",
            "Review",
            "Closeout",
        ]

    def test_unknown_framework_uses_generic_workflow(self):
        framework = Framework.objects.create(
            name="Custom Responsible Sourcing Standard",
            slug="custom-responsible-sourcing",
            version="1.0",
        )
        assessment = Assessment.objects.create(
            organization=self.org,
            framework=framework,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )

        workflow = ensure_assessment_workflow(assessment)
        step_titles = list(
            workflow.template.steps.order_by("order").values_list("title", flat=True)
        )

        assert workflow.template.slug == "generic-assessment"
        assert workflow.template.framework_slug == ""
        assert step_titles == ["Setup", "Questionnaire", "Review", "Reporting"]

    def test_empty_wrong_workflow_is_replaced_when_framework_changes(self):
        bettercoal_template = WorkflowTemplate.objects.create(
            name="Bettercoal Assurance Workflow",
            slug="bettercoal-assurance",
            framework_slug="bettercoal",
        )
        framework = Framework.objects.create(
            name="EO100 Standard",
            slug="eo100-standard",
            version="2024",
        )
        assessment = Assessment.objects.create(
            organization=self.org,
            framework=framework,
            start_date="2024-01-01T00:00:00Z",
            due_date="2024-12-31T23:59:59Z",
            created_by=self.user,
        )
        wrong_workflow = AssessmentWorkflowInstance.objects.create(
            assessment=assessment,
            organization=self.org,
            template=bettercoal_template,
            current_step_code="producer_commitment",
        )

        workflow = ensure_assessment_workflow(assessment)

        assert workflow.id == wrong_workflow.id
        assert workflow.template.slug == "eo100-certification"
        assert workflow.current_step_code == "due_diligence"
