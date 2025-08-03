# accounts/forms.py
from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth import get_user_model, authenticate
from django.core.exceptions import ValidationError

User = get_user_model()


class CustomAuthenticationForm(AuthenticationForm):
    """
    Custom login form that accepts either email or phone number
    """
    username = forms.CharField(
        label="Email or Phone Number",
        max_length=254,
        widget=forms.TextInput(attrs={
            'placeholder': 'Enter email or phone number',
            'class': 'form-control'
        })
    )
    
    def clean(self):
        username = self.cleaned_data.get('username')
        password = self.cleaned_data.get('password')

        if username is not None and password:
            self.user_cache = authenticate(
                self.request,
                username=username,
                password=password
            )
            if self.user_cache is None:
                raise self.get_invalid_login_error()
            else:
                self.confirm_login_allowed(self.user_cache)

        return self.cleaned_data


class CustomUserCreationForm(UserCreationForm):
    """
    Custom user creation form
    """
    email = forms.EmailField(
        required=False,
        widget=forms.EmailInput(attrs={
            'placeholder': 'Email address (optional)',
            'class': 'form-control'
        })
    )
    phone_number = forms.CharField(
        required=False,
        max_length=15,
        widget=forms.TextInput(attrs={
            'placeholder': 'Phone number (optional)',
            'class': 'form-control'
        })
    )
    full_name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Full name',
            'class': 'form-control'
        })
    )

    class Meta:
        model = User
        fields = ('email', 'phone_number', 'full_name', 'password1', 'password2')

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        phone_number = cleaned_data.get('phone_number')

        if not email and not phone_number:
            raise ValidationError("Please provide either an email address or phone number.")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data.get('email') or None
        user.phone_number = self.cleaned_data.get('phone_number') or None
        user.full_name = self.cleaned_data['full_name']
        
        if commit:
            user.save()
        return user