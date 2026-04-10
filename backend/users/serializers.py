from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "email", "name", "status",
            "timezone", "is_staff", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")



