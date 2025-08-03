from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework_simplejwt.tokens import RefreshToken
import re

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    class Meta:
        model = User
        fields = ['phone_number', 'email', 'full_name', 'password']
        extra_kwargs = {
            'phone_number': {'required': False},
            'email': {'required': False},
            'full_name': {'min_length': 2, 'max_length': 100}
        }

    def validate_password(self, value):
        # Use Django's built-in password validation
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        
        # Additional custom validation to match OpenAPI spec
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$', value):
            raise serializers.ValidationError(
                'Password must contain at least one uppercase letter, one lowercase letter, '
                'one digit, and one special character (!@#$%^&*(),.?\":{}|<>)'
            )
        return value

    def validate_full_name(self, value):
        if not re.match(r'^[a-zA-Z\s\-\'\.]+$', value):
            raise serializers.ValidationError(
                'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
            )
        return value

    def validate_phone_number(self, value):
        if value and not re.match(r'^\+[1-9]\d{1,14}$', value):
            raise serializers.ValidationError(
                'Phone number must be in E.164 international format'
            )
        return value

    def validate(self, data):
        if not data.get('email') and not data.get('phone_number'):
            raise serializers.ValidationError(
                'At least one of phone_number or email must be provided'
            )
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')

        if not email and not phone:
            raise serializers.ValidationError(
                'Either email or phone must be provided'
            )

        if not password:
            raise serializers.ValidationError('Password is required')

        # Use email or phone as username for authentication
        username = email or phone
        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError('Invalid credentials')

        if not user.is_active:
            raise serializers.ValidationError('Account is deactivated')

        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'email', 'full_name',
            'role', 'is_verified', 'email_verified',
            'phone_verified', 'created_at', 'last_login'
        ]
        read_only_fields = [
            'id', 'role', 'is_verified', 'email_verified',
            'phone_verified', 'created_at', 'last_login'
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone_number']
        extra_kwargs = {
            'full_name': {'min_length': 2, 'max_length': 100},
            'email': {'max_length': 254},
        }

    def validate_full_name(self, value):
        if value and not re.match(r'^[a-zA-Z\s\-\'\.]+$', value):
            raise serializers.ValidationError(
                'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
            )
        return value

    def validate_phone_number(self, value):
        if value and not re.match(r'^\+[1-9]\d{1,14}$', value):
            raise serializers.ValidationError(
                'Phone number must be in E.164 international format'
            )
        return value

    def update(self, instance, validated_data):
        # If email or phone is being updated, mark as unverified
        if 'email' in validated_data and validated_data['email'] != instance.email:
            instance.email_verified = False
        if 'phone_number' in validated_data and validated_data['phone_number'] != instance.phone_number:
            instance.phone_verified = False
        
        instance = super().update(instance, validated_data)
        instance.update_verification_status()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context['request'].user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class PasswordResetSerializer(serializers.Serializer):
    phone_or_email = serializers.CharField()

    def validate_phone_or_email(self, value):
        # Check if it's email or phone format
        if '@' in value:
            # Email format
            if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
                raise serializers.ValidationError('Invalid email format')
        else:
            # Phone format
            if not re.match(r'^\+[1-9]\d{1,14}$', value):
                raise serializers.ValidationError('Invalid phone number format')
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class EmailVerificationSerializer(serializers.Serializer):
    key = serializers.CharField()


class PhoneVerificationSerializer(serializers.Serializer):
    phone = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate_phone(self, value):
        if not re.match(r'^\+[1-9]\d{1,14}$', value):
            raise serializers.ValidationError('Phone number must be in E.164 format')
        return value

    def validate_otp(self, value):
        if not re.match(r'^\d{6}$', value):
            raise serializers.ValidationError('OTP must be 6 digits')
        return value


class AccountDeactivationSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    reason = serializers.CharField(max_length=500, required=False)

    def validate_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Password is incorrect')
        return value


class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    expires_in = serializers.IntegerField()


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    expires_in = serializers.IntegerField()
    user = UserProfileSerializer()


class RegistrationResponseSerializer(serializers.Serializer):
    message = serializers.CharField()
    user_id = serializers.IntegerField()
    verification_required = serializers.ListField(child=serializers.CharField())

