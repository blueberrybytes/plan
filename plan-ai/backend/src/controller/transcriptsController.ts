import { BaseWorkspaceController } from "./BaseWorkspaceController";
import {
  Route,
  Tags,
  Security,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Path,
  Query,
  Request,
  FormField,
  UploadedFile,
} from "tsoa";
import { Prisma, Transcript, TranscriptSource } from "@prisma/client";
import prisma from "../prisma/prismaClient";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { type ApiResponse, type TsoaJsonObject, type LiveChatHistoryItem } from "./controllerTypes";
import {
  transcriptCrudService,
  type TranscriptListOptions,
} from "../services/transcriptCrudService";
import { type TaskWithRelations } from "../services/taskCrudService";
import { projectTranscriptService } from "../services/projectTranscriptService";
import { resolveProjectIdsToContextIds } from "../services/projectContextResolver";
import {
  mapTaskResponse,
  mapPainPointResponse,
  type TaskResponse,
  type PainPointResponse,
} from "./projectsModelController";
import { transcriptGenerationQueue } from "../queue/transcriptGenerationQueue";
import { firebaseAdmin } from "../firebase/firebaseAdmin";
import { DocDocumentResponse } from "./docController";
import { TranscriptMetadata, type PostMeetingTaskKind } from "../services/transcriptMetadataTypes";
import { logger } from "../utils/logger";

interface TranscriptContextSummary {
  id: string;
  name: string;
  color: string | null;
}

interface StandaloneTranscriptResponse {
  id: string;
  projectId: string | null;
  project?: {
    id: string;
    title: string;
  } | null;
  userId: string;
  title: string | null;
  source: TranscriptSource;
  language: string | null;
  summary: string | null;
  transcript: string | null;
  recordedAt: Date | null;
  metadata: TranscriptMetadata | null;
  durationSeconds?: number | null;
  speakerCount?: number | null;
  sentiment?: string | null;
  utterances?: TsoaJsonObject | null;
  createdAt: Date;
  updatedAt: Date;
  tasks?: TaskResponse[];
  /** AI-extracted pain points, ranked most-severe first. */
  painPoints?: PainPointResponse[];
  documents?: DocDocumentResponse[];
  /** IDs of contexts attached to this transcript. */
  contextIds: string[];
  /** Resolved context summaries (id + name + color). Empty when not enriched by the caller. */
  contexts: TranscriptContextSummary[];
  chatThread?: {
    id: string;
    title: string;
    messages: {
      role: "USER" | "ASSISTANT";
      content: string;
      createdAt: Date;
    }[];
  } | null;
}

interface StandaloneTranscriptListResponse {
  transcripts: StandaloneTranscriptResponse[];
  total: number;
}

interface CreateStandaloneTranscriptBody {
  projectId?: string | null;
  title?: string | null;
  source?: TranscriptSource;
  content?: string | null;
  language?: string | null;
  summary?: string | null;
  recordedAt?: Date | null;
  metadata?: TsoaJsonObject | null;
  contextIds?: string[];
  persona?: "SECRETARY" | "ARCHITECT" | "PRODUCT_MANAGER" | "DEVELOPER";
  objective?: string | null;
  complexityLevel?: string;
  chatHistory?: LiveChatHistoryItem[];
  modelKey?: string;
  syncToJira?: boolean;
  syncToLinear?: boolean;
  syncToTrello?: boolean;
  syncToNotion?: boolean;
  syncToAsana?: boolean;
  exportToGoogleDrive?: boolean;
  exportToOneDrive?: boolean;
  taskStrategy?: "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT";
  taskCount?: number;
  agenticInvestigation?: boolean;
  createDoc?: boolean;
  createSlides?: boolean;
}

interface UpdateStandaloneTranscriptBody {
  title?: string | null;
  source?: TranscriptSource;
  language?: string | null;
  summary?: string | null;
  transcript?: string | null;
  metadata?: TsoaJsonObject | null;
  recordedAt?: Date | null;
}

