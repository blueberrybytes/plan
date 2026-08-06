import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Speaker-name corrections are the user's ground truth over the AI's guess.
 * These tests lock the override semantics: apply by stable label, blank clears,
 * unknown labels never corrupt metadata, and the raw map persists so a
 * reprocess can re-apply human fixes over a fresh AI pass.
 */

const { db } = vi.hoisted(() => ({
  db: {
    transcript: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("../../prisma/prismaClient", () => ({ default: db }));

import { transcriptCrudService } from "../transcriptCrudService";

const baseTranscript = (metadata: Record<string, unknown>) => ({
  id: "t1",
  workspaceId: "ws-1",
  metadata,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.transcript.update.mockImplementation(({ data }: { data: { metadata: unknown } }) =>
    Promise.resolve({ id: "t1", metadata: data.metadata }),
  );
});

describe("updateSpeakerNamesForWorkspace", () => {
  it("applies a correction to the matching label and stores the override map", async () => {
    db.transcript.findFirst.mockResolvedValue(
      baseTranscript({
        speakers: [
          { label: "Speaker 0", identifiedName: "Naila" },
          { label: "Speaker 1", identifiedName: null },
        ],
      }),
    );

    await transcriptCrudService.updateSpeakerNamesForWorkspace("ws-1", "t1", {
      "Speaker 0": "Nayla",
    });

    const written = db.transcript.update.mock.calls[0][0].data.metadata as {
      speakers: { label: string; identifiedName: string | null }[];
      speakerNameOverrides: Record<string, string>;
    };
    expect(written.speakers[0].identifiedName).toBe("Nayla");
    expect(written.speakers[1].identifiedName).toBeNull();
    expect(written.speakerNameOverrides).toEqual({ "Speaker 0": "Nayla" });
  });

  it("clears the identification when the name is blank", async () => {
    db.transcript.findFirst.mockResolvedValue(
      baseTranscript({
        speakers: [{ label: "Speaker 0", identifiedName: "Wrong Guess" }],
        speakerNameOverrides: { "Speaker 0": "Wrong Guess" },
      }),
    );

    await transcriptCrudService.updateSpeakerNamesForWorkspace("ws-1", "t1", {
      "Speaker 0": "   ",
    });

    const written = db.transcript.update.mock.calls[0][0].data.metadata as {
      speakers: { identifiedName: string | null }[];
      speakerNameOverrides: Record<string, string>;
    };
    expect(written.speakers[0].identifiedName).toBeNull();
    expect(written.speakerNameOverrides).toEqual({});
  });

  it("ignores labels that do not exist instead of corrupting metadata", async () => {
    db.transcript.findFirst.mockResolvedValue(
      baseTranscript({ speakers: [{ label: "Speaker 0", identifiedName: null }] }),
    );

    await transcriptCrudService.updateSpeakerNamesForWorkspace("ws-1", "t1", {
      Ghost: "Nobody",
    });

    const written = db.transcript.update.mock.calls[0][0].data.metadata as {
      speakers: unknown[];
      speakerNameOverrides: Record<string, string>;
    };
    expect(written.speakers).toHaveLength(1);
    expect(written.speakerNameOverrides).toEqual({});
  });

  it("caps absurdly long names", async () => {
    db.transcript.findFirst.mockResolvedValue(
      baseTranscript({ speakers: [{ label: "Speaker 0", identifiedName: null }] }),
    );

    await transcriptCrudService.updateSpeakerNamesForWorkspace("ws-1", "t1", {
      "Speaker 0": "x".repeat(500),
    });

    const written = db.transcript.update.mock.calls[0][0].data.metadata as {
      speakers: { identifiedName: string }[];
    };
    expect(written.speakers[0].identifiedName).toHaveLength(80);
  });

  it("refuses a transcript outside the workspace (getTranscriptForWorkspace guard)", async () => {
    db.transcript.findFirst.mockResolvedValue(null);

    await expect(
      transcriptCrudService.updateSpeakerNamesForWorkspace("ws-1", "foreign", {
        "Speaker 0": "X",
      }),
    ).rejects.toBeTruthy();
    expect(db.transcript.update).not.toHaveBeenCalled();
  });
});
