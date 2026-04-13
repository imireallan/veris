# Email Setup for Veris

## Local Development (Fake SMTP Server)

Veris uses MailHog for local development. All emails sent during development are captured and can be viewed in a web UI.

### Start the Email Server

```bash
cd ~/projects/Veris
docker compose up -d emailserver
```

### Access the Email Web UI

- **URL**: http://localhost:8025
- **SMTP Server**: localhost:1025 (no authentication required)

### Configuration

The `.env` file is already configured for local development:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=emailserver
EMAIL_PORT=1025
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=False
DEFAULT_FROM_EMAIL=no-reply@veris.local
```

### Testing Email Sending

1. Create an organization via the UI
2. Enter a client email address
3. Check http://localhost:1080 to see the invitation email

## Testing Environment

For automated tests, emails are sent to the console backend (printed to stdout):

```env
# In .env.testing or when running tests
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Production Setup

For production, configure a real SMTP provider:

### Option 1: SendGrid

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
SERVER_EMAIL=noreply@yourdomain.com
```

### Option 2: AWS SES

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-ses-smtp-user
EMAIL_HOST_PASSWORD=your-ses-smtp-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
SERVER_EMAIL=noreply@yourdomain.com
```

### Option 3: Other SMTP Providers

Update the SMTP settings in `.env` according to your provider's documentation.

## Email Templates

Email templates are currently plain text in `organizations/email_service.py`. To add HTML templates:

1. Create HTML templates in `organizations/templates/organizations/emails/`
2. Use Django's `render_to_string` to render templates
3. Pass both `message` (plain text) and `html_message` to `send_mail()`

Example:

```python
from django.template.loader import render_to_string

html_message = render_to_string(
    "organizations/emails/invitation.html",
    {"invitation": invitation, "accept_url": accept_url}
)

send_mail(
    subject=subject,
    message=plain_message,
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=[invitation.email],
    html_message=html_message,
    fail_silently=False,
)
```

## Troubleshooting

### Emails Not Appearing in Web UI

1. Check if emailserver is running: `docker ps | grep emailserver`
2. Check SMTP port: `docker logs veris-emailserver`
3. Verify EMAIL_HOST and EMAIL_PORT in `.env`

### Emails Not Sending in Production

1. Check SMTP credentials
2. Verify firewall rules (port 587 or 465)
3. Check Django logs for email errors
4. Test SMTP connection manually:

```bash
telnet smtp.sendgrid.net 587
```

### Console Backend During Development

If you want to see emails in the Django console instead of the fake SMTP server:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

This prints emails to stdout (visible in `docker compose logs backend`).