interface UpdateSpeakerNamesBody {
  /** Diarization label ("Speaker 0", "User 1") → corrected name. Blank name clears the identification. */
  overrides: Record<string, string>;
}

@Route("api/transcripts")
@Tags("Transcripts")
export class TranscriptsController extends BaseWorkspaceController {
  private mapTranscriptResponse(
    t: Transcript & {
      project?: { id: string; title: string } | null;
      contexts?: TranscriptContextSummary[];
    },
  ): StandaloneTranscriptResponse {
    return {
      id: t.id,
      projectId: t.projectId,
      project: t.project,
      userId: t.userId,
      title: t.title,
      source: t.source,
      language: t.language,
      summary: t.summary,
      transcript: t.transcript,
      recordedAt: t.recordedAt,
      metadata: t.metadata as unknown as TranscriptMetadata,
      durationSeconds: t.durationSeconds,
      speakerCount: t.speakerCount,
      sentiment: t.sentiment,
      utterances: t.utterances as TsoaJsonObject,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      contextIds: t.contextIds ?? [],
      contexts: t.contexts ?? [],
      // Present when the fetch included the relation (single-transcript GET).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      painPoints: ((t as any).painPoints ?? []).map((p: any) => mapPainPointResponse(p)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chatThread: (t as any).chatThread
        ? {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (t as any).chatThread.id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            title: (t as any).chatThread.title,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: (t as any).chatThread.messages.map((m: any) => ({
              role: m.role,
              content: m.content,
              createdAt: m.createdAt,
            })),
          }
        : null,
    };
  }

  /**
   * Batch-fetch context summaries (id, name, color) for every context referenced
   * by the supplied transcripts and return one resolved list per transcript.
   * Single SQL hit regardless of page size.
   */
  private async enrichTranscriptsWithContexts(
    workspaceId: string,
    transcripts: Transcript[],
  ): Promise<Map<string, TranscriptContextSummary[]>> {
    const allContextIds = Array.from(new Set(transcripts.flatMap((t) => t.contextIds ?? [])));
    if (allContextIds.length === 0) return new Map();

    const contexts = await prisma.context.findMany({
      where: { id: { in: allContextIds }, workspaceId },
      select: { id: true, name: true, color: true },
    });
    const byId = new Map(contexts.map((c) => [c.id, c]));

    const result = new Map<string, TranscriptContextSummary[]>();
    for (const t of transcripts) {
      const resolved = (t.contextIds ?? [])
        .map((id) => byId.get(id))
        .filter((c): c is TranscriptContextSummary => Boolean(c));
      result.set(t.id, resolved);
    }
    return result;
  }

  @Get()
  @Security("ClientLevel")
  public async listTranscripts(
    @Request() request: AuthenticatedRequest,
    @Query() page = 1,
    @Query() pageSize = 20,
    @Query() source?: TranscriptSource,
    @Query() q?: string,
    @Query() sentiment?: string,
    @Query() dateFilter?: string,
    @Query() sources?: string,
  ): Promise<ApiResponse<StandaloneTranscriptListResponse>> {
    const { user, workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    // Comma-separated multi-source filter, e.g. "RECORDING,TELEGRAM". Added
    // rather than making `source` an array so existing callers are untouched.
    // Unknown values are dropped instead of 400ing — a stale client asking for
    // a source we removed should get a narrower list, not an error.
    const parsedSources = sources
      ?.split(",")
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is TranscriptSource =>
        Object.values(TranscriptSource).includes(value as TranscriptSource),
      );

    const options: TranscriptListOptions = {
      workspaceId,
      page,
      pageSize,
      source,
      sources: parsedSources,
      query: q,
      sentiment,
      dateFilter,
    };

    const result = await transcriptCrudService.listTranscriptsForUser(user.id, options);
    const contextsByTranscript = await this.enrichTranscriptsWithContexts(
      workspaceId,
      result.transcripts,
    );

    return {
      status: 200,
      data: {
        transcripts: result.transcripts.map((t) =>
          this.mapTranscriptResponse({ ...t, contexts: contextsByTranscript.get(t.id) ?? [] }),
        ),
        total: result.total,
      },
    };
  }

