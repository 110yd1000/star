from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework_simplejwt.authentication import JWTAuthentication

User = get_user_model()

class EmailPhoneAuthBackend:
    def authenticate(self, request, username=None, password=None):
        try:
            # Try to fetch the user by email or phone
            user = User.objects.get(
                Q(email=username) | Q(phone_number=username)
            )
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None