import uuid

from django.db import models


class KnowledgeDocument(models.Model):
    """Stores uploaded sustainability documents for the RAG pipeline."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="documents"
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    file_url = models.URLField(max_length=1000)
    file_type = models.CharField(max_length=20, default="PDF")
    file_size = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=50)
    embeddings_indexed = models.BooleanField(default=False)
    chunk_count = models.PositiveIntegerField(default=0)
    vector_ids = models.JSONField(default=list)
    framework_tags = models.JSONField(default=list, help_text="Which frameworks this document relates to")
    created_by = models.ForeignKey(
        "users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="documents"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "knowledge_documents"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
