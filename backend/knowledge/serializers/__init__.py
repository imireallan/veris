from rest_framework import serializers

from knowledge.models import KnowledgeDocument


class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeDocument
        fields = [
            "id",
            "organization",
            "title",
            "description",
            "file_url",
            "file_type",
            "file_size",
            "category",
            "embeddings_indexed",
            "chunk_count",
            "vector_ids",
            "framework_tags",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "chunk_count",
            "vector_ids",
        ]
