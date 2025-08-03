from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
import re

User = get_user_model()


class EmailPhoneAuthBackend(BaseBackend):
    """
    Custom authentication backend that allows users to login with either
    email address or phone number along with their password.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            # Check if username is an email or phone number
            if self._is_email(username):
                user = User.objects.get(email=username)
            elif self._is_phone_number(username):
                user = User.objects.get(phone_number=username)
            else:
                # Try both email and phone as fallback
                user = User.objects.get(
                    Q(email=username) | Q(phone_number=username)
                )
            
            # Check password
            if user.check_password(password):
                return user
                
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a nonexistent user
            User().set_password(password)
            return None
        except User.MultipleObjectsReturned:
            # This shouldn't happen with unique constraints, but just in case
            return None
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
    
    def _is_email(self, username):
        """Check if the username is an email address"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, username) is not None
    
    def _is_phone_number(self, username):
        """Check if the username is a phone number in E.164 format"""
        phone_pattern = r'^\+[1-9]\d{1,14}$'
        return re.match(phone_pattern, username) is not None