import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from assessments.models import Assessment, AssessmentResponse, Finding, Task
from knowledge.models import KnowledgeDocument


@pytest.mark.django_db
class TestDashboardSummaryApi:
    def setup_method(self):
        self.client = APIClient()

    def test_returns_p0_dashboard_summary_for_selected_organization(
        self, make_user, make_org, make_membership
    ):
        user = make_user(email="dashboard@test.com")
        org = make_org(name="Alpha Org", slug="alpha-org")
        other_org = make_org(name="Beta Org", slug="beta-org")

        make_membership(user=user, organization=org, fallback_role="ADMIN")
        make_membership(user=user, organization=other_org, fallback_role="ASSESSOR")

        now = timezone.now()

        active_assessment = Assessment.objects.create(
            organization=org,
            status=Assessment.Status.IN_PROGRESS,
            start_date=now - timezone.timedelta(days=10),
            due_date=now + timezone.timedelta(days=5),
            created_by=user,
            assigned_to=user,
        )
        draft_assessment = Assessment.objects.create(
            organization=org,
            status=Assessment.Status.DRAFT,
            start_date=now - timezone.timedelta(days=2),
            due_date=now + timezone.timedelta(days=12),
            created_by=user,
        )
        Assessment.objects.create(
            organization=org,
            status=Assessment.Status.COMPLETED,
            start_date=now - timezone.timedelta(days=20),
            due_date=now - timezone.timedelta(days=1),
            created_by=user,
        )
        Assessment.objects.create(
            organization=other_org,
            status=Assessment.Status.IN_PROGRESS,
            start_date=now - timezone.timedelta(days=3),
            due_date=now + timezone.timedelta(days=3),
            created_by=user,
        )

        overdue_task = Task.objects.create(
            organization=org,
            assessment=active_assessment,
            title="Upload missing worker contracts",
            status=Task.Status.PENDING,
            priority=Task.Priority.HIGH,
            assigned_to=user,
            due_date=now - timezone.timedelta(days=1),
        )
        Task.objects.create(
            organization=org,
            assessment=draft_assessment,
            title="Prepare site visit agenda",
            status=Task.Status.IN_PROGRESS,
            priority=Task.Priority.MEDIUM,
            due_date=now + timezone.timedelta(days=2),
        )
        Task.objects.create(
            organization=org,
            assessment=active_assessment,
            title="Completed task should not count",
            status=Task.Status.COMPLETED,
            priority=Task.Priority.MEDIUM,
            due_date=now - timezone.timedelta(days=2),
        )
        Task.objects.create(
            organization=other_org,
            assessment=Assessment.objects.filter(organization=other_org).first(),
            title="Other org task",
            status=Task.Status.PENDING,
            priority=Task.Priority.CRITICAL,
            due_date=now - timezone.timedelta(days=5),
        )

        Finding.objects.create(
            organization=org,
            assessment=active_assessment,
            topic="Missing incident register",
            severity=Finding.Severity.HIGH,
            status=Finding.Status.OPEN,
        )
        Finding.objects.create(
            organization=org,
            assessment=active_assessment,
            topic="Resolved finding",
            severity=Finding.Severity.MEDIUM,
            status=Finding.Status.RESOLVED,
        )
        Finding.objects.create(
            organization=other_org,
            assessment=Assessment.objects.filter(organization=other_org).first(),
            topic="Other org finding",
            severity=Finding.Severity.CRITICAL,
            status=Finding.Status.OPEN,
        )

        AssessmentResponse.objects.create(
            organization=org,
            assessment=active_assessment,
            answer_text="Waiting for reviewer validation",
            evidence_files=[{"name": "evidence.pdf"}],
            validation_status="pending",
            created_by=user,
        )
        AssessmentResponse.objects.create(
            organization=org,
            assessment=active_assessment,
            answer_text="Already validated",
            evidence_files=[{"name": "validated.pdf"}],
            validation_status="validated",
            created_by=user,
        )
        AssessmentResponse.objects.create(
            organization=other_org,
            assessment=Assessment.objects.filter(organization=other_org).first(),
            answer_text="Other org pending review",
            evidence_files=[{"name": "other.pdf"}],
            validation_status="pending",
            created_by=user,
        )

        KnowledgeDocument.objects.create(
            organization=org,
            title="Audit evidence pack",
            description="Uploaded for review",
            file_url="https://example.com/evidence.pdf",
            category="evidence",
            created_by=user,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get(
            "/api/dashboard/summary/",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["kpis"] == {
            "active_assessments": 2,
            "overdue_actions": 1,
            "open_findings": 1,
            "pending_evidence_reviews": 1,
        }

        assert any(
            item["title"] == overdue_task.title for item in data["attention_items"]
        )
        assert all(item["organization_name"] == org.name for item in data["attention_items"])

        deadline_titles = {item["title"] for item in data["upcoming_deadlines"]}
        assert overdue_task.title in deadline_titles
        assert any(item["type"] == "assessment_due" for item in data["upcoming_deadlines"])

        activity_types = {item["type"] for item in data["recent_activity"]}
        assert "document_uploaded" in activity_types
        assert "task_created" in activity_types
        assert "assessment_created" in activity_types

    def test_assessor_dashboard_only_shows_assigned_relevant_work_in_active_org(
        self, make_user, make_org, make_membership
    ):
        assessor = make_user(email="assessor@test.com")
        admin = make_user(email="admin@test.com")
        org = make_org(name="Scoped Org", slug="scoped-org")
        other_org = make_org(name="Other Scoped Org", slug="other-scoped-org")

        make_membership(user=assessor, organization=org, fallback_role="ASSESSOR")
        make_membership(user=assessor, organization=other_org, fallback_role="ASSESSOR")
        make_membership(user=admin, organization=org, fallback_role="ADMIN")

        now = timezone.now()

        assigned_assessment = Assessment.objects.create(
            organization=org,
            status=Assessment.Status.IN_PROGRESS,
            start_date=now - timezone.timedelta(days=5),
            due_date=now + timezone.timedelta(days=3),
            created_by=admin,
            assigned_to=assessor,
        )
        unassigned_assessment = Assessment.objects.create(
            organization=org,
            status=Assessment.Status.IN_PROGRESS,
            start_date=now - timezone.timedelta(days=5),
            due_date=now + timezone.timedelta(days=6),
            created_by=admin,
            assigned_to=admin,
        )
        Assessment.objects.create(
            organization=other_org,
            status=Assessment.Status.IN_PROGRESS,
            start_date=now - timezone.timedelta(days=5),
            due_date=now + timezone.timedelta(days=1),
            created_by=assessor,
            assigned_to=assessor,
        )

        assigned_task = Task.objects.create(
            organization=org,
            assessment=assigned_assessment,
            title="Review assigned evidence",
            status=Task.Status.PENDING,
            priority=Task.Priority.HIGH,
            assigned_to=assessor,
            due_date=now - timezone.timedelta(days=1),
        )
        Task.objects.create(
            organization=org,
            assessment=unassigned_assessment,
            title="Admin-only org action",
            status=Task.Status.PENDING,
            priority=Task.Priority.CRITICAL,
            assigned_to=admin,
            due_date=now - timezone.timedelta(days=2),
        )

        Finding.objects.create(
            organization=org,
            assessment=assigned_assessment,
            topic="Assigned finding",
            severity=Finding.Severity.HIGH,
            status=Finding.Status.OPEN,
        )
        Finding.objects.create(
            organization=org,
            assessment=unassigned_assessment,
            topic="Admin finding",
            severity=Finding.Severity.CRITICAL,
            status=Finding.Status.OPEN,
        )

        AssessmentResponse.objects.create(
            organization=org,
            assessment=assigned_assessment,
            answer_text="Assigned pending evidence",
            evidence_files=[{"name": "assigned.pdf"}],
            validation_status="pending",
            created_by=assessor,
        )
        AssessmentResponse.objects.create(
            organization=org,
            assessment=unassigned_assessment,
            answer_text="Admin pending evidence",
            evidence_files=[{"name": "admin.pdf"}],
            validation_status="pending",
            created_by=admin,
        )

        self.client.force_authenticate(user=assessor)
        response = self.client.get(
            "/api/dashboard/summary/",
            HTTP_X_ORGANIZATION_ID=str(org.id),
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert data["viewer"] == {
            "role": "ASSESSOR",
            "scope": "assigned",
            "organization_id": str(org.id),
            "organization_name": org.name,
        }
        assert data["kpis"] == {
            "active_assessments": 1,
            "overdue_actions": 1,
            "open_findings": 1,
            "pending_evidence_reviews": 1,
        }
        assert [item["title"] for item in data["attention_items"]] == [assigned_task.title]
        assert all(item["organization_name"] == org.name for item in data["attention_items"])
        assert all(item["assessment_id"] == str(assigned_assessment.id) for item in data["attention_items"])

    def test_rejects_dashboard_access_for_unrelated_organization(
        self, make_user, make_org, make_membership
    ):
        user = make_user(email="forbidden@test.com")
        allowed_org = make_org(name="Allowed Org", slug="allowed-org")
        forbidden_org = make_org(name="Forbidden Org", slug="forbidden-org")
        make_membership(user=user, organization=allowed_org, fallback_role="ADMIN")

        self.client.force_authenticate(user=user)
        response = self.client.get(
            "/api/dashboard/summary/",
            HTTP_X_ORGANIZATION_ID=str(forbidden_org.id),
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
