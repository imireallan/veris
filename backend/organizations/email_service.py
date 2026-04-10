"""Email service for sending invitations and notifications."""

from django.conf import settings
from django.core.mail import send_mail

from organizations.models import Invitation


def send_invitation_email(invitation: Invitation) -> bool:
    """
    Send invitation email to the recipient.

    In production, configure SMTP settings in .env:
    - EMAIL_HOST
    - EMAIL_PORT
    - EMAIL_HOST_USER
    - EMAIL_HOST_PASSWORD
    - EMAIL_USE_TLS
    - DEFAULT_FROM_EMAIL

    For development, emails are logged to console by default.
    """
    # Acceptance URL (frontend will handle this)
    # For now, we'll use a placeholder - frontend needs to implement this route
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    accept_url = f"{frontend_url}/invite/{invitation.token}"

    subject = f"You've been invited to join {invitation.organization.name} on Veris"

    # Plain text email body
    message = f"""
Hello,

You've been invited to join {invitation.organization.name} on Veris.

Role: {invitation.role.name if invitation.role else invitation.get_fallback_role_display()}
Invited by: {invitation.invited_by.name} ({invitation.invited_by.email})
Expires: {invitation.expires_at.strftime('%B %d, %Y at %I:%M %p')}

To accept this invitation, please visit:
{accept_url}

If you don't want to accept this invitation, you can ignore this email.

Best regards,
The Veris Team
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[invitation.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        # Log error in production
        print(f"Failed to send invitation email to {invitation.email}: {e}")
        return False


def send_welcome_email(user, organization) -> bool:
    """Send welcome email after user accepts invitation."""
    subject = f"Welcome to {organization.name} on Veris!"

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")

    message = f"""
Hello {user.name},

Welcome to {organization.name} on Veris!

You now have access to the platform. You can start by:
- Viewing your organization's assessments
- Uploading evidence
- Collaborating with your team

Login at: {frontend_url}

Best regards,
The Veris Team
"""

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send welcome email to {user.email}: {e}")
        return False
