# services/email.py — transactional email via Resend
#
# We send from an authenticated domain (cvoptimize.site) so DKIM/SPF/DMARC pass
# and verification / reset mail lands in the inbox instead of spam.

import os
import resend


def _from_email() -> str:
    return os.environ.get("EMAIL_FROM", "no-reply@cvoptimize.site")


def _send(to_email: str, subject: str, html: str) -> None:
    """Send one transactional email via Resend. Raises on failure."""
    resend.api_key = os.environ["RESEND_API_KEY"]
    resend.Emails.send({
        "from": _from_email(),
        "to": [to_email],
        "subject": subject,
        "html": html,
    })


def send_password_reset_email(to_email: str, reset_url: str) -> None:
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0f2044;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <span style="font-size:1.2rem;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em;">
                CV<span style="color:#3b82f6;">Optimize</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 32px;">
              <h1 style="color:#f1f5f9;font-size:1.35rem;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">
                Reset your password
              </h1>
              <p style="color:#94a3b8;font-size:0.9rem;line-height:1.7;margin:0 0 28px;">
                Someone requested a password reset for your CVOptimize account.
                Click the button below to set a new password.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#3b82f6;border-radius:10px;">
                    <a href="{reset_url}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:0.9rem;font-weight:600;text-decoration:none;letter-spacing:-0.01em;">
                      Reset password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#64748b;font-size:0.8rem;line-height:1.6;margin:0 0 8px;">
                This link expires in <strong style="color:#94a3b8;">30 minutes</strong>.
              </p>
              <p style="color:#64748b;font-size:0.8rem;line-height:1.6;margin:0;">
                If you didn't request a password reset, you can safely ignore this email —
                your password will not be changed.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 40px;">
              <p style="color:#475569;font-size:0.75rem;margin:0;">
                CVOptimize · If the button doesn't work, copy this link:<br>
                <a href="{reset_url}" style="color:#3b82f6;word-break:break-all;">{reset_url}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    _send(to_email, "Reset your CVOptimize password", html)


def send_verification_email(to_email: str, verify_url: str) -> None:
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#0f2044;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <span style="font-size:1.2rem;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em;">
                CV<span style="color:#3b82f6;">Optimize</span>
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 32px;">
              <h1 style="color:#f1f5f9;font-size:1.35rem;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">
                Verify your email address
              </h1>
              <p style="color:#94a3b8;font-size:0.9rem;line-height:1.7;margin:0 0 28px;">
                Thanks for signing up to CVOptimize! Click the button below to verify your
                email address and secure your account.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#3b82f6;border-radius:10px;">
                    <a href="{verify_url}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:0.9rem;font-weight:600;text-decoration:none;letter-spacing:-0.01em;">
                      Verify email →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color:#64748b;font-size:0.8rem;line-height:1.6;margin:0 0 8px;">
                This link expires in <strong style="color:#94a3b8;">24 hours</strong>.
              </p>
              <p style="color:#64748b;font-size:0.8rem;line-height:1.6;margin:0;">
                If you didn't create a CVOptimize account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid rgba(255,255,255,0.06);padding:20px 40px;">
              <p style="color:#475569;font-size:0.75rem;margin:0;">
                CVOptimize · If the button doesn't work, copy this link:<br>
                <a href="{verify_url}" style="color:#3b82f6;word-break:break-all;">{verify_url}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    _send(to_email, "Verify your CVOptimize email", html)
