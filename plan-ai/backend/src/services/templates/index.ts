import { renderWorkspaceInvitationEmail } from "./workspaceInvitation";
import { renderTelegramLeadEmail } from "./telegramLead";
import { renderWeeklyDigestEmail } from "./weeklyDigest";

export { renderWorkspaceInvitationEmail, renderTelegramLeadEmail, renderWeeklyDigestEmail };

export function getAllEmailTemplates() {
  const now = new Date();
  const day = (offset: number) => new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);

  return [
    {
      id: "workspace_invitation",
      name: "Workspace Invitation",
      html: renderWorkspaceInvitationEmail("admin@plan.ai", "Jane Doe", "Acme Corp Workspace"),
    },
    {
      id: "telegram_lead",
      name: "Telegram Lead",
      html: renderTelegramLeadEmail({
        handle: "@cliente",
        chatId: "123456789",
        brief: "Quiero una app para que mis camareros tomen comandas y vayan directas a cocina.",
        transcriptId: "clx0000000000",
        viaVoice: true,
      }),
    },
    {
      id: "weekly_digest",
      name: "Weekly Digest",
      html: renderWeeklyDigestEmail({
        userName: "Xavier Mas",
        workspaceName: "BlueberryBytes",
        digest: {
          meetings: [
            {
              id: "clx1",
              title: "Kickoff Uriach — Impact Platform",
              projectTitle: "Uriach",
              recordedAt: day(5),
              durationSeconds: 3120,
              keyPoints: [
                "Se aprueba el alcance de la fase 1",
                "David pide integrar el CRM antes de octubre",
              ],
            },
            {
              id: "clx2",
              title: "Weekly interno",
              projectTitle: null,
              recordedAt: day(2),
              durationSeconds: 1800,
              keyPoints: ["Revisión de pipeline"],
            },
          ],
          totalMeetingMinutes: 82,
          openTasks: [
            {
              id: "t1",
              title: "Enviar propuesta de integración SMT",
              projectTitle: "Uriach",
              dueDate: day(1),
              isOverdue: true,
            },
            {
              id: "t2",
              title: "Preparar entorno de pruebas",
              projectTitle: "Uriach",
              dueDate: null,
              isOverdue: false,
            },
          ],
          overdueCount: 1,
          weekStart: day(10),
          weekEnd: day(3),
        },
      }),
    },
  ];
}