  private async buildContextPrompt(userId: string, contextIds: string[]): Promise<string | null> {
    if (!contextIds || contextIds.length === 0) {
      return null;
    }

    const sanitizedIds = Array.from(
      new Set(contextIds.map((id) => id.trim()).filter((id): id is string => id.length > 0)),
    );

    if (sanitizedIds.length === 0) {
      return null;
    }

    const contexts = await prisma.context.findMany({
      where: {
        id: {
          in: sanitizedIds,
        },
        userId,
      },
      include: {
        files: {
          select: {
            id: true,
            fileName: true,
          },
        },
      },
    });

    if (contexts.length !== sanitizedIds.length) {
      this.setStatus(404);
      throw { status: 404, message: "One or more contexts were not found" };
    }

    const sections = contexts.map((context) => {
      const details: string[] = [];

      if (context.description) {
        details.push(`Description: ${context.description}`);
      }

      const fileNames = context.files
        .map((file) => file.fileName)
        .filter((name): name is string => Boolean(name));

      if (fileNames.length > 0) {
        const limited = fileNames.slice(0, 5).join(", ");
        details.push(`Files: ${limited}`);
      }

      const detailsText = details.length > 0 ? ` - ${details.join(" | ")}` : "";
      return `• ${context.name}${detailsText}`;
    });

    return `Use the following context when analyzing the transcript:\n${sections.join("\n")}`;
  }

  @Post("recorder-upload")
  @Security("ClientLevel")
  public async createTranscriptFromRecording(
    @Request() request: AuthenticatedRequest,
    @FormField() source?: TranscriptSource,
    @FormField() content?: string,
    @FormField() title?: string,
    @FormField() recordedAt?: string,
    @FormField() projectId?: string,
    @FormField() contextIds?: string,
    @FormField() chatHistory?: string,
    @FormField() modelKey?: string,
    @FormField() complexityLevel?: string,
    @FormField() syncToJira?: string,
    @FormField() syncToLinear?: string,
    @FormField() syncToTrello?: string,
    @FormField() syncToNotion?: string,
    @FormField() syncToAsana?: string,
    @FormField() exportToGoogleDrive?: string,
    @FormField() exportToOneDrive?: string,
    @FormField() skipAi?: string,
    @FormField() taskStrategy?: "AUTO" | "SINGLE_TICKET" | "SPECIFIC_COUNT",
    @FormField() taskCount?: string,
    @FormField() agenticInvestigation?: string,
    @FormField() location?: string,
    @FormField() createDoc?: string,
    @FormField() createSlides?: string,
    @FormField() language?: string,
    @FormField() aecTelemetry?: string,
    @UploadedFile("micFile") micFile?: Express.Multer.File,
    @UploadedFile("sysFile") sysFile?: Express.Multer.File,
  ): Promise<ApiResponse<StandaloneTranscriptResponse>> {
    const { user, workspaceId } = await this.getPaidLlmAccess(request);

    console.log(`[Upload Debug] POST /api/transcripts/recorder-upload hit by user ${user.id}`);
    console.log(
      `[Upload Debug] micFile present? ${!!micFile} (size: ${micFile?.size}, name: ${micFile?.originalname})`,
    );
    console.log(
      `[Upload Debug] sysFile present? ${!!sysFile} (size: ${sysFile?.size}, name: ${sysFile?.originalname})`,
    );

    // Parse JSON arrays which arrived as strings in formData
    let contextIdsArray: string[] = contextIds ? JSON.parse(contextIds) : [];
    const chatHistoryArray = chatHistory ? JSON.parse(chatHistory) : [];
    const locationObj = location ? JSON.parse(location) : undefined;

    // Transcription language the user picked in the recorder ("ca", "es",
    // "pt-BR", …). Validated so an arbitrary string can never reach the ASR
    // call; stored in metadata so batch re-diarization (and any reprocess)
    // honours the choice instead of falling back to "multi".
    const recordingLanguage =
      language && /^[a-z]{2,3}(-[A-Za-z0-9]{2,10})?$/i.test(language) ? language : undefined;

    // Echo-canceller outcome reported by the recorder (previously console-only):
    // records per-recording whether the uploaded mic was cleaned, skipped
    // (cap/headphones) or rejected — the key diagnostic for echoey meetings.
    // Diagnostics must never block an upload, so parse failures are ignored.
    let recorderAec: Prisma.JsonObject | undefined;
    if (aecTelemetry && aecTelemetry.length <= 2048) {
      try {
        const parsed = JSON.parse(aecTelemetry);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          recorderAec = parsed as Prisma.JsonObject;
        }
      } catch {
        /* malformed telemetry — ignore */
      }
    }

