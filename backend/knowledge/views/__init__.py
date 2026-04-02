from rest_framework import viewsets
from knowledge.models import KnowledgeDocument
from knowledge.serializers import KnowledgeDocumentSerializer
from rest_framework.permissions import IsAuthenticated


class KnowledgeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.user.organization_id if hasattr(self.request.user, "organization_id") else None
        if org_id:
            return KnowledgeDocument.objects.filter(organization_id=org_id)
        return KnowledgeDocument.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            organization_id=self.request.user.organization_id
            if hasattr(self.request.user, "organization_id")
            else None,
            created_by=self.request.user,
        )
