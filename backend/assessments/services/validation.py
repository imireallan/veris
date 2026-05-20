"""
AI evidence-check pipeline for assessment responses.

Veris positions AI as a reviewer aid, not a final compliance authority. This
service checks whether submitted evidence supports a response, returns a typed
reviewer-facing result, and preserves enough retrieval context for audit runs.
"""

from dataclasses import dataclass, field
from typing import Any, List

from django.conf import settings
from pinecone import (
    NotFoundException,
    Pinecone,
    PineconeApiException,
    UnauthorizedException,
)

from knowledge.services import get_embedding_model

EVIDENCE_CHECK_STATUSES = {
    "not_checked",
    "needs_answer",
    "needs_evidence",
    "evidence_processing",
    "supported",
    "partially_supported",
    "unsupported",
    "contradictory",
    "reviewer_override",
}

LEGACY_STATUS_MAP = {
    "pending": "not_checked",
    "validated": "supported",
    "flagged": "partially_supported",
    "insufficient_evidence": "needs_evidence",
}

PROCESSING_EVIDENCE_STATES = {
    "uploaded",  # legacy alias retained for previously uploaded evidence
    "pending",
    "processing",
    "queued",
}


@dataclass
class ValidationResult:
    """Structured result of an AI evidence check."""

    validation_status: str
    confidence_score: float
    citations: List[dict[str, Any]]
    similar_chunks: List[dict[str, Any]]
    feedback: str
    result_json: dict[str, Any] = field(default_factory=dict)
    evidence_snapshot: dict[str, Any] = field(default_factory=dict)
    model_provider: str = ""
    model_name: str = ""
    prompt_version: str = "evidence-check-v1"


def normalize_evidence_status(status: str | None) -> str:
    """Map legacy validation labels to evidence-check labels."""
    if not status:
        return "not_checked"
    return LEGACY_STATUS_MAP.get(status, status)


def get_pinecone_index():
    """Initialize Pinecone client and index."""
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    index_name = settings.PINECONE_INDEX_NAME
    return pc.Index(index_name)


def embed_text(text: str) -> List[float]:
    """Embed text using configured embedding model."""
    embeddings = get_embedding_model()
    return embeddings.embed_query(text)


