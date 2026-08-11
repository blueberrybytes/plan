/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";

/**
 * CONTRACT test against a live Twenty instance.
 *
 * `fetchTwenty<T>` and `unwrap<T>` both cast blindly (`as T`), so TypeScript
 * gives us zero protection if Twenty's response shape changes — the code would
 * silently read `undefined` and push half-built notes into a client's CRM.
 * This test pins the exact keys the service depends on.
 *
 * Run it after upgrading the customer's Twenty instance. See README.md.
 */

const TW_URL = (process.env.TW_URL ?? "").replace(/\/$/, "");
const TW_KEY = process.env.TW_KEY ?? "";
const skip = !TW_URL || !TW_KEY;

const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${TW_URL}/rest${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TW_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return { status: res.status, body: (await res.json()) as Record<string, any> };
};

describe.skipIf(skip)("Twenty API contract", () => {
  it("GET /companies — data.companies[] with the fields searchCompanies reads", async () => {
    const { status, body } = await api("/companies?limit=1");
    expect(status).toBe(200);
    expect(Array.isArray(body.data?.companies)).toBe(true);

    const row = body.data.companies[0];
    if (!row) return; // empty CRM is a valid state
    expect(typeof row.id).toBe("string");
    expect(typeof row.name).toBe("string");
    // domainName is an OBJECT, not a string — the service flattens
    // `.primaryLinkUrl`. If this ever becomes a string, that mapping breaks.
    expect(typeof row.domainName).toBe("object");
    expect(row.domainName).toHaveProperty("primaryLinkUrl");
  });

  it("GET /people — data.people[] with nested name/emails", async () => {
    const { status, body } = await api("/people?limit=1");
    expect(status).toBe(200);
    expect(Array.isArray(body.data?.people)).toBe(true);

    const row = body.data.people[0];
    if (!row) return;
    expect(typeof row.id).toBe("string");
    // Both are nested objects, not flat strings.
    expect(row.name).toHaveProperty("firstName");
    expect(row.name).toHaveProperty("lastName");
    expect(row.emails).toHaveProperty("primaryEmail");
    expect("companyId" in row).toBe(true);
  });

  it("filter syntax used by the service still parses", async () => {
    const ilike = await api(`/companies?filter=${encodeURIComponent("name[ilike]:%a%")}&limit=1`);
    expect(ilike.status).toBe(200);

    const or = await api(
      `/people?filter=${encodeURIComponent("or(name.firstName[ilike]:%a%,name.lastName[ilike]:%a%)")}&limit=1`,
    );
    expect(or.status).toBe(200);
  });

  it("POST /notes — accepts bodyV2.markdown and returns data.createNote.id", async () => {
    const { status, body } = await api("/notes", {
      method: "POST",
      body: JSON.stringify({
        title: "[contract test] delete me",
        bodyV2: { markdown: "## h2\n- bullet" },
      }),
    });
    expect(status).toBe(201);
    expect(typeof body.data?.createNote?.id).toBe("string");

    // Twenty converts markdown into its blocknote format server-side — that's
    // why we send markdown and never build blocknote ourselves.
    expect(body.data.createNote.bodyV2).toHaveProperty("blocknote");

    await api(`/notes/${body.data.createNote.id}`, { method: "DELETE" });
  });

  it("POST /noteTargets — requires targetCompanyId, NOT companyId", async () => {
    const note = await api("/notes", {
      method: "POST",
      body: JSON.stringify({ title: "[contract test] targets" }),
    });
    const noteId = note.body.data.createNote.id as string;

    const company = await api("/companies", {
      method: "POST",
      body: JSON.stringify({ name: "ZZ contract test (delete)" }),
    });
    const companyId = company.body.data.createCompany.id as string;

    try {
      // The shape that LOOKS right and is rejected — pinned so a future
      // refactor can't quietly reintroduce it.
      const wrong = await api("/noteTargets", {
        method: "POST",
        body: JSON.stringify({ noteId, companyId }),
      });
      expect(wrong.status).toBe(400);

      const right = await api("/noteTargets", {
        method: "POST",
        body: JSON.stringify({ noteId, targetCompanyId: companyId }),
      });
      expect(right.status).toBe(201);
      expect(right.body.data?.createNoteTarget).toBeTruthy();
    } finally {
      await api(`/notes/${noteId}`, { method: "DELETE" });
      await api(`/companies/${companyId}`, { method: "DELETE" });
    }
  });

  it("bad credentials fail with a structured 401 (what the connect flow surfaces)", async () => {
    const res = await fetch(`${TW_URL}/rest/companies?limit=1`, {
      headers: { Authorization: "Bearer definitely-not-valid" },
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { messages?: string[] };
    expect(Array.isArray(body.messages)).toBe(true);
  });
});
