import { Body, Get, Post, Request, Route, Security, Tags, Response, Query } from "tsoa";
import { BaseWorkspaceController } from "./BaseWorkspaceController";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import type { ApiResponse } from "./controllerTypes";
import prisma from "../prisma/prismaClient";
import { Prisma } from "@prisma/client";
import { twentyIntegrationService } from "../services/twentyIntegrationService";
import { projectTranscriptService } from "../services/projectTranscriptService";
import type {
  TwentyManualConnectRequest,
  TwentySummaryResponse,
  TwentyCompanyItem,
  TwentyPersonItem,
  PushTranscriptToTwentyRequest,
  PushTranscriptToTwentyResponse,
  LinkProjectToTwentyCompanyRequest,
  ProjectTwentyLink,
} from "../services/twentyTypes";

@Route("api/twenty")
@Tags("Integrations")
export class TwentyController extends BaseWorkspaceController {
  @Post("manual-connect")
  @Security("ClientLevel")
  @Response<ApiResponse<null>>(400, "Validation Error")
  public async manualConnect(
    @Request() request: AuthenticatedRequest,
    @Body() body: TwentyManualConnectRequest,
  ): Promise<ApiResponse<null>> {
    const { workspaceId } = await this.requireAdminOrOwner(request);

    try {
      await twentyIntegrationService.verifyManualCredentials(workspaceId, body);
      return { status: 200, data: null };
    } catch (error) {
      this.setStatus(400);
      return {
        status: 400,
        data: null,
        message: error instanceof Error ? error.message : "Failed to connect to Twenty",
      };
    }
  }

  @Get("summary")
  @Security("ClientLevel")
  public async getSummary(
    @Request() request: AuthenticatedRequest,
  ): Promise<ApiResponse<TwentySummaryResponse>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);
    return { status: 200, data: await twentyIntegrationService.getSummary(workspaceId) };
  }

  @Get("companies")
  @Security("ClientLevel")
  public async searchCompanies(
    @Request() request: AuthenticatedRequest,
    @Query() q?: string,
  ): Promise<ApiResponse<TwentyCompanyItem[]>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);
    return {
      status: 200,
      data: await twentyIntegrationService.searchCompanies(workspaceId, q ?? ""),
    };
  }

  @Get("people")
  @Security("ClientLevel")
  public async searchPeople(
    @Request() request: AuthenticatedRequest,
    @Query() q?: string,
  ): Promise<ApiResponse<TwentyPersonItem[]>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);
    return { status: 200, data: await twentyIntegrationService.searchPeople(workspaceId, q ?? "") };
  }

  /**
   * Push a meeting into Twenty as a note linked to the company (and people).
   * Deduplicated server-side: if a teammate already pushed the same meeting,
   * this returns their note instead of creating a second one.
   */
  @Post("push-transcript")
  @Security("ClientLevel")
  @Response<ApiResponse<null>>(400, "Validation Error")
  @Response<ApiResponse<null>>(404, "Transcript not found")
  public async pushTranscript(
    @Request() request: AuthenticatedRequest,
    @Body() body: PushTranscriptToTwentyRequest,
  ): Promise<ApiResponse<PushTranscriptToTwentyResponse | null>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    if (!body.transcriptId || !body.companyId) {
      this.setStatus(400);
      return { status: 400, data: null, message: "transcriptId and companyId are required" };
    }

    // Scope by workspace — never trust the id coming from the client.
    const transcript = await prisma.transcript.findFirst({
      where: { id: body.transcriptId, workspaceId },
    });
    if (!transcript) {
      this.setStatus(404);
      return { status: 404, data: null, message: "Transcript not found" };
    }

    try {
      const result = await twentyIntegrationService.pushMeetingNote(workspaceId, transcript, {
        companyId: body.companyId,
        personIds: body.personIds,
        opportunityId: body.opportunityId,
        forceSeparateNote: body.forceSeparateNote,
      });

      // Record it where every other post-meeting step reports, so the
      // transcript view shows this push like any other. Best-effort: the note
      // already exists in the CRM, so a bookkeeping failure must not turn a
      // successful push into an error for the user.
      await projectTranscriptService
        .setPostMeetingTaskStatus(transcript.id, "twenty", {
          status: "OK",
          url: result.url,
        })
        .catch(() => undefined);

      return { status: 200, data: result };
    } catch (error) {
      await projectTranscriptService
        .setPostMeetingTaskStatus(transcript.id, "twenty", {
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        })
        .catch(() => undefined);

      this.setStatus(400);
      return {
        status: 400,
        data: null,
        message: error instanceof Error ? error.message : "Failed to push the meeting to Twenty",
      };
    }
  }

  /**
   * Links a project to a Twenty company so meetings recorded into it can be
   * pushed unattended (the "Send to Twenty" toggle in the recorder / mobile).
   */
  @Post("link-project")
  @Security("ClientLevel")
  @Response<ApiResponse<null>>(404, "Project not found")
  public async linkProject(
    @Request() request: AuthenticatedRequest,
    @Body() body: LinkProjectToTwentyCompanyRequest,
  ): Promise<ApiResponse<ProjectTwentyLink | null>> {
    const { workspaceId } = await this.getAuthorizedWorkspaceAccess(request);

    const project = await prisma.project.findFirst({
      where: { id: body.projectId, workspaceId },
      select: { id: true, metadata: true },
    });
    if (!project) {
      this.setStatus(404);
      return { status: 404, data: null, message: "Project not found" };
    }

    const metadata = ((project.metadata as Record<string, unknown> | null) ?? {}) as Record<
      string,
      unknown
    >;
    if (body.companyId) {
      metadata.twentyCompanyId = body.companyId;
      metadata.twentyCompanyName = body.companyName ?? null;
    } else {
      delete metadata.twentyCompanyId;
      delete metadata.twentyCompanyName;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { metadata: metadata as Prisma.InputJsonObject },
    });

    return {
      status: 200,
      data: {
        projectId: project.id,
        companyId: body.companyId,
        companyName: body.companyId ? (body.companyName ?? null) : null,
      },
    };
  }
}
