from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from assessments.services.validation import embed_text, query_similar_evidence
from knowledge.models import KnowledgeDocument
from knowledge.serializers import KnowledgeDocumentSerializer
from knowledge.services import delete_from_pinecone, process_document


class KnowledgeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser and not getattr(
            self.request, "organization", None
        ):
            return KnowledgeDocument.objects.all()

        organization = getattr(self.request, "organization", None)
        if not organization:
            return KnowledgeDocument.objects.none()

        return KnowledgeDocument.objects.filter(organization=organization)

    def perform_create(self, serializer):
        organization = getattr(self.request, "organization", None)
        if not organization:
            raise PermissionDenied(
                "Organization context is required to create documents."
            )

        serializer.save(
            organization=organization,
            created_by=self.request.user,
        )

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def chat(self, request):
        """Answer a knowledge-library question using indexed evidence chunks."""
        organization = getattr(request, "organization", None)
        if not organization:
            return Response(
                {"error": "Select an organization before asking knowledge questions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        query = str(request.data.get("query", "")).strip()
        if not query:
            return Response(
                {"error": "Question is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        indexed_count = KnowledgeDocument._default_manager.filter(
            organization=organization,
            embeddings_indexed=True,
        ).count()
        if indexed_count == 0:
            return Response(
                {
                    "answer": "No indexed knowledge documents are available yet. Upload and process at least one document, then ask again.",
                    "sources": [],
                    "confidence": 0.0,
                }
            )

        try:
            embedding = embed_text(query)
            matches = query_similar_evidence(
                embedding=embedding,
                organization_id=str(organization.id),
                top_k=5,
                threshold=0.25,
            )
        except Exception as exc:
            return Response(
                {"error": f"Knowledge search failed: {exc}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not matches:
            return Response(
                {
                    "answer": "I could not find relevant indexed evidence for that question. Try asking with terms from the uploaded documents, or process more documents first.",
                    "sources": [],
                    "confidence": 0.0,
                }
            )

        document_ids = [match["document_id"] for match in matches if match.get("document_id")]
        documents = {
            str(document.id): document
            for document in KnowledgeDocument._default_manager.filter(
                organization=organization,
                id__in=document_ids,
            )
        }

        sources = []
        evidence_lines = []
        for index, match in enumerate(matches, start=1):
            document = documents.get(str(match.get("document_id")))
            source = {
                "document_id": match.get("document_id"),
                "title": document.title if document else "Unknown document",
                "chunk_index": match.get("chunk_index"),
                "score": round(float(match.get("score", 0)), 3),
                "text_preview": match.get("text_preview", ""),
            }
            sources.append(source)
            evidence_lines.append(
                f"{index}. {source['title']} — {source['text_preview']}"
            )

        best_score = max(float(match.get("score", 0)) for match in matches)
        answer = (
            "I found relevant indexed evidence. Here are the strongest matches:\n\n"
            + "\n".join(evidence_lines)
            + "\n\nUse these sources as evidence; review the document text before relying on them for final assessment decisions."
        )

        return Response(
            {
                "answer": answer,
                "sources": sources,
                "confidence": round(best_score, 3),
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def process(self, request, pk=None):
        from django.conf import settings

        document = self.get_object()

        if document.embeddings_indexed:
            return Response(
                {"error": "Document already processed"},
                status=400,
            )

        file_path = document.file_url
        if file_path.startswith("/"):
            file_path = f"{settings.BASE_DIR}{file_path}"

        result = process_document(
            file_path=file_path,
            file_type=document.file_type,
            document_id=str(document.id),
            organization_id=str(document.organization_id),
            index_name=settings.PINECONE_INDEX_NAME,
            framework_tags=document.framework_tags,
        )

        if not result.success:
            document.embeddings_indexed = False
            document.description = f"Processing failed: {result.error}"
            document.save(update_fields=["embeddings_indexed", "description"])

            return Response(
                {"error": result.error},
                status=500,
            )

        document.embeddings_indexed = True
        document.chunk_count = result.chunk_count
        document.vector_ids = result.vector_ids
        document.save(update_fields=["embeddings_indexed", "chunk_count", "vector_ids"])

        return Response(
            {
                "status": "processed",
                "chunk_count": result.chunk_count,
                "vector_count": len(result.vector_ids),
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reprocess(self, request, pk=None):
        from django.conf import settings

        document = self.get_object()
        index_name = settings.PINECONE_INDEX_NAME

        if document.vector_ids:
            delete_from_pinecone(document.vector_ids, index_name)

        document.embeddings_indexed = False
        document.vector_ids = []
        document.chunk_count = 0
        document.save(update_fields=["embeddings_indexed", "vector_ids", "chunk_count"])

        return self.process(request, pk=pk)
