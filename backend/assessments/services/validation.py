"""
AI Validation Pipeline: Validate assessment responses against evidence documents.

Flow:
1. Embed response text
2. Query Pinecone for similar evidence chunks
3. Calculate confidence score based on similarity
4. Extract citations (referenced documents)
5. Determine validation status
"""

from dataclasses import dataclass
from typing import List

from django.conf import settings
from pinecone import Pinecone

from knowledge.services import get_embedding_model


@dataclass
class ValidationResult:
    """Result of AI validation."""

    validation_status: str
    confidence_score: float
    citations: List[str]  # Document IDs
    similar_chunks: List[dict]  # Top matching chunks
    feedback: str


def get_pinecone_index():
    """Initialize Pinecone client and index."""
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_INDEX_NAME
    return pc.Index(index_name)


def embed_text(text: str) -> List[float]:
    """Embed text using configured embedding model."""
    embeddings = get_embedding_model()
    return embeddings.embed_query(text)


def query_similar_evidence(
    embedding: List[float],
    organization_id: str,
    top_k: int = 5,
    threshold: float = 0.7,
) -> List[dict]:
    """
    Query Pinecone for similar evidence chunks.

    Args:
        embedding: Response text embedding
        organization_id: Filter to organization's documents
        top_k: Number of results to return
        threshold: Minimum similarity score

    Returns:
        List of matching chunks with metadata
    """
    index = get_pinecone_index()

    # Query with organization filter
    response = index.query(
        vector=embedding,
        top_k=top_k,
        filter={"organization_id": organization_id},
        include_metadata=True,
        include_values=False,
    )

    # Filter by threshold
    matches = []
    for match in response.get("matches", []):
        score = match.get("score", 0)
        if score >= threshold:
            matches.append(
                {
                    "id": match["id"],
                    "score": score,
                    "document_id": match["metadata"].get("document_id"),
                    "chunk_index": match["metadata"].get("chunk_index"),
                    "text_preview": match["metadata"].get("text", "")[:200],
                }
            )

    return matches


def extract_citations(matches: List[dict]) -> List[str]:
    """Extract unique document IDs from matches."""
    doc_ids = set()
    for match in matches:
        if match.get("document_id"):
            doc_ids.add(match["document_id"])
    return list(doc_ids)


def calculate_confidence(matches: List[dict]) -> float:
    """
    Calculate confidence score based on match quality.

    Formula:
    - No matches: 0.1
    - 1 match: avg_score * 0.7
    - 2+ matches: avg_score * (0.7 + 0.1 * min(count, 3))
    - Cap at 0.95
    """
    if not matches:
        return 0.1

    scores = [m["score"] for m in matches]
    avg_score = sum(scores) / len(scores)

    # Boost for multiple corroborating sources
    count_boost = min(len(matches) * 0.1, 0.3)
    confidence = min(avg_score * (0.7 + count_boost), 0.95)

    return round(confidence, 3)


def determine_status(confidence: float, matches: List[dict]) -> str:
    """
    Determine validation status based on confidence and matches.

    Status logic:
    - confidence >= 0.8: "validated"
    - confidence >= 0.5: "flagged" (needs review)
    - confidence < 0.5: "insufficient_evidence"
    """
    if confidence >= 0.8:
        return "validated"
    elif confidence >= 0.5:
        return "flagged"
    else:
        return "insufficient_evidence"


def generate_feedback(
    status: str,
    confidence: float,
    matches: List[dict],
    response_text: str,
) -> str:
    """Generate human-readable feedback for the response."""
    if status == "validated":
        return (
            f"Response validated with {confidence:.0%} confidence. "
            f"Found {len(matches)} supporting evidence chunk(s) in uploaded documents."
        )
    elif status == "flagged":
        return (
            f"Response flagged for review ({confidence:.0%} confidence). "
            f"Found {len(matches)} partial match(es). Consider adding more specific evidence."
        )
    else:
        return (
            f"Insufficient evidence found ({confidence:.0%} confidence). "
            f"No matching documents found. Please upload supporting evidence or revise response."
        )


def validate_response(
    response_text: str,
    organization_id: str,
    existing_evidence_ids: List[str] | None = None,
) -> ValidationResult:
    """
    Main validation pipeline.

    Args:
        response_text: The assessment response text to validate
        organization_id: Organization scope for evidence search
        existing_evidence_ids: Optional list of evidence document IDs already attached

    Returns:
        ValidationResult with status, confidence, citations, and feedback
    """
    # Step 1: Embed response text
    embedding = embed_text(response_text)

    # Step 2: Query for similar evidence
    matches = query_similar_evidence(
        embedding=embedding,
        organization_id=organization_id,
        top_k=5,
        threshold=0.5,  # Lower threshold to catch partial matches
    )

    # Step 3: Extract citations
    citations = extract_citations(matches)

    # Step 4: Calculate confidence
    confidence = calculate_confidence(matches)

    # Step 5: Determine status
    status = determine_status(confidence, matches)

    # Step 6: Generate feedback
    feedback = generate_feedback(status, confidence, matches, response_text)

    return ValidationResult(
        validation_status=status,
        confidence_score=confidence,
        citations=citations,
        similar_chunks=matches,
        feedback=feedback,
    )
