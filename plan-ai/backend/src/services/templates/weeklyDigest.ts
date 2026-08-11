import type { WeeklyDigestData } from "../weeklyDigestService";

const APP_URL = process.env.APP_URL || "https://plan-ai.blueberrybytes.com";

/** Escape user-controlled strings — meeting titles land straight in the HTML. */
const esc = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtDate = (d: Date | null): string =>
  d
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "—";

export interface WeeklyDigestEmailInput {
  userName: string | null;
  workspaceName: string;
  digest: WeeklyDigestData;
}

export function renderWeeklyDigestEmail(input: WeeklyDigestEmailInput): string {
  const { userName, workspaceName, digest } = input;
  const { meetings, openTasks, totalMeetingMinutes, overdueCount, weekStart, weekEnd } = digest;

  const greeting = userName ? `Hi ${esc(userName.split(" ")[0])},` : "Hi,";
  const range = `${fmtDate(weekStart)} – ${fmtDate(weekEnd)}`;

  const meetingRows = meetings
    .map((m) => {
      const points = m.keyPoints.length
        ? `<ul style="margin: 6px 0 0; padding-left: 18px; color: #94a3b8; font-size: 13px; line-height: 1.6;">
             ${m.keyPoints.map((p) => `<li>${esc(p)}</li>`).join("")}
           </ul>`
        : "";
      const project = m.projectTitle
        ? `<span style="color: #a78bfa; font-size: 12px;"> · ${esc(m.projectTitle)}</span>`
        : "";
      return `
        <div style="padding: 12px 0; border-bottom: 1px solid rgba(148,163,184,0.12);">
          <a href="${APP_URL}/recordings/${m.id}" style="color: #f8fafc; font-weight: 600; text-decoration: none; font-size: 14px;">
            ${esc(m.title)}
          </a>${project}
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">${fmtDate(m.recordedAt)}</div>
          ${points}
        </div>`;
    })
    .join("");

  const taskRows = openTasks.length
    ? openTasks
        .slice(0, 10)
        .map((task) => {
          const flag = task.isOverdue
            ? `<span style="color: #f87171; font-size: 12px; font-weight: 600;"> · overdue</span>`
            : task.dueDate
              ? `<span style="color: #64748b; font-size: 12px;"> · due ${fmtDate(task.dueDate)}</span>`
              : "";
          const project = task.projectTitle
            ? `<span style="color: #a78bfa; font-size: 12px;"> · ${esc(task.projectTitle)}</span>`
            : "";
          return `<li style="margin-bottom: 8px; color: #f8fafc; font-size: 14px;">${esc(task.title)}${project}${flag}</li>`;
        })
        .join("")
    : `<li style="color: #94a3b8; font-size: 14px;">Nothing outstanding. 🎉</li>`;

  const overdueBanner = overdueCount
    ? `<div style="background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
         <strong style="color: #f87171;">${overdueCount} item${overdueCount === 1 ? "" : "s"} past due</strong>
         <span style="color: #94a3b8;"> — worth a look before the week starts.</span>
       </div>`
    : "";

  return `
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; background: #0b0d11; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid rgba(167,139,250,0.2);">
      <div style="background: linear-gradient(135deg, #4361EE 0%, #a78bfa 100%); padding: 28px 32px;">
        <img src="${APP_URL}/logos/bbb.png" alt="Plan AI" style="display: block; margin: 0 0 12px; height: 28px; width: auto;" />
        <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Your week in meetings</h1>
        <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">${esc(workspaceName)} · ${range}</p>
      </div>

      <div style="padding: 28px 32px;">
        <p style="color: #94a3b8; line-height: 1.7; margin: 0 0 20px;">
          ${greeting} last week you had
          <strong style="color: #f8fafc;">${meetings.length} meeting${meetings.length === 1 ? "" : "s"}</strong>
          (${totalMeetingMinutes} min). Here's what came out of them.
        </p>

        ${overdueBanner}

        <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin: 0 0 4px;">Meetings</h2>
        ${meetingRows}

        <h2 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin: 28px 0 8px;">Still open</h2>
        <ul style="margin: 0; padding-left: 18px;">${taskRows}</ul>

        <a href="${APP_URL}/recordings" style="display: inline-block; margin-top: 28px; background: linear-gradient(135deg, #4361EE 0%, #a78bfa 100%); color: #fff; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 8px; font-size: 14px;">
          Open Plan AI
        </a>

        <p style="color: #475569; font-size: 12px; margin: 24px 0 0; line-height: 1.6;">
          You're getting this because weekly digests are on for your account.
          <a href="${APP_URL}/profile" style="color: #64748b;">Turn them off</a>.
        </p>
      </div>
    </div>
  `;
}
