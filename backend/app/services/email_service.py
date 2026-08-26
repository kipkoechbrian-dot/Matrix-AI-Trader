import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def smtp_configured() -> bool:
    """True only when every piece needed to send mail is present."""
    return bool(
        settings.SMTP_HOST
        and settings.SMTP_USERNAME
        and settings.SMTP_PASSWORD
        and settings.EMAIL_FROM
    )


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


def send_html_email(recipient: str, subject: str, html: str):
    msg = MIMEText(html, "html")

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


WELCOME_HTML = """\
<div style="background:#020617;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#0a142e;border-radius:18px;
              border:1px solid #1d4ed8;overflow:hidden;">
    <div style="background:linear-gradient(120deg,#1d4ed8,#2563eb 55%,#0ea5e9);
                padding:26px 30px;">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:2px;">
        MATRIX <span style="color:#67e8f9;">AI</span> TRADER
      </div>
      <div style="font-size:11px;color:#bfdbfe;letter-spacing:3px;margin-top:4px;">
        INTELLIGENT TRADING TERMINAL
      </div>
    </div>
    <div style="padding:30px;color:#dbe7ff;">
      <h1 style="font-size:22px;margin:0 0 10px 0;color:#ffffff;">
        Welcome aboard, {{username}} 👋
      </h1>
      <p style="font-size:14px;line-height:1.7;color:#8ba3cf;margin:0 0 18px 0;">
        Your personal trading desk is open and your wallet is ready.
        Here is what is live on your terminal right now:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#dbe7ff;">
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(59,130,246,.15);">
          🤖 <b>AI signal engine</b> — EMA + RSI + MACD confluence on every setup</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(59,130,246,.15);">
          🛡️ <b>Auto SL / TP guardian</b> — positions monitored day and night</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(59,130,246,.15);">
          💳 <b>Wallet rails</b> — M-Pesa STK push and card funding</td></tr>
        <tr><td style="padding:8px 0;">
          📊 <b>Portfolio analytics</b> — equity curve, win rate and full trade journal</td></tr>
      </table>
      <div style="margin-top:22px;background:rgba(37,99,235,.12);
                  border:1px solid rgba(59,130,246,.3);border-radius:12px;
                  padding:14px 16px;font-size:12px;color:#93c5fd;">
        📌 Matrix AI Trader is a <b>paper-trading platform</b> — every balance,
        trade and P&amp;L is simulated. No real money is ever at risk.
      </div>
    </div>
    <div style="padding:16px 30px;border-top:1px solid rgba(59,130,246,.15);
                font-size:11px;color:#5b6e96;">
      Matrix AI Trader · Trade the market like a machine.
    </div>
  </div>
</div>
"""


def send_welcome_email(recipient: str, username: str):
    """Branded welcome email, fired after registration.

    Deliberately never raises and silently skips when SMTP is not
    configured — an email must NEVER be able to break a signup.
    """
    if not smtp_configured():
        print("📧 SMTP not configured — skipping welcome email for", recipient)
        return
    try:
        send_html_email(
            recipient,
            "Welcome to Matrix AI Trader — your desk is open 📈",
            WELCOME_HTML.replace("{{username}}", username),
        )
        print("📧 Welcome email sent to", recipient)
    except Exception as exc:  # noqa: BLE001 — email is fire-and-forget
        print(f"📧 Welcome email FAILED for {recipient}: {exc}")
