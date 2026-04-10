from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from knowledge.models import KnowledgeDocument
from knowledge.serializers import KnowledgeDocumentSerializer
from knowledge.services import delete_from_pinecone, process_document
from organizations.models import OrganizationMembership


class KnowledgeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Scope to all organizations the user is a member of
        memberships = OrganizationMembership.objects.filter(user=user).values_list(
            "organization_id", flat=True
        )
        if memberships:
            return KnowledgeDocument.objects.filter(organization_id__in=memberships)
        return KnowledgeDocument.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        # Use the organization ID from the request or default to the user's first membership
        org_id = self.request.query_params.get("organization")
        if not org_id:
            membership = OrganizationMembership.objects.filter(user=user).first()
            org_id = membership.organization_id if membership else None

        serializer.save(
            organization_id=org_id,
            created_by=user,
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def process(self, request, pk=None):
        """
        Trigger AI processing pipeline for a document.
        Extract text → Chunk → Embed → Store in Pinecone
        """
        from django.conf import settings

        document = self.get_object()

        # Check if already processed
        if document.embeddings_indexed:
            return Response(
                {"error": "Document already processed"},
                status=400,
            )

        # Build file path from URL
        file_path = document.file_url
        if file_path.startswith("/"):
            # Local storage path
            file_path = f"{settings.BASE_DIR}{file_path}"

        # Run the pipeline
        result = process_document(
            file_path=file_path,
            file_type=document.file_type,
            document_id=str(document.id),
            organization_id=str(document.organization_id),
            index_name=settings.PINECONE_INDEX_NAME,
            framework_tags=document.framework_tags,
        )

        if not result.success:
            # Update document with error state
            document.embeddings_indexed = False
            document.description = f"Processing failed: {result.error}"
            document.save(update_fields=["embeddings_indexed", "description"])

            return Response(
                {"error": result.error},
                status=500,
            )

        # Update document with results
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
        """
        Reprocess a document (delete old vectors and re-embed).
        """
        from django.conf import settings

        document = self.get_object()
        index_name = settings.PINECONE_INDEX_NAME

        # Delete existing vectors
        if document.vector_ids:
            delete_from_pinecone(document.vector_ids, index_name)

        # Reset state
        document.embeddings_indexed = False
        document.vector_ids = []
        document.chunk_count = 0
        document.save(update_fields=["embeddings_indexed", "vector_ids", "chunk_count"])

        # Trigger processing
        return self.process(request, pk=pk)
