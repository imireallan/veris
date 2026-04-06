from django.contrib import admin
from knowledge.models import KnowledgeDocument


@admin.register(KnowledgeDocument)
class KnowledgeDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "organization", "file_type", "file_size", "category", 
                   "embeddings_indexed", "chunk_count", "created_at")
    list_filter = ("category", "embeddings_indexed", "file_type")
    search_fields = ("title", "description")
    readonly_fields = ("id", "vector_ids", "created_at", "updated_at")
    ordering = ("-created_at",)
