import {
  renderWorkspaceInvitationEmail,
  renderTelegramLeadEmail,
  renderWeeklyDigestEmail,
} from "./templates";
import type { TelegramLeadEmailInput } from "./templates/telegramLead";
import type { WeeklyDigestEmailInput } from "./templates/weeklyDigest";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Plan AI <noreply@plan-ai.blueberrybytes.com>";

export async function sendWorkspaceInvitationEmail(
  to: string,
  inviterEmail: string,
  workspaceName: string,
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(`[EMAIL] RESEND_API_KEY not set. Skipping invitation email to ${to}`);
    return;
  }

  const html = renderWorkspaceInvitationEmail(to, inviterEmail, workspaceName);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `You've been invited to join ${workspaceName} on Plan AI`,
      html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`[EMAIL] Resend API error ${response.status}: ${body}`);
    throw new Error(`Failed to send invitation email: ${response.status}`);
  }

  console.log(`[EMAIL] Invitation sent to ${to} for workspace "${workspaceName}"`);
}

/**
 * Alerts the sales team that a prospect asked Berry for a proposal.
 *
 * Without this the bot delivers its "wow" and nobody follows up — a lead that
 * arrives at 3am is worth nothing if the first human sees it three days later.
 *
 * Never throws: the prospect has already been served, so a mail failure must not
 * bubble into the intake flow and turn a delivered proposal into an error.
 */
export async function sendTelegramLeadEmail(input: TelegramLeadEmailInput): Promise<void> {
  const to = process.env.TELEGRAM_LEAD_NOTIFY_EMAIL;

  if (!RESEND_API_KEY || !to) {
    console.warn(
      "[EMAIL] Lead notification skipped (RESEND_API_KEY or TELEGRAM_LEAD_NOTIFY_EMAIL unset)",
    );
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: to
          .split(",")
          .map((address) => address.trim())
          .filter(Boolean),
        subject: `Nuevo lead en Telegram — ${input.handle}`,
        html: renderTelegramLeadEmail(input),
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[EMAIL] Lead notification failed ${response.status}: ${body}`);
      return;
    }

    console.log(`[EMAIL] Lead notification sent for ${input.handle}`);
  } catch (err) {
    console.error("[EMAIL] Lead notification threw", err);
  }
}

/**
 * Monday-morning weekly digest. Throws on failure so the caller
 * (`runWeeklyDigest`) can count it as failed and log which user it was —
 * the batch keeps going regardless.
 */
export async function sendWeeklyDigestEmail(
  to: string,
  input: WeeklyDigestEmailInput,
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(`[EMAIL] RESEND_API_KEY not set. Skipping weekly digest to ${to}`);
    return;
  }

  const count = input.digest.meetings.length;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `Your week: ${count} meeting${count === 1 ? "" : "s"} in ${input.workspaceName}`,
      html: renderWeeklyDigestEmail(input),
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Weekly digest email failed ${response.status}: ${body}`);
  }
}
