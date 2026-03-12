import config from '../config/index.js'

function layout(title, bodyHtml) {
  const appName = config.app.name
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} – ${appName}</title>
  <style>
    body { margin: 0; padding: 0; background: #f6f6f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .header { background: #111827; padding: 28px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .body { padding: 36px 40px; color: #374151; font-size: 15px; line-height: 1.6; }
    .body h2 { margin: 0 0 16px; font-size: 22px; color: #111827; }
    .body p { margin: 0 0 16px; }
    .btn { display: inline-block; margin: 8px 0 20px; padding: 12px 28px; background: #111827; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    .small { font-size: 13px; color: #9ca3af; }
    .footer { padding: 20px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>${appName}</h1></div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
  </div>
</body>
</html>`
}

/**
 * @param {{ email: string }} user
 */
function welcome({ email }) {
  const appName = config.app.name
  const body = `
    <h2>Welcome to ${appName}</h2>
    <p>Hi ${email},</p>
    <p>Your account has been created. You're all set to start building better habits and capturing your thoughts.</p>
    <p>Head to the app whenever you're ready — your journal and habit tracker are waiting.</p>
    <hr class="divider" />
    <p class="small">If you didn't create this account, you can safely ignore this email.</p>
  `
  return {
    subject: `Welcome to ${appName}`,
    html: layout(`Welcome to ${appName}`, body)
  }
}

/**
 * @param {{ email: string, timestamp?: Date }} opts
 */
function loginAlert({ email, timestamp }) {
  const appName = config.app.name
  const time = (timestamp || new Date()).toUTCString()
  const body = `
    <h2>New sign-in to your account</h2>
    <p>Hi ${email},</p>
    <p>We detected a new sign-in to your ${appName} account.</p>
    <table style="border-collapse:collapse;margin:8px 0 20px;font-size:14px;">
      <tr><td style="padding:6px 16px 6px 0;color:#6b7280;white-space:nowrap;">Time</td><td>${time}</td></tr>
      <tr><td style="padding:6px 16px 6px 0;color:#6b7280;">Account</td><td>${email}</td></tr>
    </table>
    <p>If this was you, no action is needed.</p>
    <hr class="divider" />
    <p class="small">If you don't recognise this sign-in, please reset your password immediately.</p>
  `
  return {
    subject: `New sign-in to your ${appName} account`,
    html: layout('New sign-in detected', body)
  }
}

/**
 * @param {{ email: string, resetUrl: string }} opts
 */
function forgotPassword({ email, resetUrl }) {
  const appName = config.app.name
  const expiryNote = 'This link expires in 1 hour.'
  const body = `
    <h2>Reset your password</h2>
    <p>Hi ${email},</p>
    <p>We received a request to reset the password for your ${appName} account. Click the button below to choose a new password.</p>
    <a class="btn" href="${resetUrl}">Reset password</a>
    <p class="small">${expiryNote}</p>
    <hr class="divider" />
    <p class="small">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p class="small" style="word-break:break-all;">${resetUrl}</p>
    <hr class="divider" />
    <p class="small">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
  `
  return {
    subject: `Reset your ${appName} password`,
    html: layout('Password reset request', body)
  }
}

export { welcome, loginAlert, forgotPassword }
