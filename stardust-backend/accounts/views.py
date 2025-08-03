# accounts/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib import messages
from django.views.generic import CreateView
from django.urls import reverse_lazy
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .forms import CustomUserCreationForm, CustomAuthenticationForm


def custom_login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {user.full_name}!')
                return redirect('dashboard')  # Redirect to your dashboard
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'accounts/login.html', {'form': form})


class CustomSignUpView(CreateView):
    form_class = CustomUserCreationForm
    template_name = 'accounts/signup.html'
    success_url = reverse_lazy('login')
    
    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(
            self.request, 
            'Account created successfully! You can now log in.'
        )
        return response


# Alternative name for the same view (in case your URLs expect 'RegisterView')
class RegisterView(CustomSignUpView):
    """Alias for CustomSignUpView to match URL expectations"""
    pass


# API Views (if you're building a REST API)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    """API endpoint for user registration"""
    form = CustomUserCreationForm(data=request.data)
    
    if form.is_valid():
        user = form.save()
        return Response({
            'message': 'User registered successfully',
            'user_id': user.id,
            'email': user.email,
            'phone_number': user.phone_number,
            'full_name': user.full_name
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'errors': form.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    """API endpoint for user login"""
    username = request.data.get('username')  # Can be email or phone
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        # You might want to use JWT tokens here instead of session login
        login(request, user)
        return Response({
            'message': 'Login successful',
            'user_id': user.id,
            'email': user.email,
            'phone_number': user.phone_number,
            'full_name': user.full_name
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)