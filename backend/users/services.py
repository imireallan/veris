from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("Account is disabled")

        refresh = RefreshToken.for_user(user)
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserBriefSerializer(user).data,
        }


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name")


class MeSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="name")
    # orgId is now context-dependent or membership-based
    # For the 'me' endpoint, we usually return the primary or last-active org
    orgId = serializers.UUIDField(source="organization_id", allow_null=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "fullName",
            "orgId",
            "is_staff",
            "is_active",
        )
