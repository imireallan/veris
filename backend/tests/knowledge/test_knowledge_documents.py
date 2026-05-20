import pytest
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

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
    return api_factory, org


@pytest.mark.django_db
def test_create_document_uses_request_org_and_accepts_relative_file_url(org_client):
    client, org = org_client

    response = client.post(
        "/api/documents/",
        {
            "title": "Safety policy",
            "description": "Uploaded from the knowledge library",
            "file_url": "/media/evidence/safety-policy.txt",
            "file_type": "TXT",
            "file_size": 128,
            "category": "Policy",
            "framework_tags": [],
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    document = KnowledgeDocument.objects.get(id=response.data["id"])
    assert document.organization == org
    assert document.file_url == "/media/evidence/safety-policy.txt"
    assert document.embeddings_indexed is False


@pytest.mark.django_db
def test_process_document_indexes_relative_local_file_path(settings, monkeypatch, org_client):
    client, org = org_client
    document = KnowledgeDocument._default_manager.create(
        organization=org,
        title="Safety policy",
        file_url="/media/evidence/safety-policy.txt",
        file_type="TXT",
        file_size=128,
        category="Policy",
        framework_tags=["bettercoal"],
    )
    captured = {}

    def fake_process_document(**kwargs):
        captured.update(kwargs)
        return EmbeddingResult(vector_ids=["vector-1"], chunk_count=1, success=True)

    monkeypatch.setattr("knowledge.views.process_document", fake_process_document)

    response = client.post(f"/api/documents/{document.id}/process/")

    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data == {
        "status": "processed",
        "chunk_count": 1,
        "vector_count": 1,
    }
    document.refresh_from_db()
    assert document.embeddings_indexed is True
    assert document.chunk_count == 1
    assert document.vector_ids == ["vector-1"]
    assert captured["file_path"] == f"{settings.BASE_DIR}/media/evidence/safety-policy.txt"
    assert captured["file_type"] == "TXT"
    assert captured["document_id"] == str(document.id)
    assert captured["organization_id"] == str(org.id)
    assert captured["framework_tags"] == ["bettercoal"]


@pytest.mark.django_db
def test_chat_requires_indexed_documents(org_client):
    client, _org = org_client

    response = client.post(
        "/api/documents/chat/",
        {"query": "What does the policy say?"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data["sources"] == []
    assert "No indexed knowledge documents" in response.data["answer"]


@pytest.mark.django_db
def test_chat_returns_matching_sources(monkeypatch, org_client):
    client, org = org_client
    document = KnowledgeDocument._default_manager.create(
        organization=org,
        title="Bettercoal Code",
        file_url="/media/evidence/code.pdf",
        file_type="PDF",
        file_size=128,
        category="Policy",
        embeddings_indexed=True,
        chunk_count=1,
        vector_ids=["vector-1"],
    )

    monkeypatch.setattr("knowledge.views.embed_text", lambda query: [0.1, 0.2])
    monkeypatch.setattr(
        "knowledge.views.query_similar_evidence",
        lambda **kwargs: [
            {
                "id": "vector-1",
                "score": 0.82,
                "document_id": str(document.id),
                "chunk_index": 3,
                "text_preview": "Suppliers must maintain documented management systems.",
            }
        ],
    )

    response = client.post(
        "/api/documents/chat/",
        {"query": "What does Bettercoal require?"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    assert response.data["confidence"] == 0.82
    assert response.data["sources"][0]["title"] == "Bettercoal Code"
    assert "Suppliers must maintain" in response.data["answer"]
