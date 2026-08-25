import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def send_email(
    recipient: str,
    subject: str,
    body: str
):
    msg = MIMEText(body)

    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = recipient

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT
    ) as server:

        server.starttls()

        server.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        )

        server.sendmail(
            settings.EMAIL_FROM,
            recipient,
            msg.as_string()
        )