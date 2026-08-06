import { Prisma, Transcript, TranscriptSource } from "@prisma/client";
import prisma from "../prisma/prismaClient";

export interface TranscriptListResult {
  transcripts: (Transcript & { project?: { id: string; title: string } | null })[];
  total: number;
}

export interface TranscriptListOptions {
  projectId?: string;
  source?: TranscriptSource;
  /** Multi-source filter. Takes precedence over `source` when non-empty. */
  sources?: TranscriptSource[];
  query?: string;
  page?: number;
  pageSize?: number;
  workspaceId: string;
  sentiment?: string;
  dateFilter?: string;
}

export interface CreateTranscriptInput {
  projectId?: string | null;
  title?: string | null;
  source?: TranscriptSource;
  content?: string | null;
  language?: string | null;
  summary?: string | null;
  recordedAt?: Date | null;
  metadata?: Prisma.InputJsonValue | null;
  modelKey?: string;
  workspaceId: string;
}

export interface UpdateTranscriptInput {
  title?: string | null;
  source?: TranscriptSource;
  language?: string | null;
  summary?: string | null;
  transcript?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  recordedAt?: Date | null;
}

export class TranscriptCrudService {
  public async createTranscriptForUser(
    userId: string,
    input: CreateTranscriptInput,
  ): Promise<Transcript> {
    if (input.projectId) {
      await this.assertProjectBelongsToWorkspace(input.workspaceId, input.projectId);
    }

    return prisma.transcript.create({
      data: {
        userId,
        workspaceId: input.workspaceId,
        projectId: input.projectId ?? null,
        title: input.title ?? null,
        source: input.source ?? TranscriptSource.MANUAL,
        transcript: input.content ?? null,
        language: input.language ?? null,
        summary: input.summary ?? null,
        recordedAt: input.recordedAt ?? null,
        metadata:
          typeof input.metadata === "undefined"
            ? undefined
            : input.metadata === null
              ? Prisma.JsonNull
              : input.metadata,
      },
    });
  }

  public async listTranscriptsForUser(
    userId: string,
    options: TranscriptListOptions,
  ): Promise<TranscriptListResult> {
    const page = Math.max(options.page ?? 1, 1);
    const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const andConditions: Prisma.TranscriptWhereInput[] = [];

    if (options.query && options.query.trim().length > 0) {
      andConditions.push({
        OR: [
          { title: { contains: options.query, mode: "insensitive" } },
          { summary: { contains: options.query, mode: "insensitive" } },
        ],
      });
    }

    if (options.dateFilter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      andConditions.push({
        createdAt: { gte: startOfDay },
      });
    } else if (options.dateFilter === "week") {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      andConditions.push({
        createdAt: { gte: lastWeek },
      });
    }

    const where: Prisma.TranscriptWhereInput = {
      workspaceId: options.workspaceId,
      ...(options.projectId !== undefined ? { projectId: options.projectId } : {}),
      // `sources` (plural) wins when supplied. Kept separate from `source` so
      // existing single-source callers keep their exact behaviour.
      ...(options.sources?.length
        ? { source: { in: options.sources } }
        : options.source
          ? { source: options.source }
          : {}),
      ...(options.sentiment && options.sentiment !== "all_sentiments"
        ? { sentiment: options.sentiment }
        : {}),
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
    };

    const [transcripts, total] = await Promise.all([
      prisma.transcript.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          project: { select: { id: true, title: true } },
        },
      }),
      prisma.transcript.count({ where }),
    ]);

    return { transcripts, total };
  }

  public async getTranscriptForWorkspace(
    workspaceId: string,
    transcriptId: string,
  ): Promise<Transcript> {
    const transcript = await prisma.transcript.findFirst({
      where: {
        id: transcriptId,
        workspaceId,
      },
      include: {
        chatThread: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
        // Ranked most-severe first (position mirrors the LLM's severity ranking).
        painPoints: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!transcript) {
      throw { status: 404, message: "Transcript not found" };
    }

    return transcript;
  }

  public async updateTranscriptForWorkspace(
    workspaceId: string,
    transcriptId: string,
    data: UpdateTranscriptInput,
  ): Promise<Transcript> {
    await this.getTranscriptForWorkspace(workspaceId, transcriptId);

    const updateData: Prisma.TranscriptUpdateInput = {};

    if (typeof data.title !== "undefined") {
      updateData.title = data.title;
    }

    if (typeof data.source !== "undefined") {
      updateData.source = data.source;
    }

    if (typeof data.language !== "undefined") {
      updateData.language = data.language;
    }

    if (typeof data.summary !== "undefined") {
      updateData.summary = data.summary;
    }

    if (typeof data.transcript !== "undefined") {
      updateData.transcript = data.transcript;
    }

    if (typeof data.recordedAt !== "undefined") {
      updateData.recordedAt = data.recordedAt ?? null;
    }

    if (typeof data.metadata !== "undefined") {
      updateData.metadata = data.metadata === null ? Prisma.JsonNull : data.metadata;
    }

    return prisma.transcript.update({
      where: { id: transcriptId },
      data: updateData,
    });
  }

  /**
   * Corrects the AI-inferred speaker names of a transcript. `overrides` maps the
   * stable diarization label ("Speaker 0", "User 1") to the human-corrected
   * name; an empty/blank name clears the identification back to null.
   *
   * The correction is applied directly to `metadata.speakers[].identifiedName`
   * (the single source every UI and the doc-generation prompt read), and the raw
   * map is kept in `metadata.speakerNameOverrides` so reprocessing can re-apply
   * user corrections over a fresh AI pass.
   */
  public async updateSpeakerNamesForWorkspace(
    workspaceId: string,
    transcriptId: string,
    overrides: Record<string, string>,
  ): Promise<Transcript> {
    const transcript = await this.getTranscriptForWorkspace(workspaceId, transcriptId);

    const metadata = ((transcript.metadata as Record<string, unknown>) ?? {}) as {
      speakers?: { label: string; identifiedName: string | null }[];
      speakerNameOverrides?: Record<string, string>;
    } & Record<string, unknown>;

    const insights = metadata.speakers ?? [];
    const cleaned: Record<string, string> = { ...(metadata.speakerNameOverrides ?? {}) };

    for (const [label, rawName] of Object.entries(overrides)) {
      const name = (rawName ?? "").trim().slice(0, 80);
      const insight = insights.find((s) => s.label === label);
      if (!insight) continue; // unknown label — ignore rather than corrupt
      insight.identifiedName = name || null;
      if (name) cleaned[label] = name;
      else delete cleaned[label];
    }

    metadata.speakers = insights;
    metadata.speakerNameOverrides = cleaned;

    return prisma.transcript.update({
      where: { id: transcriptId },
      data: { metadata: metadata as Prisma.InputJsonObject },
    });
  }

  public async deleteTranscriptForWorkspace(
    workspaceId: string,
    transcriptId: string,
  ): Promise<void> {
    await this.getTranscriptForWorkspace(workspaceId, transcriptId);
    await prisma.transcript.delete({ where: { id: transcriptId } });
  }

  private async assertProjectBelongsToWorkspace(workspaceId: string, projectId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      select: { id: true },
    });

    if (!project) {
      throw { status: 404, message: "Project not found" };
    }
  }
}

export const transcriptCrudService = new TranscriptCrudService();
