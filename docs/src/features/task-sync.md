# Task Sync (Jira, Linear, Trello, Notion, Asana)

The primary "wedge" feature of Plan AI is automating the most tedious part of technical project management: writing and scoping tickets.

Rather than a TPM spending hours listening to a meeting recording and manually typing out acceptance criteria, Plan AI generates perfectly scoped tickets instantly.

## How it Works

When you finish a meeting, the transcript is automatically processed. From the Web Dashboard, you can navigate to the **Tasks** tab of your meeting.

By default, Plan AI will attempt to extract:
1.  **Bugs** mentioned during the call.
2.  **Feature Requests** or new requirements.
3.  **Action Items** assigned to specific people.

For each item, the AI generates a title, a description, and a set of technical acceptance criteria.

## Pushing to Issue Trackers

Once the tickets are generated, you can push them directly to your external issue tracker.

1.  Review the generated ticket in the Plan AI dashboard.
2.  Click the **Push** icon next to the ticket.
3.  Select your destination — Jira, Linear, Trello, Notion or Asana.
4.  The ticket will be created instantly in your backlog with the correct formatting.

*(Integrations must be configured by an Admin in the Workspace Settings before you can push tickets.)*

## Doing it automatically

You don't have to push ticket by ticket. On the save screen of the recorder and the mobile app there is a toggle per destination — tick the ones you want and everything the meeting produces is synced as soon as processing finishes.

The same screen controls the other post-meeting outputs: generating a document or slide deck, exporting to Google Drive or OneDrive, and [sending the meeting to your CRM](/features/crm-twenty).

## Knowing what actually happened

Every automatic step reports back on the meeting as a badge, so a sync that failed is visible rather than silently missing:

| Badge | Meaning |
| --- | --- |
| **Pending** | Queued or in flight |
| **OK** | Created, with a link to the result |
| **Skipped** | Not run, with the reason (for example, no CRM company was chosen) |
| **Failed** | It broke, with the error |

A step that was requested always ends up with a badge. If you asked for something and see nothing at all, that's a bug worth reporting — not a step that quietly decided not to run.

Failed steps can be retried individually from the meeting view; you don't have to reprocess the whole recording.

## Using Contexts for Perfect Scoping

Generic AI often generates terrible Jira tickets because it lacks understanding of your specific codebase. A generic ticket might say *"Add login button"*, which is useless to a developer.

Plan AI solves this using **Contexts**.

Before generating tickets, you can attach a "Context" to the meeting. A Context is a collection of:
*   Architecture documentation
*   API schemas
*   Previous meeting decisions

When the AI generates the ticket, it cross-references the meeting audio with your attached Context. Instead of *"Add login button"*, it will generate: *"Implement SSO login button in `SidebarLayout.tsx` using the existing `AuthContext` provider, ensuring the Firebase token is passed to the `POST /api/auth` endpoint."*

This turns a 5-minute manual task into a 1-second automated task.
