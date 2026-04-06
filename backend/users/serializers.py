from rest_framework import serializers

from .models import User, AssessorProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id", "email", "name", "organization", "role", "status",
            "timezone", "is_staff", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class AssessorProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)

    class Meta:
        model = AssessorProfile
        fields = (
            "id", "email", "name", "user", "role", "specializations",
            "can_be_lead_assessor", "biography", "direct_phone_number",
            "timezone", "country", "region", "current_organisation",
            "is_registration_completed", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
