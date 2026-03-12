import { Resend } from 'resend'
import config from '../config/index.js'

const resend = new Resend(config.email.resendApiKey)

const fromDomain = (() => {
  try {
    return new URL(config.app.baseUrl).hostname
  } catch {
    return 'localhost'
  }
})()

/**
 * @param {{ to: string, subject: string, html: string }} opts
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: config.email.emailFrom || `no-reply@${fromDomain}`,
      to,
      subject,
      html
    })
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}: ${err.message}`)
  }
}

export { sendEmail }
