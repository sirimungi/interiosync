"""
Simple SMTP email helper for INTERIOSYNC.
Configuration is entirely via environment variables (see config.py).
If MAIL_USERNAME is not set the send function is a no-op and returns False,
allowing the router to surface the temp_password in the API response instead.
"""
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from . import config


def _is_configured() -> bool:
    return bool(config.MAIL_USERNAME and config.MAIL_PASSWORD and config.MAIL_FROM)


def send_client_credentials(
    to_email: str,
    to_name: str,
    temp_password: str,
    designer_name: str,
    project_name: str,
) -> bool:
    """
    Send login credentials to a newly created client.
    Returns True on success, False if email is not configured or sending fails.
    """
    if not _is_configured():
        return False

    subject = f"Welcome to INTERIOSYNC — Your project '{project_name}' is ready"

    html_body = f"""
    <html>
    <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f8f8f6; padding:40px 0;">
      <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.07);">
        <div style="background:#1a1a2e; padding:32px 36px;">
          <h1 style="margin:0; color:#fff; font-size:22px; letter-spacing:0.5px;">
            Interio<span style="color:#C9A84C;">Sync</span>
          </h1>
          <p style="color:#9999aa; margin:6px 0 0; font-size:13px;">Interior Design Platform</p>
        </div>
        <div style="padding:32px 36px;">
          <p style="font-size:16px; color:#1a1a2e; margin:0 0 12px;">Hi {to_name},</p>
          <p style="color:#444; line-height:1.6; margin:0 0 20px;">
            Your designer <strong>{designer_name}</strong> has set up your project
            <strong>"{project_name}"</strong> on INTERIOSYNC. You can now log in to track
            progress, review quotes, and stay in touch — all in one place.
          </p>
          <div style="background:#f4f4f0; border-radius:8px; padding:20px 24px; margin:0 0 24px;">
            <p style="margin:0 0 8px; font-size:13px; color:#888; text-transform:uppercase; letter-spacing:0.5px;">Your login details</p>
            <p style="margin:0 0 6px; font-size:15px; color:#1a1a2e;"><strong>Email:</strong> {to_email}</p>
            <p style="margin:0; font-size:15px; color:#1a1a2e;"><strong>Password:</strong> {temp_password}</p>
          </div>
          <p style="color:#888; font-size:13px; line-height:1.6; margin:0 0 24px;">
            Please change your password after your first login. If you have any questions,
            reach out to your designer directly.
          </p>
          <a href="http://localhost:3000/login"
             style="display:inline-block; background:#C9A84C; color:#1a1a2e; text-decoration:none;
                    font-weight:600; font-size:14px; padding:12px 28px; border-radius:8px;">
            Log in to INTERIOSYNC
          </a>
        </div>
        <div style="padding:20px 36px; border-top:1px solid #f0f0f0;">
          <p style="margin:0; font-size:12px; color:#bbb;">
            © 2026 INTERIOSYNC · This is an automated message, please do not reply.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    text_body = (
        f"Hi {to_name},\n\n"
        f"Your designer {designer_name} has set up your project '{project_name}' on INTERIOSYNC.\n\n"
        f"Login details:\n"
        f"  Email:    {to_email}\n"
        f"  Password: {temp_password}\n\n"
        f"Please change your password after your first login.\n\n"
        f"Log in at: http://localhost:3000/login\n"
    )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"INTERIOSYNC <{config.MAIL_FROM}>"
    msg["To"] = to_email
    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(config.MAIL_SERVER, config.MAIL_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(config.MAIL_USERNAME, config.MAIL_PASSWORD)
            server.sendmail(config.MAIL_FROM, to_email, msg.as_string())
        return True
    except Exception:
        return False
