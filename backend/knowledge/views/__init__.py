from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
