from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from twilio.rest import Client
from twilio.base.exceptions import TwilioException
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def send_verification_email(user, token):
        """Send email verification email"""
        try:
            subject = 'Verify your email address - Stardust Classifieds'
            
            # Create verification URL (you'll need to adjust this based on your frontend)
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token.token}"
            
            context = {
                'user': user,
                'verification_url': verification_url,
                'token': token.token,
            }
            
            # Render HTML email template
            html_message = render_to_string('accounts/emails/verify_email.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Verification email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            return False
    
    @staticmethod
    def send_password_reset_email(user, token):
        """Send password reset email"""
        try:
            subject = 'Reset your password - Stardust Classifieds'
            
            # Create reset URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token.token}"
            
            context = {
                'user': user,
                'reset_url': reset_url,
                'token': token.token,
            }
            
            html_message = render_to_string('accounts/emails/password_reset.html', context)
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            logger.info(f"Password reset email sent to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send password reset email to {user.email}: {str(e)}")
            return False


class SMSService:
    """Service for sending SMS messages"""
    
    def __init__(self):
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured. SMS functionality disabled.")
    
    def send_verification_sms(self, user, otp):
        """Send phone verification SMS"""
        if not self.client:
            logger.error("SMS service not configured")
            return False
        
        try:
            message_body = f"Your Stardust Classifieds verification code is: {otp.otp_code}. This code expires in 10 minutes."
            
            message = self.client.messages.create(
                body=message_body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=user.phone_number
            )
            
            logger.info(f"Verification SMS sent to {user.phone_number}. Message SID: {message.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"Failed to send verification SMS to {user.phone_number}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {user.phone_number}: {str(e)}")
            return False
    
    def send_password_reset_sms(self, user, token):
        """Send password reset SMS"""
        if not self.client:
            logger.error("SMS service not configured")
            return False
        
        try:
            message_body = f"Your Stardust Classifieds password reset code is: {token.token}. This code expires in 1 hour."
            
            message = self.client.messages.create(
                body=message_body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=user.phone_number
            )
            
            logger.info(f"Password reset SMS sent to {user.phone_number}. Message SID: {message.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"Failed to send password reset SMS to {user.phone_number}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending SMS to {user.phone_number}: {str(e)}")
            return False


class VerificationService:
    """Service for handling user verification"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.sms_service = SMSService()
    
    def send_email_verification(self, user):
        """Create and send email verification token"""
        from .verification_models import EmailVerificationToken
        
        # Invalidate any existing tokens
        EmailVerificationToken.objects.filter(
            user=user, 
            email=user.email, 
            is_used=False
        ).update(is_used=True)
        
        # Create new token
        token = EmailVerificationToken.objects.create(
            user=user,
            email=user.email
        )
        
        # Send email
        return self.email_service.send_verification_email(user, token)
    
    def send_phone_verification(self, user):
        """Create and send phone verification OTP"""
        from .verification_models import PhoneVerificationOTP
        
        # Invalidate any existing OTPs
        PhoneVerificationOTP.objects.filter(
            user=user,
            phone_number=user.phone_number,
            is_used=False
        ).update(is_used=True)
        
        # Create new OTP
        otp = PhoneVerificationOTP.objects.create(
            user=user,
            phone_number=user.phone_number
        )
        
        # Send SMS
        return self.sms_service.send_verification_sms(user, otp)
    
    def verify_email_token(self, token_string):
        """Verify email token and mark email as verified"""
        from .verification_models import EmailVerificationToken
        
        try:
            token = EmailVerificationToken.objects.get(
                token=token_string,
                is_used=False
            )
            
            if not token.is_valid():
                return False, "Token has expired or is invalid"
            
            # Mark token as used
            token.is_used = True
            token.save()
            
            # Mark user's email as verified
            user = token.user
            user.email_verified = True
            user.update_verification_status()
            
            return True, "Email verified successfully"
            
        except EmailVerificationToken.DoesNotExist:
            return False, "Invalid verification token"
    
    def verify_phone_otp(self, phone_number, otp_code):
        """Verify phone OTP and mark phone as verified"""
        from .verification_models import PhoneVerificationOTP
        
        try:
            otp = PhoneVerificationOTP.objects.get(
                phone_number=phone_number,
                otp_code=otp_code,
                is_used=False
            )
            
            if not otp.is_valid():
                otp.increment_attempts()
                return False, "OTP has expired or maximum attempts exceeded"
            
            # Mark OTP as used
            otp.is_used = True
            otp.save()
            
            # Mark user's phone as verified
            user = otp.user
            user.phone_verified = True
            user.update_verification_status()
            
            return True, "Phone number verified successfully"
            
        except PhoneVerificationOTP.DoesNotExist:
            return False, "Invalid OTP code"