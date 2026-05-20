from pinecone import PineconeApiException

from assessments.services.validation import query_similar_evidence
from knowledge.services import (
    ChunkResult,
    embed_and_store,
    get_embedding_dimension,
    get_embedding_model,
)


def test_query_similar_evidence_treats_missing_pinecone_index_as_no_matches(
    monkeypatch,
):
    def missing_index():
        raise PineconeApiException(
            status=404, reason="Resource sustainability-ai not found"
        )

    monkeypatch.setattr(
        "assessments.services.validation.get_pinecone_index", missing_index
    )

    assert query_similar_evidence([0.1, 0.2, 0.3], "org-1") == []


def test_huggingface_embedding_provider_uses_endpoint_not_local_sentence_transformers(
    settings,
):
    settings.EMBEDDING_MODEL_PROVIDER = "huggingface"
    settings.EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    settings.HUGGINGFACE_API_KEY = "hf_test_token"

    model = get_embedding_model()

    assert model.__class__.__name__ == "HuggingFaceEndpointEmbeddings"


def test_embedding_dimension_matches_configured_huggingface_model(settings):
    settings.EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    settings.EMBEDDING_DIMENSION = 0

    assert get_embedding_dimension() == 384


def test_embedding_dimension_matches_configured_openai_model(settings):
    settings.EMBEDDING_MODEL_NAME = "text-embedding-3-small"
    settings.EMBEDDING_DIMENSION = 0

    assert get_embedding_dimension() == 1536


def test_embedding_dimension_allows_explicit_override(settings):
    settings.EMBEDDING_MODEL_NAME = "custom-provider/custom-model"
    settings.EMBEDDING_DIMENSION = 768

    assert get_embedding_dimension() == 768


def test_embed_and_store_creates_index_with_configured_embedding_dimension(
    settings, monkeypatch
):
    created_indexes = []
    upserted_vectors = []

    class FakeIndexList:
        def names(self):
            return []

    class FakeIndex:
        def upsert(self, vectors):
            upserted_vectors.extend(vectors)

    class FakePinecone:
        def list_indexes(self):
            return FakeIndexList()

        def create_index(self, **kwargs):
            created_indexes.append(kwargs)

        def Index(self, index_name):
            return FakeIndex()

    class FakeEmbeddings:
        def embed_query(self, text):
            return [0.1, 0.2, 0.3]

    settings.EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
    settings.EMBEDDING_DIMENSION = 0
    settings.PINECONE_CLOUD = "aws"
    settings.PINECONE_REGION = "us-east-1"

    monkeypatch.setattr(
        "knowledge.services.get_pinecone_client", lambda: FakePinecone()
    )
    monkeypatch.setattr(
        "knowledge.services.get_embedding_model", lambda: FakeEmbeddings()
    )

    result = embed_and_store(
        chunks=[ChunkResult(text="evidence text", chunk_index=0, vector_id="chunk_0")],
        index_name="veris",
        document_id="doc-1",
        organization_id="org-1",
    )

    assert result.success is True
    assert created_indexes[0]["name"] == "veris"
    assert created_indexes[0]["dimension"] == 384
    assert created_indexes[0]["metric"] == "cosine"
    assert upserted_vectors[0]["values"] == [0.1, 0.2, 0.3]
