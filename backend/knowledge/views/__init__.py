from rest_framework import viewsets
from knowledge.models import KnowledgeDocument
from knowledge.serializers import KnowledgeDocumentSerializer
from rest_framework.permissions import IsAuthenticated
from organizations.models import OrganizationMembership


class KnowledgeDocumentViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Scope to all organizations the user is a member of
        memberships = OrganizationMembership.objects.filter(user=user).values_list('organization_id', flat=True)
        if memberships:
            return KnowledgeDocument.objects.filter(organization_id__in=memberships)
        return KnowledgeDocument.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        # Use the organization ID from the request or default to the user's first membership
        org_id = self.request.query_params.get('organization')
        if not org_id:
            membership = OrganizationMembership.objects.filter(user=user).first()
            org_id = membership.organization_id if membership else None
            
        serializer.save(
            organization_id=org_id,
            created_by=user,
        )
