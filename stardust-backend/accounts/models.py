from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError


class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number=None, email=None, full_name=None, password=None, **extra_fields):
        if not phone_number and not email:
            raise ValueError("At least phone number or email must be provided.")
        if not full_name:
            raise ValueError("Full name is required.")

        if email:
            email = self.normalize_email(email)
        
        user = self.model(
            phone_number=phone_number,
            email=email,
            full_name=full_name,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number=None, email=None, full_name=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)
        extra_fields.setdefault('is_active', True)
        
        # For superuser creation, require at least one identifier
        if not phone_number and not email:
            raise ValueError("Superuser must have either phone number or email.")
        
        return self.create_user(
            phone_number=phone_number, 
            email=email, 
            full_name=full_name, 
            password=password, 
            **extra_fields
        )


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ('user', 'User'),
        ('admin', 'Admin'),
        ('moderator', 'Moderator')
    ]

    phone_number = models.CharField(
        max_length=15,
        unique=True,
        null=True,
        blank=True,
        validators=[
            RegexValidator(
                regex=r'^\+[1-9]\d{1,14}$',
                message='Phone number must be in E.164 format'
            )
        ]
    )
    email = models.EmailField(unique=True, null=True, blank=True)
    full_name = models.CharField(
        max_length=100,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z\s\-\'\.]+$',
                message='Name can only contain letters, spaces, hyphens, apostrophes, and periods'
            )
        ]
    )
    role = models.CharField(
        max_length=10,
        choices=ROLES,
        default='user'
    )
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    # Use email as USERNAME_FIELD, but we'll handle phone login via custom backend
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['role']),
        ]

    def clean(self):
        super().clean()
        if not self.phone_number and not self.email:
            raise ValidationError("At least one of phone number or email must be provided.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name

    @property
    def username(self):
        """Return email or phone for display purposes"""
        return self.email or self.phone_number

    @property
    def is_fully_verified(self):
        """Check if user has verified at least one contact method"""
        return self.email_verified or self.phone_verified

    def update_verification_status(self):
        """Update the overall verification status based on email/phone verification"""
        self.is_verified = self.is_fully_verified
        self.save(update_fields=['is_verified'])


# Import verification models
from .verification_models import (
    EmailVerificationToken,
    PhoneVerificationOTP,
    PasswordResetToken,
    BlacklistedToken
)