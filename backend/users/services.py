from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
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
        fields = ("id", "email", "name", "org_id", "role")
        # org_id is on the model as organization_id
        # but we use the actual DB field


class MeSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source="name")
    orgId = serializers.UUIDField(source="organization_id", allow_null=True)

    class Meta:
        model = User
        fields = (
            "id", "email", "fullName", "orgId", "role",
            "is_staff", "is_active",
        )
