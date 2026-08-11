import { Body, Get, Post, Request, Route, Security, Tags, Response, Query } from "tsoa";
import { BaseWorkspaceController } from "./BaseWorkspaceController";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import type { ApiResponse } from "./controllerTypes";
import prisma from "../prisma/prismaClient";
import { twentyIntegrationService } from "../services/twentyIntegrationService";
import type {
  TwentyManualConnectRequest,
  TwentySummaryResponse,
  TwentyCompanyItem,
  TwentyPersonItem,
  PushTranscriptToTwentyRequest,
  PushTranscriptToTwentyResponse,
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
    return { status: 200, data: await twentyIntegrationService.searchCompanies(workspaceId, q ?? "") };
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
      return { status: 200, data: result };
    } catch (error) {
      this.setStatus(400);
      return {
        status: 400,
        data: null,
        message: error instanceof Error ? error.message : "Failed to push the meeting to Twenty",
      };
    }
  }
}