    // If the client only sent a projectId (mobile / recorder after the Context
    // refactor), auto-derive the project's paired contextId so AI generation,
    // RAG queries, and downstream chat see the project's files.
    if (contextIdsArray.length === 0 && projectId) {
      contextIdsArray = await resolveProjectIdsToContextIds([projectId]);
    }

    // Optional Firebase Upload logic inline (if files exist)
    let rawMicUrl: string | undefined;
    let rawSysUrl: string | undefined;

    if (micFile || sysFile) {
      const bucket = firebaseAdmin.storage().bucket();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

      if (micFile) {
        if (micFile.buffer.length > 44) {
          const riff = micFile.buffer.toString("utf8", 0, 4);
          const sizeHex = micFile.buffer.readUInt32LE(4);
          if (riff === "RIFF" && sizeHex === 0xffffffff) {
            const dataSize = micFile.buffer.length - 44;
            micFile.buffer.writeUInt32LE(dataSize + 36, 4);
            micFile.buffer.writeUInt32LE(dataSize, 40);
            console.log(`[Upload Debug] Patched micFile WAV header. Data Size: ${dataSize}`);
          }
        }

        const ext = micFile.originalname.split(".").pop() || "webm";
        const fileRef = bucket.file(`transcripts/${user.id}/${uniqueSuffix}-mic.${ext}`);
        await fileRef.save(micFile.buffer, { contentType: micFile.mimetype });
        await fileRef.makePublic();
        rawMicUrl = fileRef.publicUrl();
      }

      if (sysFile) {
        if (sysFile.buffer.length > 44) {
          const riff = sysFile.buffer.toString("utf8", 0, 4);
          const sizeHex = sysFile.buffer.readUInt32LE(4);
          if (riff === "RIFF" && sizeHex === 0xffffffff) {
            const dataSize = sysFile.buffer.length - 44;
            sysFile.buffer.writeUInt32LE(dataSize + 36, 4);
            sysFile.buffer.writeUInt32LE(dataSize, 40);
            console.log(`[Upload Debug] Patched sysFile WAV header. Data Size: ${dataSize}`);
          }
        }

        const ext = sysFile.originalname.split(".").pop() || "webm";
        const fileRef = bucket.file(`transcripts/${user.id}/${uniqueSuffix}-sys.${ext}`);
        await fileRef.save(sysFile.buffer, { contentType: sysFile.mimetype });
        await fileRef.makePublic();
        rawSysUrl = fileRef.publicUrl();
      }
    }

