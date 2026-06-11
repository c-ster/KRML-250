"""Email service adapter — logs in dev, sends via SMTP or SendGrid in prod."""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, name: str, token: str) -> None:
    verify_url = f"{settings.frontend_url}/250/verify/{token}"
    subject = "Verify your KRML 250 submission"
    html_body = f"""
    <html><body style="font-family: sans-serif; background: #18181b; color: #f4f4f5; padding: 24px;">
      <h1 style="color: #f59e0b;">KRML 250 — The Soundtrack of the Monterey Bay</h1>
      <p>Hi {name},</p>
      <p>Thanks for signing up! Click the link below to verify your email and unlock your submission:</p>
      <p>
        <a href="{verify_url}"
           style="background: #f59e0b; color: #18181b; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Verify My Email
        </a>
      </p>
      <p>Or copy this link: <code>{verify_url}</code></p>
      <p>This link expires in 24 hours.</p>
      <p>— The KRML Team</p>
    </body></html>
    """
    text_body = f"Hi {name},\n\nVerify your KRML 250 submission:\n{verify_url}\n\nThis link expires in 24 hours.\n— The KRML Team"

    _send(to_email, subject, html_body, text_body)


def _send(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    provider = settings.email_provider.lower()

    if provider == "none":
        logger.info(
            "EMAIL [dev/none] to=%s subject=%r body_preview=%s",
            to_email,
            subject,
            text_body[:120],
        )
        return

    if provider == "smtp":
        _send_smtp(to_email, subject, html_body, text_body)
    elif provider == "sendgrid":
        _send_sendgrid(to_email, subject, html_body, text_body)
    elif provider == "resend":
        _send_resend(to_email, subject, html_body, text_body)
    else:
        logger.warning("Unknown email provider %r, falling back to log", provider)
        logger.info("EMAIL to=%s subject=%r", to_email, subject)


def _send_smtp(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.from_email
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.starttls()
            if settings.smtp_user:
                server.login(settings.smtp_user, settings.smtp_pass)
            server.sendmail(settings.from_email, [to_email], msg.as_string())
        logger.info("Sent SMTP email to %s", to_email)
    except Exception as exc:
        logger.error("SMTP send failed to %s: %s", to_email, exc)
        raise


def _send_resend(to_email: str, subject: str, html_body: str, text_body: str) -> None:
    try:
        import httpx

        payload = {
            "from": settings.from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body,
        }
        resp = httpx.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Sent Resend email to %s", to_email)
    except Exception as exc:
        logger.error("Resend send failed to %s: %s", to_email, exc)
        raise


def _send_sendgrid(
    to_email: str, subject: str, html_body: str, text_body: str
) -> None:
    try:
        import httpx

        payload = {
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": settings.from_email},
            "subject": subject,
            "content": [
                {"type": "text/plain", "value": text_body},
                {"type": "text/html", "value": html_body},
            ],
        }
        resp = httpx.post(
            "https://api.sendgrid.com/v3/mail/send",
            json=payload,
            headers={"Authorization": f"Bearer {settings.sendgrid_api_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        logger.info("Sent SendGrid email to %s", to_email)
    except Exception as exc:
        logger.error("SendGrid send failed to %s: %s", to_email, exc)
        raise
