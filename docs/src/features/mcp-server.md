# MCP Server

Plan AI exposes your workspace as an [MCP](https://modelcontextprotocol.io) server, so an AI coding assistant — Claude Code, Claude Desktop, Cursor — can read your meetings, projects and tasks directly while you work.

The point is the question you can finally ask in your editor: *"what did the client actually ask for in Tuesday's call?"* — answered from the real transcript, without leaving the terminal or hunting for the meeting.

## What the assistant can do

Thirteen tools, scoped to a single workspace:

| Meetings | Projects & tasks | Search |
| --- | --- | --- |
| `get_recent_meetings` | `get_projects` | `search_meetings` |
| `get_meeting_detail` | `get_project_detail` | `search_tasks` |
| | `get_tasks` | `semantic_search` |
| | `get_task_detail` | |
| | `create_task` | |
| | `update_task` | |
| | `list_workspace_members` | |
| | `generate_document` | |

`semantic_search` is the interesting one: it searches a project's knowledge base by meaning rather than keyword, so "the thing we decided about billing" finds the right discussion even when nobody used the word "billing".

Note that `create_task` and `update_task` **write**. A token is enough to modify your workspace — treat it like a password.

## Creating a token

Open **Settings → Integrations → MCP** and create a token, giving it a name you'll recognise later (`Claude Code — MacBook`).

The full token is shown **once**, at creation. If you lose it, revoke it and make a new one — there's no way to read it back.

## Connecting

The server speaks **Streamable HTTP** at `/mcp`. Most clients connect to it natively; no bridge, no extra package.

### Claude Code

```bash
claude mcp add --transport http --scope user plan-ai https://api.plan-ai.blueberrybytes.com/mcp --header "Authorization: Bearer YOUR_TOKEN"
```

### Any client with a config file

Add this to the `mcpServers` block of `~/.claude.json` (or your client's equivalent):

```json
"plan-ai": {
  "type": "http",
  "url": "https://api.plan-ai.blueberrybytes.com/mcp",
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN"
  }
}
```

### Clients that can't do remote MCP

Some clients still need a local bridge process. Point it at the same `/mcp` endpoint:

```json
"plan-ai": {
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote",
    "https://api.plan-ai.blueberrybytes.com/mcp",
    "--header",
    "Authorization:${AUTH_HEADER}"
  ],
  "env": {
    "AUTH_HEADER": "Bearer YOUR_TOKEN"
  }
}
```

The token goes in `AUTH_HEADER` rather than inline because some clients mangle argument values containing spaces, and a `Bearer xxx` written directly into `args` can arrive broken — which shows up as an authentication failure with no obvious cause.

::: tip Prefer the native connection
The bridge is a fallback. It runs as a child process over stdio, and stdio does **not** reconnect on its own: after a backend deploy the connection drops and stays down until you restart the client. The native HTTP transport retries with backoff and recovers by itself.
:::

## Self-hosting

Replace the host with your own backend. The endpoint path is the same:

```
https://your-backend.example.com/mcp
```

::: warning Legacy SSE endpoint
`/mcp/sse` is still served so clients connected before the switch keep working, but SSE is deprecated upstream and new connections should use `/mcp`. Documentation or config still pointing at `/mcp/sse` is out of date.
:::

## Security

Tokens are workspace-scoped: a token can only reach the workspace it was created in, and only the data that workspace already contains.

Revoke a token from the same settings page — it stops working immediately. Revoke and recreate whenever a machine is lost or a token has been pasted somewhere it shouldn't have been.