def _build_filter(
    *,
    organization_id: str,
    document_ids: list[str] | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    pinecone_filter: dict[str, Any] = {"organization_id": str(organization_id)}
    if document_ids:
        pinecone_filter["document_id"] = {
            "$in": [str(doc_id) for doc_id in document_ids]
        }
    if assessment_id:
        pinecone_filter["assessment_id"] = str(assessment_id)
    return pinecone_filter


def query_similar_evidence(
    embedding: List[float],
    organization_id: str,
    top_k: int = 5,
    threshold: float = 0.7,
    document_ids: list[str] | None = None,
    assessment_id: str | None = None,
    source_scope: str = "organization_library",
) -> List[dict[str, Any]]:
    """
    Query Pinecone for similar evidence chunks.

    The caller controls scope. Evidence checks should try response-attached
    document IDs first, then assessment-scoped chunks, then org library fallback.
    """
    try:
        index = get_pinecone_index()
        response = index.query(
            vector=embedding,
            top_k=top_k,
            filter=_build_filter(
                organization_id=organization_id,
                document_ids=document_ids,
                assessment_id=assessment_id,
            ),
            include_metadata=True,
            include_values=False,
        )
    except NotFoundException:
        return []
    except UnauthorizedException:
        raise
    except PineconeApiException as exc:
        if getattr(exc, "status", None) == 404 or "NOT_FOUND" in str(exc):
            return []
        raise

    matches = []
    for match in response.get("matches", []):
        score = match.get("score", 0)
        if score >= threshold:
            metadata = match.get("metadata", {}) or {}
            matches.append(
                {
                    "id": match["id"],
                    "score": score,
                    "source_scope": source_scope,
                    "document_id": metadata.get("document_id"),
                    "file_name": metadata.get("file_name")
                    or metadata.get("title")
                    or "Evidence document",
                    "page": metadata.get("page"),
                    "chunk_index": metadata.get("chunk_index"),
                    "chunk_id": match["id"],
                    "quote": metadata.get("text", "")[:500],
                    "text_preview": metadata.get("text", "")[:200],
                }
            )

    return matches


def extract_citations(matches: List[dict[str, Any]]) -> List[dict[str, Any]]:
    """Extract structured citations from matching chunks."""
    citations = []
    seen = set()
    for match in matches:
        key = (match.get("document_id"), match.get("chunk_id"))
        if not match.get("document_id") or key in seen:
            continue
        seen.add(key)
        citations.append(
            {
                "document_id": match.get("document_id"),
                "file_name": match.get("file_name"),
                "page": match.get("page"),
                "quote": match.get("quote") or match.get("text_preview") or "",
                "chunk_id": match.get("chunk_id") or match.get("id"),
                "source_scope": match.get("source_scope", "organization_library"),
            }
        )
    return citations


def calculate_confidence(matches: List[dict[str, Any]]) -> float:
    """Calculate confidence score based on match quality and corroboration."""
    if not matches:
        return 0.0

    scores = [float(m.get("score", 0)) for m in matches]
    avg_score = sum(scores) / len(scores)
    count_boost = min(len(matches) * 0.08, 0.24)
    scope_boost = 0.08 if matches[0].get("source_scope") == "response_evidence" else 0.0
    confidence = min(avg_score * (0.74 + count_boost) + scope_boost, 0.95)
    return round(confidence, 3)


def determine_status(
    confidence: float, matches: List[dict[str, Any]], has_answer: bool
) -> str:
    """Determine evidence-support status. This is not a compliance decision."""
    if not has_answer:
        return "needs_answer"
    if not matches:
        return "needs_evidence"
    if confidence >= 0.8:
        return "supported"
    if confidence >= 0.45:
        return "partially_supported"
    return "unsupported"


def extract_attached_document_ids(evidence_files: list[Any] | None) -> list[str]:
    """Pull processed knowledge document IDs from response evidence metadata."""
    document_ids: list[str] = []
    for evidence in evidence_files or []:
        if isinstance(evidence, str):
            document_ids.append(evidence)
            continue
        if not isinstance(evidence, dict):
            continue
        document_id = (
            evidence.get("knowledge_document_id")
            or evidence.get("document_id")
            or evidence.get("id")
        )
        if document_id:
            document_ids.append(str(document_id))
    return list(dict.fromkeys(document_ids))


def evidence_snapshot(evidence_files: list[Any] | None) -> dict[str, Any]:
    files = evidence_files or []
    return {
        "attached_count": len(files),
        "attached_document_ids": extract_attached_document_ids(files),
        "files": files,
    }


def has_unprocessed_attached_evidence(evidence_files: list[Any] | None) -> bool:
    for evidence in evidence_files or []:
        if not isinstance(evidence, dict):
            continue
        processing_status = str(
            evidence.get("processing_status") or evidence.get("status") or ""
        ).lower()
        if processing_status in PROCESSING_EVIDENCE_STATES:
            return True
        if not evidence.get("knowledge_document_id") and evidence.get("url"):
            return True
    return False


def generate_structured_result(
    *,
    status: str,
    confidence: float,
    matches: list[dict[str, Any]],
    citations: list[dict[str, Any]],
) -> dict[str, Any]:
    if status == "supported":
        summary = "Attached or indexed evidence appears to support this answer. Reviewer should verify the cited source before accepting."
        gaps: list[str] = []
        recommended_action = (
            "Review the cited evidence and accept or override the AI evidence check."
        )
    elif status == "partially_supported":
        summary = "Evidence partially supports this answer, but the reviewer should confirm missing details before relying on it."
        gaps = ["Evidence does not fully cover every claim in the response."]
        recommended_action = "Ask for more specific evidence or reviewer notes for unsupported parts of the answer."
    elif status == "unsupported":
        summary = (
            "Relevant evidence was found, but it is too weak to support the answer."
        )
        gaps = ["No strong citation directly supports the answer."]
        recommended_action = "Upload stronger evidence or revise the answer to match the submitted documents."
    elif status == "evidence_processing":
        summary = "Evidence has been uploaded but is not indexed yet, so the AI cannot check it reliably."
        gaps = [
            "Uploaded evidence is still processing or has not been linked to indexed document chunks."
        ]
        recommended_action = (
            "Wait for processing to finish, then run the evidence check again."
        )
    elif status == "needs_answer":
        summary = "No answer has been provided yet."
        gaps = ["Answer is missing."]
        recommended_action = "Provide and save an answer before checking evidence."
    else:
        summary = "No indexed evidence was found to support this answer."
        gaps = ["No matching indexed evidence was found for this response."]
        recommended_action = (
            "Upload and process supporting evidence, then rerun the evidence check."
        )

    return {
        "status": status,
        "confidence": confidence,
        "summary": summary,
        "supported_claims": [
            {
                "claim": "Response is supported by cited evidence chunk.",
                "evidence": [match.get("chunk_id") or match.get("id")],
            }
            for match in matches[:3]
        ],
        "gaps": gaps,
        "citations": citations,
        "recommended_action": recommended_action,
    }


def validate_response(
    response_text: str,
    organization_id: str,
    existing_evidence_ids: List[Any] | None = None,
    assessment_id: str | None = None,
) -> ValidationResult:
    """
    Main evidence-check pipeline.

    Retrieval priority:
    1. Evidence attached to this response.
    2. Evidence indexed against the same assessment/site metadata.
    3. Organization knowledge library fallback.
    """
    snapshot = evidence_snapshot(existing_evidence_ids)
    has_answer = bool((response_text or "").strip())
    if not has_answer:
        result_json = generate_structured_result(
            status="needs_answer", confidence=0.0, matches=[], citations=[]
        )
        return ValidationResult(
            validation_status="needs_answer",
            confidence_score=0.0,
            citations=[],
            similar_chunks=[],
            feedback=result_json["summary"],
            result_json=result_json,
            evidence_snapshot=snapshot,
            model_provider=getattr(settings, "EMBEDDING_MODEL_PROVIDER", ""),
            model_name=getattr(settings, "EMBEDDING_MODEL_NAME", ""),
        )

    embedding = embed_text(response_text)
    attached_document_ids = snapshot["attached_document_ids"]

    matches: list[dict[str, Any]] = []
    if attached_document_ids:
        matches = query_similar_evidence(
            embedding=embedding,
            organization_id=organization_id,
            document_ids=attached_document_ids,
            top_k=5,
            threshold=0.45,
            source_scope="response_evidence",
        )

    if not matches and assessment_id:
        matches = query_similar_evidence(
            embedding=embedding,
            organization_id=organization_id,
            assessment_id=assessment_id,
            top_k=5,
            threshold=0.5,
            source_scope="assessment_evidence",
        )

    if not matches:
        matches = query_similar_evidence(
            embedding=embedding,
            organization_id=organization_id,
            top_k=5,
            threshold=0.55,
            source_scope="organization_library",
        )

    citations = extract_citations(matches)
    confidence = calculate_confidence(matches)
    status = determine_status(confidence, matches, has_answer)
    if not matches and has_unprocessed_attached_evidence(existing_evidence_ids):
        status = "evidence_processing"

    result_json = generate_structured_result(
        status=status,
        confidence=confidence,
        matches=matches,
        citations=citations,
    )

    return ValidationResult(
        validation_status=status,
        confidence_score=confidence,
        citations=citations,
        similar_chunks=matches,
        feedback=result_json["summary"],
        result_json=result_json,
        evidence_snapshot=snapshot,
        model_provider=getattr(settings, "EMBEDDING_MODEL_PROVIDER", ""),
        model_name=getattr(settings, "EMBEDDING_MODEL_NAME", ""),
    )