    const contextPrompt = await this.buildContextPrompt(user.id, contextIdsArray);

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, userId: user.id, workspaceId },
      });
      if (!project) throw { status: 404, message: "Project not found or unauthorized." };
    }

    const generationOptions = {
      contextIds: contextIdsArray,
      persona: undefined,
      complexityLevel: complexityLevel || undefined,
      modelKey: modelKey || undefined,
      syncToJira: syncToJira === "true",
      syncToLinear: syncToLinear === "true",
      syncToTrello: syncToTrello === "true",
      syncToNotion: syncToNotion === "true",
      syncToAsana: syncToAsana === "true",
      exportToGoogleDrive: exportToGoogleDrive === "true",
      exportToOneDrive: exportToOneDrive === "true",
      taskStrategy,
      taskCount: taskCount ? parseInt(taskCount, 10) : undefined,
      contextPrompt: contextPrompt ?? undefined,
      agenticInvestigation: agenticInvestigation === "true",
      createDoc: createDoc === "true",
      createSlides: createSlides === "true",
    };

    // Save initial metadata and live content fallback
    const transcript = await prisma.transcript.create({
      data: {
        userId: user.id,
        workspaceId,
        projectId: projectId ?? null,
        title: title ?? "Generating Transcript...",
        source: source ?? TranscriptSource.RECORDING,
        language: null,
        summary: null,
        transcript: content ?? "Processing...",
        recordedAt: recordedAt ? new Date(recordedAt) : null,
        rawMicUrl,
        rawSysUrl,
        contextIds: contextIdsArray,
        metadata: {
          processingStatus: skipAi === "true" ? "DONE" : "PENDING",
          ...(locationObj ? { location: locationObj } : {}),
          ...(recordingLanguage ? { recordingLanguage } : {}),
          ...(recorderAec ? { recorderAec } : {}),
          generationOptions,
        } as Prisma.JsonObject,
      },
    });

    if (skipAi !== "true") {
      await transcriptGenerationQueue.add("generate-transcript", {
        transcriptId: transcript.id,
        workspaceId,
        projectId: projectId || undefined,
        userId: user.id,
        content: content ?? "",
        source: source ?? TranscriptSource.RECORDING,
        ...generationOptions,
      });
    }

    if (chatHistoryArray.length > 0) {
      await prisma.chatThread.create({
        data: {
          transcriptId: transcript.id,
          title: "Live Recording Assistant",
          userId: user.id,
          workspaceId,
          messages: {
            create: chatHistoryArray.map((msg: { role: string; content: string }) => ({
              role: msg.role === "user" ? "USER" : "ASSISTANT",
              content: msg.content,
              createdAt: new Date(),
            })),
          },
        },
      });
    }

    // Reuse map function from standard POST
    return {
      status: 200,
      data: this.mapTranscriptResponse(transcript),
    };
  }

  @Post()
  @Security("ClientLevel")
  public async createTranscript(
    @Request() request: AuthenticatedRequest,
    @Body() body: CreateStandaloneTranscriptBody,
  ): Promise<ApiResponse<StandaloneTranscriptResponse>> {
    try {
      const { user, workspaceId } = await this.getPaidLlmAccess(request);

      let transcript: Transcript;

      if (!body.content) {
        // Empty transcript (just metadata creation)
        const transcriptInput = {
          ...body,
          workspaceId,
          metadata: body.metadata as Prisma.InputJsonValue | undefined,
        };
        transcript = await transcriptCrudService.createTranscriptForUser(user.id, transcriptInput);
      } else {
        const contextPrompt = await this.buildContextPrompt(user.id, body.contextIds ?? []);

        if (body.projectId) {
          // Security check: ensure user has access to this project
          const project = await prisma.project.findUnique({
            where: { id: body.projectId, userId: user.id, workspaceId },
          });

          if (!project) {
            this.setStatus(404);
            throw { status: 404, message: "Project not found or unauthorized to attach." };
          }
        }

        const generationOptions = {
          contextIds: body.contextIds,
          persona: body.persona,
          objective: body.objective ?? undefined,
          complexityLevel: body.complexityLevel ?? undefined,
          modelKey: body.modelKey ?? undefined,
          syncToJira: body.syncToJira,
          syncToLinear: body.syncToLinear,
          syncToTrello: body.syncToTrello,
          syncToNotion: body.syncToNotion,
          syncToAsana: body.syncToAsana,
          exportToGoogleDrive: body.exportToGoogleDrive,
          exportToOneDrive: body.exportToOneDrive,
          taskStrategy: body.taskStrategy,
          taskCount: body.taskCount,
          agenticInvestigation: body.agenticInvestigation,
          createDoc: body.createDoc,
          createSlides: body.createSlides,
          contextPrompt: contextPrompt ?? undefined,
        };

        const pendingResult = await projectTranscriptService.createPendingTranscript({
          projectId: body.projectId || "",
          userId: user.id,
          workspaceId,
          content: body.content,
          title: body.title ?? undefined,
          source: body.source ?? TranscriptSource.MANUAL,
          recordedAt: body.recordedAt ?? null,
          contextIds: body.contextIds,
          metadata: {
            ...((body.metadata as Record<string, unknown>) || {}),
            generationOptions,
          } as Prisma.InputJsonValue,
        });

        transcript = pendingResult.transcript;

        // Push to BullMQ Worker. Use resolved contextIds from transcript row.
        await transcriptGenerationQueue.add("generate-transcript", {
          transcriptId: transcript.id,
          workspaceId,
          projectId: body.projectId || undefined,
          userId: user.id,
          content: body.content,
          source: body.source ?? TranscriptSource.MANUAL,
          ...generationOptions,
          contextIds: transcript.contextIds,
        });

        // Save Chat History for both Standalone and Project-linked transcripts
        if (body.chatHistory && body.chatHistory.length > 0) {
          await prisma.chatThread.create({
            data: {
              userId: user.id,
              workspaceId,
              title: transcript.title || "Live Meeting Chat",
              transcriptId: transcript.id,
              contextIds: transcript.contextIds,
              messages: {
                create: body.chatHistory.map((m) => ({
                  role: m.role.toUpperCase() as "USER" | "ASSISTANT",
                  content: m.content,
                })),
              },
            },
          });
        }

        this.setStatus(202);
        return {
          status: 202,
          data: this.mapTranscriptResponse(transcript),
        };
      }

      this.setStatus(201);
      return {
        status: 201,
        data: this.mapTranscriptResponse(transcript),
      };
    } catch (error) {
      console.error("[ERROR] Failed to create transcript:", error);
      throw error;
    }
  }

  @Get("{id}")
  @Security("ClientLevel")
  public async getTranscript(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
  ): Promise<ApiResponse<StandaloneTranscriptResponse>> {
    const { user, workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    const transcript = await transcriptCrudService.getTranscriptForWorkspace(workspaceId, id);

    const rawTasks = await prisma.task.findMany({
      where: {
        transcriptLinks: {
          some: { transcriptId: id },
        },
        project: { userId: user.id, workspaceId },
      },
      include: {
        dependants: {
          select: { dependsOnTaskId: true },
        },
      },
      take: 200,
    });

    const mappedTasks = rawTasks.map((t) => mapTaskResponse(t as unknown as TaskWithRelations));

    const rawDocuments = await prisma.docDocument.findMany({
      where: {
        transcriptIds: {
          has: id,
        },
        workspaceId,
      },
      include: { theme: true },
      take: 50,
    });

    return {
      status: 200,
      data: {
        ...this.mapTranscriptResponse(transcript),
        tasks: mappedTasks,
        documents: rawDocuments as unknown as DocDocumentResponse[],
      },
    };
  }

  @Put("{id}")
  @Security("ClientLevel")
  public async updateTranscript(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() body: UpdateStandaloneTranscriptBody,
  ): Promise<ApiResponse<StandaloneTranscriptResponse>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    const updateInput = {
      ...body,
      metadata: body.metadata as Prisma.InputJsonValue | undefined,
    };
    const transcript = await transcriptCrudService.updateTranscriptForWorkspace(
      workspaceId,
      id,
      updateInput,
    );

    return {
      status: 200,
      data: this.mapTranscriptResponse(transcript),
    };
  }

  /**
   * Corrects AI-inferred speaker names. Body maps the stable diarization label
   * ("Speaker 0", "User 1") to the corrected human name; blank clears it. The
   * fix lands in metadata.speakers (what every app renders) and survives
   * reprocessing via metadata.speakerNameOverrides.
   */
  @Put("{id}/speakers")
  @Security("ClientLevel")
  public async updateTranscriptSpeakers(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Body() body: UpdateSpeakerNamesBody,
  ): Promise<ApiResponse<StandaloneTranscriptResponse>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    const transcript = await transcriptCrudService.updateSpeakerNamesForWorkspace(
      workspaceId,
      id,
      body.overrides ?? {},
    );

    return {
      status: 200,
      data: this.mapTranscriptResponse(transcript),
    };
  }

  @Post("{id}/reprocess")
  @Security("ClientLevel")
  public async reprocessTranscript(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
  ): Promise<ApiResponse<StandaloneTranscriptResponse>> {
    const { user, workspaceId } = await this.getPaidLlmAccess(request);

    const existing = await transcriptCrudService.getTranscriptForWorkspace(workspaceId, id);

    if (!existing) {
      this.setStatus(404);
      throw { status: 404, message: "Transcript not found" };
    }

    const currentStatus = (existing.metadata as Record<string, unknown>)?.processingStatus as
      | string
      | undefined;
    if (currentStatus === "PENDING" || currentStatus === "PROCESSING") {
      this.setStatus(409);
      throw { status: 409, message: "Transcript is already being processed" };
    }

    // Reset status to PENDING so the UI reflects it immediately
    const newMetadata = { ...(existing.metadata as Record<string, unknown>) };
    newMetadata.processingStatus = "PENDING";
    delete newMetadata.postMeetingTasks;
    delete newMetadata.errorMessage;

    const updated = await prisma.transcript.update({
      where: { id },
      data: {
        summary: null,
        sentiment: null,
        metadata: newMetadata as Prisma.JsonObject,
      },
    });

    // Extract saved generation options if any
    const metadata = (existing.metadata as Record<string, unknown>) || {};
    const generationOptions = (metadata.generationOptions as Record<string, unknown>) || {};

    // Re-enqueue into the generation worker
    await transcriptGenerationQueue.add("generate-transcript", {
      transcriptId: id,
      workspaceId,
      projectId: existing.projectId ?? undefined,
      userId: user.id,
      content: existing.transcript ?? "",
      source: existing.source,
      ...generationOptions,
    });

    return {
      status: 200,
      data: this.mapTranscriptResponse(updated),
    };
  }

  /**
   * Retry a single failed post-meeting task (Jira sync, Google Drive export,
   * doc generation, etc.) without rerunning the entire transcript pipeline.
   * Returns immediately; the caller observes the status transition via
   * `metadata.postMeetingTasks.{kind}` on the next transcript poll.
   */
  @Post("{id}/post-meeting-tasks/{kind}/retry")
  @Security("ClientLevel")
  public async retryPostMeetingTask(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
    @Path() kind: PostMeetingTaskKind,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const { user, workspaceId } = await this.getPaidLlmAccess(request);

    const existing = await transcriptCrudService.getTranscriptForWorkspace(workspaceId, id);
    if (!existing) {
      this.setStatus(404);
      throw { status: 404, message: "Transcript not found" };
    }

    try {
      await projectTranscriptService.retryPostMeetingTask(workspaceId, user.id, id, kind);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "ALREADY_PENDING") {
        this.setStatus(409);
        throw { status: 409, message: "This post-meeting task is already in progress" };
      }
      logger.error(
        `[retryPostMeetingTask] dispatch failed for transcript ${id}, kind=${kind}`,
        err,
      );
      this.setStatus(500);
      throw { status: 500, message: msg };
    }

    return { status: 200, data: { success: true } };
  }

  @Delete("{id}")
  @Security("ClientLevel")
  public async deleteTranscript(
    @Request() request: AuthenticatedRequest,
    @Path() id: string,
  ): Promise<ApiResponse<{ success: boolean }>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    await transcriptCrudService.deleteTranscriptForWorkspace(workspaceId, id);

    return {
      status: 200,
      data: { success: true },
    };
  }
}
