from datetime import timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from assessments.models import Assessment
from knowledge.models import KnowledgeDocument
from knowledge.services import EmbeddingResult


@pytest.fixture
def org_client(api_factory, user_with_org):
    user, org, _membership = user_with_org("ADMIN")
    refresh = RefreshToken.for_user(user)
    api_factory.credentials(
        HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        HTTP_X_ORGANIZATION_ID=str(org.id),
    )
    return api_factory, org, user


@pytest.mark.django_db
def test_upload_questionnaire_evidence_processes_document_and_returns_processed_status(
    settings, monkeypatch, org_client
):
    client, org, user = org_client
    assessment = Assessment.objects.create(
        organization=org,
        start_date=timezone.now(),
        due_date=timezone.now() + timedelta(days=30),
        created_by=user,
    )
    captured = {}

    def fake_process_document(**kwargs):
        captured.update(kwargs)
        return EmbeddingResult(
            vector_ids=["vector-1", "vector-2"], chunk_count=2, success=True
        )

    settings.PINECONE_INDEX_NAME = "veris-test"
    monkeypatch.setattr(
        "assessments.views.upload_evidence.process_document", fake_process_document
    )

    upload = SimpleUploadedFile(
        "policy.txt",
        b"Suppliers maintain a documented health and safety policy.",
        content_type="text/plain",
    )
    response = client.post(
        "/api/upload-evidence/",
        {
            "file": upload,
            "assessment_id": str(assessment.id),
            "response_id": "response-123",
            "question_id": "question-456",
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data["processing_status"] == "processed"
    assert response.data["error"] is None
    assert response.data["knowledge_document_id"]

    document = KnowledgeDocument.objects.get(id=response.data["knowledge_document_id"])
    assert document.organization == org
    assert document.embeddings_indexed is True
    assert document.chunk_count == 2
    assert document.vector_ids == ["vector-1", "vector-2"]

    assert captured["document_id"] == str(document.id)
    assert captured["organization_id"] == str(org.id)
    assert captured["assessment_id"] == str(assessment.id)
    assert captured["response_id"] == "response-123"
    assert captured["question_id"] == "question-456"
    assert captured["source_type"] == "assessment_evidence"
    assert captured["index_name"] == "veris-test"


@pytest.mark.django_db
def test_upload_questionnaire_evidence_returns_failed_status_when_indexing_fails(
    monkeypatch, org_client
):
    client, org, user = org_client
    assessment = Assessment.objects.create(
        organization=org,
        start_date=timezone.now(),
        due_date=timezone.now() + timedelta(days=30),
        created_by=user,
    )

    def fake_process_document(**kwargs):
        return EmbeddingResult(
            vector_ids=[],
            chunk_count=0,
            success=False,
            error="No text content extracted from document",
        )

    monkeypatch.setattr(
        "assessments.views.upload_evidence.process_document", fake_process_document
    )

    upload = SimpleUploadedFile(
        "empty.txt",
        b"",
        content_type="text/plain",
    )
    response = client.post(
        "/api/upload-evidence/",
        {
            "file": upload,
            "assessment_id": str(assessment.id),
            "response_id": "response-123",
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data["processing_status"] == "failed"
    assert response.data["error"] == "No text content extracted from document"

    document = KnowledgeDocument.objects.get(id=response.data["knowledge_document_id"])
    assert document.organization == org
    assert document.embeddings_indexed is False
    assert document.chunk_count == 0
    assert "Processing failed" in document.description
