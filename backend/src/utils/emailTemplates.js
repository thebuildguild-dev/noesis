import config from '../config/index.js'

function layout(title, bodyHtml) {
  const appName = config.app.name
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} – ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#fdfbf7;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdfbf7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;">

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:2px solid #2d2d2d;box-shadow:4px 4px 0 0 #2d2d2d;border-radius:10px 4px 10px 4px;">

              <!-- Header -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#2d2d2d;padding:24px 36px;border-radius:8px 2px 0 0;">
                    <div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#fdfbf7;letter-spacing:-0.5px;">${appName}</div>
                    <div style="width:24px;height:3px;background:#ff4d4d;margin-top:6px;border-radius:2px;"></div>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 36px 28px;color:#2d2d2d;font-size:15px;line-height:1.65;">
                    ${bodyHtml}
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px 36px 20px;border-top:1px dashed #e5e0d8;font-size:12px;color:#9ca3af;text-align:center;">
                    &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function welcome({ email }) {
  const appName = config.app.name
  const body = `
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2d2d2d;">Welcome to ${appName} ✦</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">your thinking space is ready</p>
    <p style="margin:0 0 16px;">Hi ${email},</p>
    <p style="margin:0 0 16px;">Your account is all set. Start building habits, write in your journal, and track your streaks — everything is waiting for you.</p>
    <p style="margin:0 0 0;font-size:13px;color:#9ca3af;">If you didn't create this account, you can safely ignore this email.</p>
  `
  return {
    subject: `Welcome to ${appName}`,
    html: layout(`Welcome to ${appName}`, body)
  }
}

function loginAlert({ email, timestamp }) {
  const appName = config.app.name
  const time = (timestamp || new Date()).toUTCString()
  const body = `
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2d2d2d;">New sign-in detected</p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">someone just signed into your account</p>
    <p style="margin:0 0 16px;">Hi ${email},</p>
    <p style="margin:0 0 16px;">We noticed a new sign-in to your ${appName} account.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:2px solid #e5e0d8;border-radius:6px 2px 6px 2px;width:100%;font-size:14px;">
      <tr>
        <td style="padding:10px 16px;color:#9ca3af;white-space:nowrap;border-bottom:1px solid #e5e0d8;">Time</td>
        <td style="padding:10px 16px;color:#2d2d2d;border-bottom:1px solid #e5e0d8;">${time}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;color:#9ca3af;white-space:nowrap;">Account</td>
        <td style="padding:10px 16px;color:#2d2d2d;">${email}</td>
      </tr>
    </table>
    <p style="margin:0 0 8px;">If this was you, no action needed.</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you don't recognise this sign-in, please reset your password immediately.</p>
  `
  return {
    subject: `New sign-in to your ${appName} account`,
    html: layout('New sign-in detected', body)
  }
}

function forgotPassword({ email, resetUrl }) {
  const appName = config.app.name
  const body = `
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2d2d2d;">Reset your password</p>
    <p style="margin:0 0 20px;color:#6b7280;font-size:13px;">you requested a password change</p>
    <p style="margin:0 0 16px;">Hi ${email},</p>
    <p style="margin:0 0 24px;">Click the button below to choose a new password for your ${appName} account. This link expires in <strong>1 hour</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#2d2d2d;box-shadow:3px 3px 0 0 #ff4d4d;border-radius:6px 10px 8px 6px;">
          <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;color:#fdfbf7;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.2px;">Reset password →</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="margin:0 0 16px;font-size:12px;color:#2d5da1;word-break:break-all;">${resetUrl}</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">If you didn't request this, ignore this email — your password won't change.</p>
  `
  return {
    subject: `Reset your ${appName} password`,
    html: layout('Password reset request', body)
  }
}

export { welcome, loginAlert, forgotPassword }
