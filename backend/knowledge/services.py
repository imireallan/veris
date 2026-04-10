"""
Evidence Pipeline: Upload → Chunk → Embed → Store in Pinecone

Note: This is a temporary MVP implementation in Django.
Planned migration to ai_engine service when scale requires it.
See docs/ai-architecture-decision.md for details.

File Storage:
- Uses Django's default_storage (local in dev, S3 in production)
- For S3 files, downloads to temp file before processing
"""

import os
import tempfile
from dataclasses import dataclass
from typing import List

import requests
from django.conf import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone, ServerlessSpec
from pypdf import PdfReader


@dataclass
class ChunkResult:
    text: str
    chunk_index: int
    vector_id: str


@dataclass
class EmbeddingResult:
    vector_ids: List[str]
    chunk_count: int
    success: bool
    error: str | None = None


def get_pinecone_client() -> Pinecone:
    """Initialize Pinecone client from Django settings."""
    api_key = settings.PINECONE_API_KEY
    if not api_key:
        raise ValueError("PINECONE_API_KEY not configured in settings")
    return Pinecone(api_key=api_key)


def get_embedding_model():
    """
    Initialize embeddings model based on settings.

    Supports:
    - OpenAI (paid, fast, reliable): text-embedding-3-small
    - HuggingFace (free, rate-limited): sentence-transformers/all-MiniLM-L6-v2
    """
    provider = settings.EMBEDDING_MODEL_PROVIDER.lower()

    if provider == "huggingface":
        model_name = settings.EMBEDDING_MODEL_NAME
        api_key = settings.HUGGINGFACE_API_KEY

        # HuggingFace Inference API (serverless)
        if api_key:
            return HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={"token": api_key},
            )
        else:
            # Local model (requires transformers + torch, slower on CPU)
            return HuggingFaceEmbeddings(model_name=model_name)

    elif provider == "openai":
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            raise ValueError("OPENAI_API_KEY not configured in settings")
        return OpenAIEmbeddings(model="text-embedding-3-small", api_key=api_key)

    else:
        raise ValueError(
            f"Unknown EMBEDDING_MODEL_PROVIDER: {provider}. "
            "Must be 'openai' or 'huggingface'"
        )


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from PDF file."""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n\n"
    return text


def extract_text_from_file(file_path: str, file_type: str) -> str:
    """
    Extract text from file based on type.

    Handles both local paths and S3 URLs:
    - Local: reads directly from filesystem
    - S3/HTTP: downloads to temp file first
    """
    # Check if file_path is a URL (S3 or external)
    if file_path.startswith("http://") or file_path.startswith("https://"):
        # Download file to temp location
        response = requests.get(file_path, timeout=30)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f".{file_type.lower()}"
        ) as tmp_file:
            tmp_file.write(response.content)
            tmp_path = tmp_file.name

        try:
            if file_type.upper() == "PDF":
                text = extract_text_from_pdf(tmp_path)
            else:
                with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
        finally:
            # Clean up temp file
            os.unlink(tmp_path)

        return text
    else:
        # Local file path
        if file_type.upper() == "PDF":
            return extract_text_from_pdf(file_path)
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()


def chunk_document(
    text: str, chunk_size: int = 1000, chunk_overlap: int = 200
) -> List[ChunkResult]:
    """Split document into overlapping chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)

    results = []
    for i, chunk in enumerate(chunks):
        results.append(
            ChunkResult(
                text=chunk,
                chunk_index=i,
                vector_id=f"chunk_{i}",  # Will be replaced with UUID in service
            )
        )
    return results


def embed_and_store(
    chunks: List[ChunkResult],
    index_name: str,
    document_id: str,
    organization_id: str,
    metadata_extra: dict | None = None,
) -> EmbeddingResult:
    """Embed chunks and store in Pinecone."""
    try:
        pc = get_pinecone_client()
        embeddings = get_embedding_model()

        # Create or connect to index
        existing_indexes = pc.list_indexes().names()
        if index_name not in existing_indexes:
            pc.create_index(
                name=index_name,
                dimension=1536,  # text-embedding-3-small dimension
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

        index = pc.Index(index_name)

        # Prepare vectors for upsert
        vectors_to_upsert = []
        vector_ids = []

        for chunk in chunks:
            # Generate embedding
            embedding = embeddings.embed_query(chunk.text)

            # Create unique vector ID
            vector_id = f"{document_id}_chunk_{chunk.chunk_index}"
            vector_ids.append(vector_id)

            # Build metadata
            metadata = {
                "document_id": document_id,
                "organization_id": str(organization_id),
                "chunk_index": chunk.chunk_index,
                "text": chunk.text[:500],  # Store preview
            }
            if metadata_extra:
                metadata.update(metadata_extra)

            vectors_to_upsert.append(
                {
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata,
                }
            )

        # Upsert in batches (Pinecone limit: 100 per batch)
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i : i + batch_size]
            index.upsert(vectors=batch)

        return EmbeddingResult(
            vector_ids=vector_ids,
            chunk_count=len(chunks),
            success=True,
        )

    except Exception as e:
        return EmbeddingResult(
            vector_ids=[],
            chunk_count=0,
            success=False,
            error=str(e),
        )


def delete_from_pinecone(vector_ids: List[str], index_name: str):
    """Delete vectors from Pinecone by ID."""
    try:
        pc = get_pinecone_client()
        index = pc.Index(index_name)
        index.delete(ids=vector_ids)
    except Exception:
        # Silently fail - cleanup is best-effort
        pass


def process_document(
    file_path: str,
    file_type: str,
    document_id: str,
    organization_id: str,
    index_name: str = "sustainability-ai",
    framework_tags: List[str] | None = None,
) -> EmbeddingResult:
    """
    Full pipeline: Extract → Chunk → Embed → Store

    Returns EmbeddingResult with vector_ids and chunk_count on success,
    or error message on failure.
    """
    try:
        # Step 1: Extract text
        text = extract_text_from_file(file_path, file_type)
        if not text.strip():
            return EmbeddingResult(
                vector_ids=[],
                chunk_count=0,
                success=False,
                error="No text content extracted from document",
            )

        # Step 2: Chunk document
        chunks = chunk_document(text)
        if not chunks:
            return EmbeddingResult(
                vector_ids=[],
                chunk_count=0,
                success=False,
                error="Failed to create chunks from document",
            )

        # Step 3: Embed and store
        metadata_extra = {"framework_tags": framework_tags or []}
        result = embed_and_store(
            chunks=chunks,
            index_name=index_name,
            document_id=document_id,
            organization_id=organization_id,
            metadata_extra=metadata_extra,
        )

        return result

    except Exception as e:
        return EmbeddingResult(
            vector_ids=[],
            chunk_count=0,
            success=False,
            error=f"Pipeline failed: {str(e)}",
        )
