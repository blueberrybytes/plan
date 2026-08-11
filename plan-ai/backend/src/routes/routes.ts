/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VersionController } from './../controller/versionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../controller/userController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TwentyController } from './../controller/twentyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TrelloController } from './../controller/trelloController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProjectsModelController } from './../controller/projectsModelController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DocController } from './../controller/docController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TranscriptsController } from './../controller/transcriptsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TelegramController } from './../controller/telegramController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { TaskIntegrationController } from './../controller/taskIntegrationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SlideTemplateController } from './../controller/slideTemplateController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SessionController } from './../controller/sessionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SentryTestController } from './../controller/sentryTestController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PublicPrototypeController } from './../controller/publicPrototypeController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PublicPresentationController } from './../controller/publicPresentationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PublicDocController } from './../controller/publicDocController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProxyController } from './../controller/proxyController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PresentationController } from './../controller/presentationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OnboardingController } from './../controller/onboardingController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NotionController } from './../controller/notionController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MicrosoftController } from './../controller/microsoftController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LinearController } from './../controller/linearController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { JiraController } from './../controller/jiraController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { IntegrationController } from './../controller/integrationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthckeckController } from './../controller/healthcheckController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GoogleController } from './../controller/googleController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GithubIntegrationController } from './../controller/githubIntegrationController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContextController } from './../controller/contextController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ChatController } from './../controller/chatController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BrandThemeController } from './../controller/brandThemeController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { BillingController } from './../controller/billingController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AudioController } from './../controller/audioController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AsanaController } from './../controller/asanaController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AnalyticsController } from './../controller/analyticsController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AiUsageController } from './../controller/aiUsageController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AiController } from './../controller/aiController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AdminEmailController } from './../controller/adminEmailController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AccountController } from './../controller/accountController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { WorkspaceController } from './../controller/WorkspaceController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { McpTokenController } from './../controller/McpTokenController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DiagramController } from './../controller/DiagramController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PublicDiagramController } from './../controller/DiagramController';
import { expressAuthentication } from './../middleware/authMiddleware';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');


const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "VersionInfo": {
        "dataType": "refObject",
        "properties": {
            "version": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_VersionInfo_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"VersionInfo"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenericResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.Role": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ADMIN"]},{"dataType":"enum","enums":["PREMIUM"]},{"dataType":"enum","enums":["CLIENT"]},{"dataType":"enum","enums":["PENDING"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Role": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.Role","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserDetailResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "firebaseUid": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "avatarUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "role": {"ref":"Role","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "lastSignInAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserDetailResponse-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"UserDetailResponse"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserDetailResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"UserDetailResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserRoleRequest": {
        "dataType": "refObject",
        "properties": {
            "role": {"ref":"Role","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserOrphanResponse": {
        "dataType": "refObject",
        "properties": {
            "firebaseUid": {"dataType":"string","required":true},
            "email": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "creationTime": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserOrphanResponse-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"UserOrphanResponse"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SyncOrphanRequest": {
        "dataType": "refObject",
        "properties": {
            "firebaseUid": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_null_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":[null]},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TwentyManualConnectRequest": {
        "dataType": "refObject",
        "properties": {
            "baseUrl": {"dataType":"string","required":true},
            "apiKey": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TwentySummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "connected": {"dataType":"boolean","required":true},
            "baseUrl": {"dataType":"string"},
            "workspaceName": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TwentySummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TwentySummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TwentyCompanyItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "domainName": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TwentyCompanyItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"TwentyCompanyItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TwentyPersonItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "email": {"dataType":"string"},
            "companyId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TwentyPersonItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"TwentyPersonItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TwentyPushOutcome": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["CREATED"]},{"dataType":"enum","enums":["ALREADY_PUSHED"]},{"dataType":"enum","enums":["DEDUPED"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PushTranscriptToTwentyResponse": {
        "dataType": "refObject",
        "properties": {
            "outcome": {"ref":"TwentyPushOutcome","required":true},
            "noteId": {"dataType":"string","required":true},
            "url": {"dataType":"string"},
            "canonicalTranscriptId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PushTranscriptToTwentyResponse-or-null_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"PushTranscriptToTwentyResponse"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PushTranscriptToTwentyRequest": {
        "dataType": "refObject",
        "properties": {
            "transcriptId": {"dataType":"string","required":true},
            "companyId": {"dataType":"string","required":true},
            "personIds": {"dataType":"array","array":{"dataType":"string"}},
            "opportunityId": {"dataType":"string"},
            "forceSeparateNote": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TrelloManualConnectRequest": {
        "dataType": "refObject",
        "properties": {
            "apiKey": {"dataType":"string","required":true},
            "token": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__authorizationUrl-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"authorizationUrl":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TrelloSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "totalBoards": {"dataType":"double","required":true},
            "latestBoards": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TrelloSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TrelloSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TrelloBoardItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TrelloBoardItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"TrelloBoardItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TrelloListItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TrelloListItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"TrelloListItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetDefaultTrelloBoardListRequest": {
        "dataType": "refObject",
        "properties": {
            "boardId": {"dataType":"string","required":true},
            "listId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ProjectStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ACTIVE"]},{"dataType":"enum","enums":["COMPLETED"]},{"dataType":"enum","enums":["ARCHIVED"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProjectStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ProjectStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TsoaJsonObject": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"}},{"dataType":"array","array":{"dataType":"any"}},{"dataType":"string"},{"dataType":"double"},{"dataType":"boolean"},{"dataType":"enum","enums":[null]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProjectResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"ref":"ProjectStatus","required":true},
            "startedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "endedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "contextId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "hasFiles": {"dataType":"boolean","required":true},
            "fileCount": {"dataType":"double","required":true},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProjectListResponse": {
        "dataType": "refObject",
        "properties": {
            "projects": {"dataType":"array","array":{"dataType":"refObject","ref":"ProjectResponse"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ProjectListResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"ProjectListResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.TranscriptSource": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["MANUAL"]},{"dataType":"enum","enums":["RECORDING"]},{"dataType":"enum","enums":["UPLOAD"]},{"dataType":"enum","enums":["IMPORTED"]},{"dataType":"enum","enums":["TELEGRAM"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptSource": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.TranscriptSource","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.PainPointSeverity": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["BLOCKER"]},{"dataType":"enum","enums":["HIGH"]},{"dataType":"enum","enums":["MEDIUM"]},{"dataType":"enum","enums":["LOW"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PainPointSeverity": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.PainPointSeverity","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.PainPointStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["RAISED"]},{"dataType":"enum","enums":["BEING_ADDRESSED"]},{"dataType":"enum","enums":["RESOLVED_IN_MEETING"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PainPointStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.PainPointStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PainPointResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "transcriptId": {"dataType":"string","required":true},
            "problem": {"dataType":"string","required":true},
            "affected": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "severity": {"ref":"PainPointSeverity","required":true},
            "status": {"ref":"PainPointStatus","required":true},
            "evidence": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "suggestedResolution": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "resolutionTaskId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "projectId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "userId": {"dataType":"string","required":true},
            "title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "source": {"ref":"TranscriptSource","required":true},
            "language": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "transcript": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "painPoints": {"dataType":"array","array":{"dataType":"refObject","ref":"PainPointResponse"}},
            "chatThread": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"messages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"content":{"dataType":"string","required":true},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USER"]},{"dataType":"enum","enums":["ASSISTANT"]}],"required":true}}},"required":true},"title":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.TaskStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["COMPLETED"]},{"dataType":"enum","enums":["ARCHIVED"]},{"dataType":"enum","enums":["BACKLOG"]},{"dataType":"enum","enums":["IN_PROGRESS"]},{"dataType":"enum","enums":["BLOCKED"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.TaskStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.TaskPriority": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["HIGH"]},{"dataType":"enum","enums":["MEDIUM"]},{"dataType":"enum","enums":["LOW"]},{"dataType":"enum","enums":["URGENT"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskPriority": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.TaskPriority","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "projectId": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "acceptanceCriteria": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"ref":"TaskStatus","required":true},
            "priority": {"ref":"TaskPriority","required":true},
            "dueDate": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "dependencies": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptTaskInsight": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "priority": {"ref":"TaskPriority"},
            "status": {"ref":"TaskStatus"},
            "dueDate": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptAnalysisResponse": {
        "dataType": "refObject",
        "properties": {
            "chainOfThought": {"dataType":"string"},
            "language": {"dataType":"string","required":true},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "tasks": {"dataType":"array","array":{"dataType":"refObject","ref":"TranscriptTaskInsight"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTranscriptResponse": {
        "dataType": "refObject",
        "properties": {
            "transcript": {"ref":"TranscriptResponse","required":true},
            "tasks": {"dataType":"array","array":{"dataType":"refObject","ref":"TaskResponse"},"required":true},
            "analysis": {"ref":"TranscriptAnalysisResponse","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CreateTranscriptResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"CreateTranscriptResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptListResponse": {
        "dataType": "refObject",
        "properties": {
            "transcripts": {"dataType":"array","array":{"dataType":"refObject","ref":"TranscriptResponse"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TranscriptListResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TranscriptListResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImportTranscriptRequest": {
        "dataType": "refObject",
        "properties": {
            "transcriptId": {"dataType":"string","required":true},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "persona": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["SECRETARY"]},{"dataType":"enum","enums":["ARCHITECT"]},{"dataType":"enum","enums":["PRODUCT_MANAGER"]},{"dataType":"enum","enums":["DEVELOPER"]}]},
            "objective": {"dataType":"string"},
            "complexityLevel": {"dataType":"string"},
            "modelKey": {"dataType":"string"},
            "taskStrategy": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["AUTO"]},{"dataType":"enum","enums":["SINGLE_TICKET"]},{"dataType":"enum","enums":["SPECIFIC_COUNT"]}]},
            "taskCount": {"dataType":"double"},
            "syncToJira": {"dataType":"boolean"},
            "syncToLinear": {"dataType":"boolean"},
            "syncToTrello": {"dataType":"boolean"},
            "agenticInvestigation": {"dataType":"boolean"},
            "createDoc": {"dataType":"boolean"},
            "createSlides": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TranscriptResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TranscriptResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PainPointResponse-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"PainPointResponse"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConvertPainPointResponse": {
        "dataType": "refObject",
        "properties": {
            "painPoint": {"ref":"PainPointResponse","required":true},
            "task": {"ref":"TaskResponse","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ConvertPainPointResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"ConvertPainPointResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ManualTranscriptRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "source": {"ref":"TranscriptSource"},
            "language": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTranscriptRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "source": {"ref":"TranscriptSource"},
            "language": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "transcript": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "modelKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskListResponse": {
        "dataType": "refObject",
        "properties": {
            "tasks": {"dataType":"array","array":{"dataType":"refObject","ref":"TaskResponse"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TaskListResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TaskListResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TaskResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TaskResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.TaskType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["TASK"]},{"dataType":"enum","enums":["BUG"]},{"dataType":"enum","enums":["STORY"]},{"dataType":"enum","enums":["EPIC"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskType": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.TaskType","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTaskRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "acceptanceCriteria": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "status": {"ref":"TaskStatus"},
            "priority": {"ref":"TaskPriority"},
            "type": {"ref":"TaskType"},
            "dueDate": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "dependencyTaskIds": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTaskRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "acceptanceCriteria": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "status": {"ref":"TaskStatus"},
            "priority": {"ref":"TaskPriority"},
            "type": {"ref":"TaskType"},
            "dueDate": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "dependencyTaskIds": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefineTaskResponse": {
        "dataType": "refObject",
        "properties": {
            "refinedTitle": {"dataType":"string","required":true},
            "structuredDescription": {"dataType":"string","required":true},
            "acceptanceCriteria": {"dataType":"string"},
            "storyPoints": {"dataType":"double"},
            "estimatedMinutes": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_RefineTaskResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"RefineTaskResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefineTaskRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "acceptanceCriteria": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "type": {"ref":"TaskType","required":true},
            "priority": {"ref":"TaskPriority","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ProjectResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"ProjectResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProjectRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "status": {"ref":"ProjectStatus"},
            "startedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProjectRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "status": {"ref":"ProjectStatus"},
            "startedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "endedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__digestDocId-string--title-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"title":{"dataType":"string","required":true},"digestDocId":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTranscriptRequest": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"string"},
            "objective": {"dataType":"string"},
            "title": {"dataType":"string"},
            "source": {"ref":"TranscriptSource"},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "persona": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["SECRETARY"]},{"dataType":"enum","enums":["ARCHITECT"]},{"dataType":"enum","enums":["PRODUCT_MANAGER"]},{"dataType":"enum","enums":["DEVELOPER"]}]},
            "complexityLevel": {"dataType":"string"},
            "modelKey": {"dataType":"string"},
            "taskStrategy": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["AUTO"]},{"dataType":"enum","enums":["SINGLE_TICKET"]},{"dataType":"enum","enums":["SPECIFIC_COUNT"]}]},
            "taskCount": {"dataType":"double"},
            "agenticInvestigation": {"dataType":"boolean"},
            "createDoc": {"dataType":"boolean"},
            "createSlides": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BrandThemeSummary": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "primaryColor": {"dataType":"string","required":true},
            "secondaryColor": {"dataType":"string","required":true},
            "backgroundColor": {"dataType":"string","required":true},
            "textColor": {"dataType":"string","required":true},
            "headingFont": {"dataType":"string","required":true},
            "bodyFont": {"dataType":"string","required":true},
            "backgroundStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "cardStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DocDocumentResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "status": {"dataType":"string","required":true},
            "isPublic": {"dataType":"boolean","required":true},
            "contextIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "transcriptIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "prompt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "theme": {"dataType":"union","subSchemas":[{"ref":"BrandThemeSummary"},{"dataType":"enum","enums":[null]}],"required":true},
            "projectId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "project": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"title":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDocInput": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "prompt": {"dataType":"string"},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "transcriptIds": {"dataType":"array","array":{"dataType":"string"}},
            "themeId": {"dataType":"string"},
            "isBlank": {"dataType":"boolean"},
            "projectId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDocInput": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "content": {"dataType":"string"},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "isPublic": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SpeakerInsight": {
        "dataType": "refObject",
        "properties": {
            "label": {"dataType":"string","required":true},
            "identifiedName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "role": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "isPrincipalSpeaker": {"dataType":"boolean","required":true},
            "summary": {"dataType":"string","required":true},
            "keyQuotes": {"dataType":"array","array":{"dataType":"string"}},
            "sentiment": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["POSITIVE"]},{"dataType":"enum","enums":["NEUTRAL"]},{"dataType":"enum","enums":["NEGATIVE"]},{"dataType":"enum","enums":["MIXED"]}]},
            "speakingTimeSeconds": {"dataType":"double","required":true},
            "utteranceCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostMeetingTaskStatus": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["PENDING"]},{"dataType":"enum","enums":["OK"]},{"dataType":"enum","enums":["FAILED"]},{"dataType":"enum","enums":["SKIPPED"]}],"required":true},
            "error": {"dataType":"string"},
            "finishedAt": {"dataType":"string"},
            "count": {"dataType":"double"},
            "url": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_Record_PostMeetingTaskKind.PostMeetingTaskStatus__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"jira":{"ref":"PostMeetingTaskStatus"},"linear":{"ref":"PostMeetingTaskStatus"},"trello":{"ref":"PostMeetingTaskStatus"},"notion":{"ref":"PostMeetingTaskStatus"},"asana":{"ref":"PostMeetingTaskStatus"},"googleDrive":{"ref":"PostMeetingTaskStatus"},"oneDrive":{"ref":"PostMeetingTaskStatus"},"doc":{"ref":"PostMeetingTaskStatus"},"slides":{"ref":"PostMeetingTaskStatus"},"twenty":{"ref":"PostMeetingTaskStatus"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostMeetingTasksRecord": {
        "dataType": "refAlias",
        "type": {"ref":"Partial_Record_PostMeetingTaskKind.PostMeetingTaskStatus__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TwentyNoteRef": {
        "dataType": "refObject",
        "properties": {
            "noteId": {"dataType":"string","required":true},
            "url": {"dataType":"string"},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["CANONICAL"]},{"dataType":"enum","enums":["SECONDARY"]}],"required":true},
            "canonicalTranscriptId": {"dataType":"string"},
            "syncedAt": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RecordingWindow": {
        "dataType": "refObject",
        "properties": {
            "startedAt": {"dataType":"string","required":true},
            "wallClockSeconds": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptMetadata": {
        "dataType": "refObject",
        "properties": {
            "processingStatus": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["PENDING"]},{"dataType":"enum","enums":["PROCESSING"]},{"dataType":"enum","enums":["EXTRACTING_TASKS"]},{"dataType":"enum","enums":["REFINING_TASKS"]},{"dataType":"enum","enums":["COMPLETED"]},{"dataType":"enum","enums":["FAILED"]},{"dataType":"enum","enums":["DONE"]}]},
            "errorMessage": {"dataType":"string"},
            "sentimentExplanation": {"dataType":"string"},
            "keyPoints": {"dataType":"array","array":{"dataType":"string"}},
            "location": {"dataType":"nestedObjectLiteral","nestedProperties":{"accuracy":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},"longitude":{"dataType":"double","required":true},"latitude":{"dataType":"double","required":true}}},
            "rawTasks": {"dataType":"array","array":{"dataType":"any"}},
            "principalSpeaker": {"dataType":"string"},
            "speakers": {"dataType":"array","array":{"dataType":"refObject","ref":"SpeakerInsight"}},
            "speakerNameOverrides": {"ref":"Record_string.string_"},
            "postMeetingTasks": {"ref":"PostMeetingTasksRecord"},
            "twenty": {"ref":"TwentyNoteRef"},
            "recording": {"ref":"RecordingWindow"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TranscriptContextSummary": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "color": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StandaloneTranscriptResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "projectId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "project": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"title":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}]},
            "userId": {"dataType":"string","required":true},
            "title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "source": {"ref":"TranscriptSource","required":true},
            "language": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "transcript": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TranscriptMetadata"},{"dataType":"enum","enums":[null]}],"required":true},
            "durationSeconds": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "speakerCount": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "sentiment": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "utterances": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "tasks": {"dataType":"array","array":{"dataType":"refObject","ref":"TaskResponse"}},
            "painPoints": {"dataType":"array","array":{"dataType":"refObject","ref":"PainPointResponse"}},
            "documents": {"dataType":"array","array":{"dataType":"refObject","ref":"DocDocumentResponse"}},
            "contextIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "contexts": {"dataType":"array","array":{"dataType":"refObject","ref":"TranscriptContextSummary"},"required":true},
            "chatThread": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"messages":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"content":{"dataType":"string","required":true},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USER"]},{"dataType":"enum","enums":["ASSISTANT"]}],"required":true}}},"required":true},"title":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "StandaloneTranscriptListResponse": {
        "dataType": "refObject",
        "properties": {
            "transcripts": {"dataType":"array","array":{"dataType":"refObject","ref":"StandaloneTranscriptResponse"},"required":true},
            "total": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_StandaloneTranscriptListResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"StandaloneTranscriptListResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_StandaloneTranscriptResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"StandaloneTranscriptResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LiveChatHistoryItem": {
        "dataType": "refObject",
        "properties": {
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["assistant"]}],"required":true},
            "content": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateStandaloneTranscriptBody": {
        "dataType": "refObject",
        "properties": {
            "projectId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "source": {"ref":"TranscriptSource"},
            "content": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "language": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "persona": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["SECRETARY"]},{"dataType":"enum","enums":["ARCHITECT"]},{"dataType":"enum","enums":["PRODUCT_MANAGER"]},{"dataType":"enum","enums":["DEVELOPER"]}]},
            "objective": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "complexityLevel": {"dataType":"string"},
            "chatHistory": {"dataType":"array","array":{"dataType":"refObject","ref":"LiveChatHistoryItem"}},
            "modelKey": {"dataType":"string"},
            "syncToJira": {"dataType":"boolean"},
            "syncToLinear": {"dataType":"boolean"},
            "syncToTrello": {"dataType":"boolean"},
            "syncToNotion": {"dataType":"boolean"},
            "syncToAsana": {"dataType":"boolean"},
            "exportToGoogleDrive": {"dataType":"boolean"},
            "exportToOneDrive": {"dataType":"boolean"},
            "taskStrategy": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["AUTO"]},{"dataType":"enum","enums":["SINGLE_TICKET"]},{"dataType":"enum","enums":["SPECIFIC_COUNT"]}]},
            "taskCount": {"dataType":"double"},
            "agenticInvestigation": {"dataType":"boolean"},
            "createDoc": {"dataType":"boolean"},
            "createSlides": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateStandaloneTranscriptBody": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "source": {"ref":"TranscriptSource"},
            "language": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "summary": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "transcript": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
            "recordedAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateSpeakerNamesBody": {
        "dataType": "refObject",
        "properties": {
            "overrides": {"ref":"Record_string.string_","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__success-boolean__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"success":{"dataType":"boolean","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PostMeetingTaskKind": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["jira"]},{"dataType":"enum","enums":["linear"]},{"dataType":"enum","enums":["trello"]},{"dataType":"enum","enums":["notion"]},{"dataType":"enum","enums":["asana"]},{"dataType":"enum","enums":["googleDrive"]},{"dataType":"enum","enums":["oneDrive"]},{"dataType":"enum","enums":["doc"]},{"dataType":"enum","enums":["slides"]},{"dataType":"enum","enums":["twenty"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskCategory": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["engineering"]},{"dataType":"enum","enums":["design"]},{"dataType":"enum","enums":["support"]},{"dataType":"enum","enums":["ops"]},{"dataType":"enum","enums":["research"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TaskMetadata": {
        "dataType": "refObject",
        "properties": {
            "jira": {"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"issueKey":{"dataType":"string","required":true},"issueId":{"dataType":"string","required":true}}},
            "linear": {"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"identifier":{"dataType":"string","required":true},"issueId":{"dataType":"string","required":true}}},
            "trello": {"dataType":"nestedObjectLiteral","nestedProperties":{"shortLink":{"dataType":"string","required":true},"url":{"dataType":"string","required":true},"cardId":{"dataType":"string","required":true}}},
            "notion": {"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"pageId":{"dataType":"string","required":true}}},
            "asana": {"dataType":"nestedObjectLiteral","nestedProperties":{"url":{"dataType":"string","required":true},"taskGid":{"dataType":"string","required":true}}},
            "publicDocUrl": {"dataType":"string"},
            "publicSlidesUrl": {"dataType":"string"},
            "category": {"ref":"TaskCategory"},
            "acceptanceCriteriaList": {"dataType":"array","array":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_TaskMetadata_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"TaskMetadata"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SyncTaskResponse": {
        "dataType": "refObject",
        "properties": {
            "success": {"dataType":"boolean","required":true},
            "externalIssueId": {"dataType":"string","required":true},
            "externalIssueKey": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SyncTaskResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"SyncTaskResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SyncTaskRequest": {
        "dataType": "refObject",
        "properties": {
            "targetTeamId": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__pushed-number--skipped-number--errors-string-Array__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"errors":{"dataType":"array","array":{"dataType":"string"},"required":true},"skipped":{"dataType":"double","required":true},"pushed":{"dataType":"double","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SlideTypeConfigResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "templateId": {"dataType":"string","required":true},
            "slideTypeKey": {"dataType":"string","required":true},
            "displayName": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "parametersSchema": {"ref":"TsoaJsonObject","required":true},
            "position": {"dataType":"double","required":true},
            "createdAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SlideTemplateResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "slideTypes": {"dataType":"array","array":{"dataType":"refObject","ref":"SlideTypeConfigResponse"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SlideTypeConfigBody": {
        "dataType": "refObject",
        "properties": {
            "slideTypeKey": {"dataType":"string","required":true},
            "displayName": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "parametersSchema": {"ref":"TsoaJsonObject","required":true},
            "position": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTemplateRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"string"},
            "logoUrl": {"dataType":"string"},
            "slideTypes": {"dataType":"array","array":{"dataType":"refObject","ref":"SlideTypeConfigBody"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateTemplateRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "description": {"dataType":"string"},
            "logoUrl": {"dataType":"string"},
            "slideTypes": {"dataType":"array","array":{"dataType":"refObject","ref":"SlideTypeConfigBody"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "firebaseUid": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "avatarUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "googleId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "appleId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "microsoftId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "isGoogleAccount": {"dataType":"boolean","required":true},
            "isAppleAccount": {"dataType":"boolean","required":true},
            "isMicrosoftAccount": {"dataType":"boolean","required":true},
            "role": {"ref":"Role","required":true},
            "hasCompletedOnboarding": {"dataType":"boolean","required":true},
            "hasCompletedHomeTour": {"dataType":"boolean","required":true},
            "hasVoiceProfile": {"dataType":"boolean","required":true},
            "voiceProfileUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_UserResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"UserResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__code-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"code":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__customToken-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"customToken":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PublicPrototypeResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "variant": {"dataType":"string","required":true},
            "html": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultSelection_Prisma._36_BrandThemePayload_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"workspaceId":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"cardStyle":{"dataType":"string","required":true},"backgroundStyle":{"dataType":"string","required":true},"textColor":{"dataType":"string","required":true},"backgroundColor":{"dataType":"string","required":true},"secondaryColor":{"dataType":"string","required":true},"primaryColor":{"dataType":"string","required":true},"bodyFont":{"dataType":"string","required":true},"headingFont":{"dataType":"string","required":true},"logoUrl":{"dataType":"string","required":true},"userId":{"dataType":"string","required":true},"id":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BrandTheme": {
        "dataType": "refAlias",
        "type": {"ref":"DefaultSelection_Prisma._36_BrandThemePayload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PublicPresentationResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "templateId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "theme": {"dataType":"union","subSchemas":[{"ref":"BrandTheme"},{"dataType":"enum","enums":[null]}],"required":true},
            "title": {"dataType":"string","required":true},
            "slidesJson": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "contextIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "status": {"dataType":"string","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PublicBrandTheme": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "primaryColor": {"dataType":"string","required":true},
            "secondaryColor": {"dataType":"string","required":true},
            "backgroundColor": {"dataType":"string","required":true},
            "textColor": {"dataType":"string","required":true},
            "headingFont": {"dataType":"string","required":true},
            "bodyFont": {"dataType":"string","required":true},
            "backgroundStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "cardStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PublicDocResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "theme": {"dataType":"union","subSchemas":[{"ref":"PublicBrandTheme"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProxyImageResponse": {
        "dataType": "refObject",
        "properties": {
            "mimeType": {"dataType":"string","required":true},
            "base64": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TemplateSubset": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ThemeSubset": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "primaryColor": {"dataType":"string","required":true},
            "secondaryColor": {"dataType":"string","required":true},
            "backgroundColor": {"dataType":"string","required":true},
            "textColor": {"dataType":"string","required":true},
            "headingFont": {"dataType":"string","required":true},
            "bodyFont": {"dataType":"string","required":true},
            "backgroundStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "cardStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PresentationResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "templateId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "template": {"ref":"TemplateSubset"},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "theme": {"ref":"ThemeSubset"},
            "title": {"dataType":"string","required":true},
            "prompt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "slidesJson": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "contextIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "status": {"dataType":"string","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GeneratePresentationRequest": {
        "dataType": "refObject",
        "properties": {
            "templateId": {"dataType":"string"},
            "themeId": {"dataType":"string"},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "transcriptIds": {"dataType":"array","array":{"dataType":"string"}},
            "prompt": {"dataType":"string","required":true},
            "title": {"dataType":"string"},
            "numSlides": {"dataType":"double"},
            "modelKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GenerateSingleSlideRequest": {
        "dataType": "refObject",
        "properties": {
            "prompt": {"dataType":"string","required":true},
            "position": {"dataType":"double","required":true},
            "slideTypeKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePresentationRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "status": {"dataType":"string"},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "slidesJson": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdatePresentationStatusRequest": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__success-boolean--role-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"role":{"dataType":"string","required":true},"success":{"dataType":"boolean","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Record_string.unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"any"},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CustomThemePayload": {
        "dataType": "refObject",
        "properties": {
            "primaryColor": {"dataType":"string"},
            "secondaryColor": {"dataType":"string"},
            "backgroundColor": {"dataType":"string"},
            "surfaceColor": {"dataType":"string"},
            "textPrimaryColor": {"dataType":"string"},
            "textSecondaryColor": {"dataType":"string"},
            "fontFamily": {"dataType":"string"},
            "headingFontFamily": {"dataType":"string"},
            "borderRadius": {"dataType":"double"},
            "configJson": {"ref":"Record_string.unknown_"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BrandThemePayload": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "headingFont": {"dataType":"string","required":true},
            "bodyFont": {"dataType":"string","required":true},
            "primaryColor": {"dataType":"string","required":true},
            "secondaryColor": {"dataType":"string","required":true},
            "backgroundColor": {"dataType":"string","required":true},
            "textColor": {"dataType":"string","required":true},
            "backgroundStyle": {"dataType":"string"},
            "cardStyle": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OnboardingCompleteRequest": {
        "dataType": "refObject",
        "properties": {
            "uiTheme": {"ref":"CustomThemePayload","required":true},
            "workspaceName": {"dataType":"string"},
            "brandTheme": {"ref":"BrandThemePayload"},
            "openRouterKey": {"dataType":"string"},
            "deepgramKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotionSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "totalPages": {"dataType":"double","required":true},
            "recentPages": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_NotionSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"NotionSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NotionDatabaseItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_NotionDatabaseItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"NotionDatabaseItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetDefaultDatabaseRequest": {
        "dataType": "refObject",
        "properties": {
            "databaseId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MicrosoftSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "isConnected": {"dataType":"boolean","required":true},
            "userEmail": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_MicrosoftSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"MicrosoftSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LinearManualConnectRequest": {
        "dataType": "refObject",
        "properties": {
            "apiKey": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LinearSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "totalIssues": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "totalProjects": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "latestTeams": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LinearSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"LinearSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LinearTeamItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LinearTeamItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"LinearTeamItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetDefaultTeamRequest": {
        "dataType": "refObject",
        "properties": {
            "teamId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JiraAuthorizationResponse": {
        "dataType": "refObject",
        "properties": {
            "authorizationUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_JiraAuthorizationResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"JiraAuthorizationResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JiraManualConnectRequest": {
        "dataType": "refObject",
        "properties": {
            "siteUrl": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "apiToken": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JiraSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "totalIssues": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "totalProjects": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "latestBoards": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_JiraSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"JiraSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "JiraProjectItem": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "key": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_JiraProjectItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"JiraProjectItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SetDefaultProjectRequest": {
        "dataType": "refObject",
        "properties": {
            "projectId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.IntegrationProvider": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["JIRA"]},{"dataType":"enum","enums":["LINEAR"]},{"dataType":"enum","enums":["GITHUB"]},{"dataType":"enum","enums":["GOOGLE_DRIVE"]},{"dataType":"enum","enums":["TRELLO"]},{"dataType":"enum","enums":["NOTION"]},{"dataType":"enum","enums":["ONEDRIVE"]},{"dataType":"enum","enums":["ASANA"]},{"dataType":"enum","enums":["TWENTY"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IntegrationProvider": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.IntegrationProvider","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.IntegrationStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["CONNECTED"]},{"dataType":"enum","enums":["DISCONNECTED"]},{"dataType":"enum","enums":["ERROR"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IntegrationStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.IntegrationStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "IntegrationSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "provider": {"ref":"IntegrationProvider","required":true},
            "status": {"ref":"IntegrationStatus","required":true},
            "accountId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "accountName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "scope": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "expiresAt": {"dataType":"union","subSchemas":[{"dataType":"datetime"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "hasRefreshToken": {"dataType":"boolean","required":true},
            "defaultBoardUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "isWorkspaceLevel": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_IntegrationSummaryResponse-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"IntegrationSummaryResponse"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_IntegrationSummaryResponse-or-null_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"IntegrationSummaryResponse"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_string_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GoogleSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "isConnected": {"dataType":"boolean","required":true},
            "userEmail": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_GoogleSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"GoogleSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GithubRepository": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"double","required":true},
            "name": {"dataType":"string","required":true},
            "full_name": {"dataType":"string","required":true},
            "html_url": {"dataType":"string","required":true},
            "private": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "GithubInstallationNode": {
        "dataType": "refObject",
        "properties": {
            "orgName": {"dataType":"string","required":true},
            "orgAvatarUrl": {"dataType":"string"},
            "installationId": {"dataType":"double","required":true},
            "repositories": {"dataType":"array","array":{"dataType":"refObject","ref":"GithubRepository"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContextFileResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "fileName": {"dataType":"string","required":true},
            "mimeType": {"dataType":"string","required":true},
            "sizeBytes": {"dataType":"double","required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "bucketPath": {"dataType":"string","required":true},
            "publicUrl": {"dataType":"string","required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContextResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "color": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "keywords": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "files": {"dataType":"array","array":{"dataType":"refObject","ref":"ContextFileResponse"},"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContextListResponse": {
        "dataType": "refObject",
        "properties": {
            "contexts": {"dataType":"array","array":{"dataType":"refObject","ref":"ContextResponse"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ContextListResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"ContextListResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ContextResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"ContextResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateContextRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "color": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateContextRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string"},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "color": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "metadata": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConnectGithubRequest": {
        "dataType": "refObject",
        "properties": {
            "repoFullName": {"dataType":"string","required":true},
            "installationId": {"dataType":"string","required":true},
            "branch": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ImportWebsiteRequest": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "maxPages": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SkillsResponse": {
        "dataType": "refObject",
        "properties": {
            "skills": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"description":{"dataType":"string","required":true},"name":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SkillsResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"SkillsResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.ChatRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["USER"]},{"dataType":"enum","enums":["ASSISTANT"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatRole": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.ChatRole","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatAttachment": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "type": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "size": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatMessage": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "threadId": {"dataType":"string","required":true},
            "role": {"ref":"ChatRole","required":true},
            "content": {"dataType":"string","required":true},
            "attachments": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ChatAttachment"}},{"dataType":"enum","enums":[null]}]},
            "createdAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ChatThread": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "contextIds": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "complexityLevel": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
            "messages": {"dataType":"array","array":{"dataType":"refObject","ref":"ChatMessage"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ChatThread-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"ChatThread"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ChatThread_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"ChatThread"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateThreadRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "complexityLevel": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SendMessageResponse": {
        "dataType": "refObject",
        "properties": {
            "message": {"ref":"ChatMessage","required":true},
            "response": {"ref":"ChatMessage","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_SendMessageResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"SendMessageResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SendMessageRequest": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"string","required":true},
            "modelKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LiveChatMessageResponse": {
        "dataType": "refObject",
        "properties": {
            "response": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LiveChatMessageResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"LiveChatMessageResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LiveChatMessageRequest": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"string","required":true},
            "liveTranscript": {"dataType":"string","required":true},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "history": {"dataType":"array","array":{"dataType":"refObject","ref":"LiveChatHistoryItem"}},
            "modelKey": {"dataType":"string"},
            "complexityLevel": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LiveSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "summary": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_LiveSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"LiveSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LiveSummaryRequest": {
        "dataType": "refObject",
        "properties": {
            "liveTranscript": {"dataType":"string","required":true},
            "previousSummary": {"dataType":"string"},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "modelKey": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "BrandThemeResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "headingFont": {"dataType":"string","required":true},
            "bodyFont": {"dataType":"string","required":true},
            "primaryColor": {"dataType":"string","required":true},
            "secondaryColor": {"dataType":"string","required":true},
            "backgroundColor": {"dataType":"string","required":true},
            "textColor": {"dataType":"string","required":true},
            "backgroundStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "cardStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateBrandThemeInput": {
        "dataType": "refObject",
        "properties": {
            "workspaceId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "logoUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "headingFont": {"dataType":"string"},
            "bodyFont": {"dataType":"string"},
            "primaryColor": {"dataType":"string"},
            "secondaryColor": {"dataType":"string"},
            "backgroundColor": {"dataType":"string"},
            "textColor": {"dataType":"string"},
            "backgroundStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "cardStyle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnalyzeUrlResponse": {
        "dataType": "refObject",
        "properties": {
            "suggestedName": {"dataType":"string","required":true},
            "primaryColor": {"dataType":"string","required":true},
            "secondaryColor": {"dataType":"string","required":true},
            "backgroundColor": {"dataType":"string","required":true},
            "headingFont": {"dataType":"string","required":true},
            "bodyFont": {"dataType":"string","required":true},
            "candidateLogos": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AnalyzeUrlRequest": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_CreateBrandThemeInput_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"workspaceId":{"dataType":"string"},"name":{"dataType":"string"},"logoUrl":{"dataType":"string"},"headingFont":{"dataType":"string"},"bodyFont":{"dataType":"string"},"primaryColor":{"dataType":"string"},"secondaryColor":{"dataType":"string"},"backgroundColor":{"dataType":"string"},"textColor":{"dataType":"string"},"backgroundStyle":{"dataType":"string"},"cardStyle":{"dataType":"string"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SubscriptionStatusResponse": {
        "dataType": "refObject",
        "properties": {
            "active": {"dataType":"boolean","required":true},
            "configured": {"dataType":"boolean","required":true},
            "tier": {"dataType":"string","required":true},
            "status": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "track": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "priceId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "seats": {"dataType":"double","required":true},
            "currentPeriodEnd": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "cancelAtPeriodEnd": {"dataType":"boolean","required":true},
            "reason": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["no_subscription"]},{"dataType":"enum","enums":["expired"]},{"dataType":"enum","enums":["canceled"]},{"dataType":"enum","enums":["incomplete"]},{"dataType":"enum","enums":["over_quota"]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UsageLimitsResponse": {
        "dataType": "refObject",
        "properties": {
            "llm": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"percentage":{"dataType":"double","required":true},"allowed":{"dataType":"double","required":true},"used":{"dataType":"double","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
            "recording": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"percentage":{"dataType":"double","required":true},"allowed":{"dataType":"double","required":true},"used":{"dataType":"double","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
            "generations": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"percentage":{"dataType":"double","required":true},"allowed":{"dataType":"double","required":true},"used":{"dataType":"double","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CatalogEntry": {
        "dataType": "refObject",
        "properties": {
            "priceId": {"dataType":"string","required":true},
            "tier": {"dataType":"string","required":true},
            "track": {"dataType":"string","required":true},
            "key": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CheckoutResponse": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
            "sessionId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CheckoutBody": {
        "dataType": "refObject",
        "properties": {
            "priceId": {"dataType":"string","required":true},
            "seats": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PortalResponse": {
        "dataType": "refObject",
        "properties": {
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__text-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"text":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AsanaAuthorizationResponse": {
        "dataType": "refObject",
        "properties": {
            "authorizationUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AsanaAuthorizationResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"AsanaAuthorizationResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AsanaManualConnectRequest": {
        "dataType": "refObject",
        "properties": {
            "personalAccessToken": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AsanaSummaryResponse": {
        "dataType": "refObject",
        "properties": {
            "totalTasks": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "totalProjects": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AsanaSummaryResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"AsanaSummaryResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AsanaProjectItem": {
        "dataType": "refObject",
        "properties": {
            "gid": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AsanaProjectItem-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"AsanaProjectItem"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AsanaSetDefaultProjectRequest": {
        "dataType": "refObject",
        "properties": {
            "projectGid": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DashboardAnalytics": {
        "dataType": "refObject",
        "properties": {
            "period": {"dataType":"nestedObjectLiteral","nestedProperties":{"end":{"dataType":"string","required":true},"start":{"dataType":"string","required":true}},"required":true},
            "meetings": {"dataType":"nestedObjectLiteral","nestedProperties":{"bySource":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"source":{"dataType":"string","required":true}}},"required":true},"byWeek":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"totalMinutes":{"dataType":"double","required":true},"count":{"dataType":"double","required":true},"week":{"dataType":"string","required":true}}},"required":true},"avgParticipants":{"dataType":"double","required":true},"avgDurationMinutes":{"dataType":"double","required":true},"totalHours":{"dataType":"double","required":true},"total":{"dataType":"double","required":true}},"required":true},
            "tasks": {"dataType":"nestedObjectLiteral","nestedProperties":{"completionTrend":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"created":{"dataType":"double","required":true},"completed":{"dataType":"double","required":true},"week":{"dataType":"string","required":true}}},"required":true},"byPriority":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"priority":{"dataType":"string","required":true}}},"required":true},"byStatus":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"status":{"dataType":"string","required":true}}},"required":true},"completionRate":{"dataType":"double","required":true},"tasksPerMeeting":{"dataType":"double","required":true},"totalGenerated":{"dataType":"double","required":true}},"required":true},
            "sentiment": {"dataType":"nestedObjectLiteral","nestedProperties":{"trend":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"negative":{"dataType":"double","required":true},"neutral":{"dataType":"double","required":true},"positive":{"dataType":"double","required":true},"week":{"dataType":"string","required":true}}},"required":true},"distribution":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"count":{"dataType":"double","required":true},"sentiment":{"dataType":"string","required":true}}},"required":true}},"required":true},
            "aiUsage": {"dataType":"nestedObjectLiteral","nestedProperties":{"trend":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"cost":{"dataType":"double","required":true},"tokens":{"dataType":"double","required":true},"week":{"dataType":"string","required":true}}},"required":true},"byFeature":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"cost":{"dataType":"double","required":true},"tokens":{"dataType":"double","required":true},"feature":{"dataType":"string","required":true}}},"required":true},"totalCost":{"dataType":"double","required":true},"totalTokens":{"dataType":"double","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_DashboardAnalytics_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"DashboardAnalytics"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiUsageMetricsResponse": {
        "dataType": "refObject",
        "properties": {
            "totalInputTokens": {"dataType":"double","required":true},
            "totalOutputTokens": {"dataType":"double","required":true},
            "totalTokens": {"dataType":"double","required":true},
            "totalEstimatedCost": {"dataType":"double"},
            "totalBlueberryTokens": {"dataType":"double","required":true},
            "usageByFeature": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"totalTokens":{"dataType":"double","required":true},"feature":{"dataType":"string","required":true}}},"required":true},
            "usageByFeatureCost": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"estimatedCost":{"dataType":"double","required":true},"feature":{"dataType":"string","required":true}}},"required":true},
            "logs": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"datetime","required":true},"blueberryTokens":{"dataType":"double","required":true},"estimatedCost":{"dataType":"double"},"totalTokens":{"dataType":"double","required":true},"outputTokens":{"dataType":"double","required":true},"inputTokens":{"dataType":"double","required":true},"model":{"dataType":"string","required":true},"provider":{"dataType":"string","required":true},"feature":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
            "totalCount": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_AiUsageMetricsResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"AiUsageMetricsResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WorkspaceUserUsageSummary": {
        "dataType": "refObject",
        "properties": {
            "userId": {"dataType":"string","required":true},
            "name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "email": {"dataType":"string","required":true},
            "workspaceRole": {"dataType":"string","required":true},
            "totalInputTokens": {"dataType":"double","required":true},
            "totalOutputTokens": {"dataType":"double","required":true},
            "totalTokens": {"dataType":"double","required":true},
            "estimatedCost": {"dataType":"double"},
            "blueberryTokens": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_WorkspaceUserUsageSummary-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"WorkspaceUserUsageSummary"}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__models_58__id-string--promptPrice-number--completionPrice-number--maxTokens-number-or-null_-Array__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"models":{"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"maxTokens":{"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},"completionPrice":{"dataType":"double","required":true},"promptPrice":{"dataType":"double","required":true},"id":{"dataType":"string","required":true}}},"required":true}}},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AiModelResponse": {
        "dataType": "refObject",
        "properties": {
            "key": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "maxTokens": {"dataType":"double","required":true},
            "description": {"dataType":"string","required":true},
            "tags": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AdminEmailTemplatesResponse": {
        "dataType": "refObject",
        "properties": {
            "status": {"dataType":"string","required":true},
            "data": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"html":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CustomThemeResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"string","required":true},
            "primaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "secondaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "backgroundColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "surfaceColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "textPrimaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "textSecondaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "fontFamily": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "headingFontFamily": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "borderRadius": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "density": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "configJson": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"datetime","required":true},
            "updatedAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CustomThemeResponse-or-null_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"union","subSchemas":[{"ref":"CustomThemeResponse"},{"dataType":"enum","enums":[null]}]},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_CustomThemeResponse_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"ref":"CustomThemeResponse"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCustomThemeRequest": {
        "dataType": "refObject",
        "properties": {
            "primaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "secondaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "backgroundColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "surfaceColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "textPrimaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "textSecondaryColor": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "fontFamily": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "headingFontFamily": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "borderRadius": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "density": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}]},
            "configJson": {"dataType":"union","subSchemas":[{"ref":"TsoaJsonObject"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_boolean_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string"},"data":{"dataType":"union","subSchemas":[{"dataType":"boolean"},{"dataType":"enum","enums":[null]}],"required":true},"status":{"dataType":"double","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.WorkspaceTier": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["FREE"]},{"dataType":"enum","enums":["PRO"]},{"dataType":"enum","enums":["BUSINESS"]},{"dataType":"enum","enums":["ENTERPRISE"]},{"dataType":"enum","enums":["AGENCY"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WorkspaceTier": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.WorkspaceTier","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.WorkspaceRole": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ADMIN"]},{"dataType":"enum","enums":["OWNER"]},{"dataType":"enum","enums":["MEMBER"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WorkspaceRole": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.WorkspaceRole","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WorkspaceResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "tier": {"ref":"WorkspaceTier","required":true},
            "role": {"ref":"WorkspaceRole","required":true},
            "stripeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "monthlyTokenLimit": {"dataType":"double"},
            "openRouterKey": {"dataType":"string"},
            "deepgramKey": {"dataType":"string"},
            "openaiKey": {"dataType":"string"},
            "isCourtesy": {"dataType":"boolean"},
            "defaultThemeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.UserPersona": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["PROJECT_MANAGER"]},{"dataType":"enum","enums":["SOFTWARE_ENGINEER"]},{"dataType":"enum","enums":["DESIGNER"]},{"dataType":"enum","enums":["PRODUCT_MANAGER"]},{"dataType":"enum","enums":["EXECUTIVE"]},{"dataType":"enum","enums":["OTHER"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UserPersona": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.UserPersona","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WorkspaceMemberResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "userId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "name": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "email": {"dataType":"string","required":true},
            "role": {"ref":"WorkspaceRole","required":true},
            "personas": {"dataType":"array","array":{"dataType":"refAlias","ref":"UserPersona"},"required":true},
            "personaNotes": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ACTIVE"]},{"dataType":"enum","enums":["PENDING"]}],"required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WorkspaceTeamResponse": {
        "dataType": "refObject",
        "properties": {
            "members": {"dataType":"array","array":{"dataType":"refObject","ref":"WorkspaceMemberResponse"},"required":true},
            "maxInvitations": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateWorkspaceRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "tier": {"ref":"WorkspaceTier"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "InviteMemberRequest": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "role": {"ref":"WorkspaceRole","required":true},
            "personas": {"dataType":"array","array":{"dataType":"refAlias","ref":"UserPersona"}},
            "personaNotes": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateMemberRequest": {
        "dataType": "refObject",
        "properties": {
            "role": {"ref":"WorkspaceRole"},
            "personas": {"dataType":"array","array":{"dataType":"refAlias","ref":"UserPersona"}},
            "personaNotes": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateWorkspaceSettingsRequest": {
        "dataType": "refObject",
        "properties": {
            "openRouterKey": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "deepgramKey": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "openaiKey": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "monthlyTokenLimit": {"dataType":"double"},
            "isCourtesy": {"dataType":"boolean"},
            "defaultThemeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateMcpTokenResponse": {
        "dataType": "refObject",
        "properties": {
            "rawToken": {"dataType":"string","required":true},
            "id": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "prefix": {"dataType":"string","required":true},
            "workspaceId": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateMcpTokenRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "workspaceId": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ListMcpTokensResponse": {
        "dataType": "refObject",
        "properties": {
            "tokens": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"createdAt":{"dataType":"string","required":true},"lastUsedAt":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"workspaceId":{"dataType":"string","required":true},"prefix":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DiagramResponse": {
        "dataType": "refObject",
        "properties": {
            "id": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "prompt": {"dataType":"string","required":true},
            "mermaidCode": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "type": {"dataType":"string","required":true},
            "themeId": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "status": {"dataType":"string","required":true},
            "isPublic": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"string","required":true},
            "theme": {"dataType":"union","subSchemas":[{"dataType":"nestedObjectLiteral","nestedProperties":{"cardStyle":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"backgroundStyle":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},"bodyFont":{"dataType":"string","required":true},"headingFont":{"dataType":"string","required":true},"textColor":{"dataType":"string","required":true},"backgroundColor":{"dataType":"string","required":true},"secondaryColor":{"dataType":"string","required":true},"primaryColor":{"dataType":"string","required":true},"name":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DiagramListResponse": {
        "dataType": "refObject",
        "properties": {
            "diagrams": {"dataType":"array","array":{"dataType":"refObject","ref":"DiagramResponse"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateDiagramRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string","required":true},
            "prompt": {"dataType":"string","required":true},
            "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["AUTO"]},{"dataType":"enum","enums":["FLOWCHART"]},{"dataType":"enum","enums":["SEQUENCE"]},{"dataType":"enum","enums":["GANTT"]},{"dataType":"enum","enums":["MINDMAP"]},{"dataType":"enum","enums":["CLASS"]},{"dataType":"enum","enums":["ER"]},{"dataType":"enum","enums":["ARCHITECTURE"]}],"required":true},
            "themeId": {"dataType":"string"},
            "contextIds": {"dataType":"array","array":{"dataType":"string"}},
            "projectIds": {"dataType":"array","array":{"dataType":"string"}},
            "transcriptIds": {"dataType":"array","array":{"dataType":"string"}},
            "isManual": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateDiagramRequest": {
        "dataType": "refObject",
        "properties": {
            "title": {"dataType":"string"},
            "mermaidCode": {"dataType":"string"},
            "themeId": {"dataType":"string"},
            "status": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["GENERATING"]},{"dataType":"enum","enums":["DRAFT"]},{"dataType":"enum","enums":["FAILED"]}]},
            "isPublic": {"dataType":"boolean"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DiagramAssistantRequest": {
        "dataType": "refObject",
        "properties": {
            "instruction": {"dataType":"string","required":true},
            "currentCode": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsVersionController_getLatestDesktopVersion: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/version/desktop/latest',
            ...(fetchMiddlewares<RequestHandler>(VersionController)),
            ...(fetchMiddlewares<RequestHandler>(VersionController.prototype.getLatestDesktopVersion)),

            async function VersionController_getLatestDesktopVersion(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVersionController_getLatestDesktopVersion, request, response });

                const controller = new VersionController();

              await templateService.apiHandler({
                methodName: 'getLatestDesktopVersion',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getUsers: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/users',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUsers)),

            async function UserController_getUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUsers, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_updateUserRole: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateUserRoleRequest"},
        };
        app.put('/api/users/:userId/role',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.updateUserRole)),

            async function UserController_updateUserRole(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUserRole, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'updateUserRole',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getOrphans: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/users/orphans',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getOrphans)),

            async function UserController_getOrphans(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getOrphans, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getOrphans',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_forceVerifyEmail: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
        };
        app.post('/api/users/:userId/verify-email',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.forceVerifyEmail)),

            async function UserController_forceVerifyEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_forceVerifyEmail, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'forceVerifyEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_syncOrphan: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SyncOrphanRequest"},
        };
        app.post('/api/users/sync-orphan',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.syncOrphan)),

            async function UserController_syncOrphan(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_syncOrphan, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'syncOrphan',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_deleteUser: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
        };
        app.delete('/api/users/:userId',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.deleteUser)),

            async function UserController_deleteUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_deleteUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTwentyController_manualConnect: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"TwentyManualConnectRequest"},
        };
        app.post('/api/twenty/manual-connect',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TwentyController)),
            ...(fetchMiddlewares<RequestHandler>(TwentyController.prototype.manualConnect)),

            async function TwentyController_manualConnect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTwentyController_manualConnect, request, response });

                const controller = new TwentyController();

              await templateService.apiHandler({
                methodName: 'manualConnect',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTwentyController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/twenty/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TwentyController)),
            ...(fetchMiddlewares<RequestHandler>(TwentyController.prototype.getSummary)),

            async function TwentyController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTwentyController_getSummary, request, response });

                const controller = new TwentyController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTwentyController_searchCompanies: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                q: {"in":"query","name":"q","dataType":"string"},
        };
        app.get('/api/twenty/companies',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TwentyController)),
            ...(fetchMiddlewares<RequestHandler>(TwentyController.prototype.searchCompanies)),

            async function TwentyController_searchCompanies(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTwentyController_searchCompanies, request, response });

                const controller = new TwentyController();

              await templateService.apiHandler({
                methodName: 'searchCompanies',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTwentyController_searchPeople: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                q: {"in":"query","name":"q","dataType":"string"},
        };
        app.get('/api/twenty/people',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TwentyController)),
            ...(fetchMiddlewares<RequestHandler>(TwentyController.prototype.searchPeople)),

            async function TwentyController_searchPeople(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTwentyController_searchPeople, request, response });

                const controller = new TwentyController();

              await templateService.apiHandler({
                methodName: 'searchPeople',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTwentyController_pushTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"PushTranscriptToTwentyRequest"},
        };
        app.post('/api/twenty/push-transcript',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TwentyController)),
            ...(fetchMiddlewares<RequestHandler>(TwentyController.prototype.pushTranscript)),

            async function TwentyController_pushTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTwentyController_pushTranscript, request, response });

                const controller = new TwentyController();

              await templateService.apiHandler({
                methodName: 'pushTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_manualConnect: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"TrelloManualConnectRequest"},
        };
        app.post('/api/trello/manual-connect',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.manualConnect)),

            async function TrelloController_manualConnect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_manualConnect, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'manualConnect',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_getAuthorizationUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                returnUrl: {"in":"query","name":"returnUrl","required":true,"dataType":"string"},
        };
        app.get('/api/trello/auth',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.getAuthorizationUrl)),

            async function TrelloController_getAuthorizationUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_getAuthorizationUrl, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'getAuthorizationUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_autoConnect: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"string","required":true}}},
        };
        app.post('/api/trello/auto-connect',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.autoConnect)),

            async function TrelloController_autoConnect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_autoConnect, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'autoConnect',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/trello/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.getSummary)),

            async function TrelloController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_getSummary, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_getBoards: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/trello/boards',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.getBoards)),

            async function TrelloController_getBoards(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_getBoards, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'getBoards',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_getLists: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                boardId: {"in":"path","name":"boardId","required":true,"dataType":"string"},
        };
        app.get('/api/trello/boards/:boardId/lists',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.getLists)),

            async function TrelloController_getLists(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_getLists, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'getLists',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTrelloController_setDefaultBoardAndList: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"SetDefaultTrelloBoardListRequest"},
        };
        app.post('/api/trello/default-board-list',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TrelloController)),
            ...(fetchMiddlewares<RequestHandler>(TrelloController.prototype.setDefaultBoardAndList)),

            async function TrelloController_setDefaultBoardAndList(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTrelloController_setDefaultBoardAndList, request, response });

                const controller = new TrelloController();

              await templateService.apiHandler({
                methodName: 'setDefaultBoardAndList',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_listSessions: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
                status: {"in":"query","name":"status","ref":"ProjectStatus"},
        };
        app.get('/api/projects',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.listSessions)),

            async function ProjectsModelController_listSessions(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_listSessions, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'listSessions',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_uploadTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                files: {"in":"formData","name":"files","required":true,"dataType":"array","array":{"dataType":"file"}},
                title: {"in":"formData","name":"title","dataType":"string"},
                recordedAt: {"in":"formData","name":"recordedAt","dataType":"string"},
                metadata: {"in":"formData","name":"metadata","dataType":"string"},
                persona: {"in":"formData","name":"persona","dataType":"string"},
                objective: {"in":"formData","name":"objective","dataType":"string"},
                contextIds: {"in":"formData","name":"contextIds","dataType":"string"},
                complexityLevel: {"in":"formData","name":"complexityLevel","dataType":"string"},
                modelKey: {"in":"formData","name":"modelKey","dataType":"string"},
                taskStrategy: {"in":"formData","name":"taskStrategy","dataType":"string"},
                taskCount: {"in":"formData","name":"taskCount","dataType":"string"},
                syncToJira: {"in":"formData","name":"syncToJira","dataType":"string"},
                syncToLinear: {"in":"formData","name":"syncToLinear","dataType":"string"},
                syncToTrello: {"in":"formData","name":"syncToTrello","dataType":"string"},
                agenticInvestigation: {"in":"formData","name":"agenticInvestigation","dataType":"string"},
                createDoc: {"in":"formData","name":"createDoc","dataType":"string"},
                createSlides: {"in":"formData","name":"createSlides","dataType":"string"},
        };
        app.post('/api/projects/:projectId/transcripts/upload',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "files",
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.uploadTranscript)),

            async function ProjectsModelController_uploadTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_uploadTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'uploadTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_listProjectTranscripts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
                q: {"in":"query","name":"q","dataType":"string"},
        };
        app.get('/api/projects/:projectId/transcripts',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.listProjectTranscripts)),

            async function ProjectsModelController_listProjectTranscripts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_listProjectTranscripts, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'listProjectTranscripts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_importProjectTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ImportTranscriptRequest"},
        };
        app.post('/api/projects/:projectId/transcripts/import',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.importProjectTranscript)),

            async function ProjectsModelController_importProjectTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_importProjectTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'importProjectTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_getProjectTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                transcriptId: {"in":"path","name":"transcriptId","required":true,"dataType":"string"},
        };
        app.get('/api/projects/:projectId/transcripts/:transcriptId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.getProjectTranscript)),

            async function ProjectsModelController_getProjectTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_getProjectTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'getProjectTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_listProjectPainPoints: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                severity: {"in":"query","name":"severity","ref":"PainPointSeverity"},
                status: {"in":"query","name":"status","ref":"PainPointStatus"},
        };
        app.get('/api/projects/:projectId/pain-points',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.listProjectPainPoints)),

            async function ProjectsModelController_listProjectPainPoints(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_listProjectPainPoints, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'listProjectPainPoints',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_convertPainPointToTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                transcriptId: {"in":"path","name":"transcriptId","required":true,"dataType":"string"},
                painPointId: {"in":"path","name":"painPointId","required":true,"dataType":"string"},
        };
        app.post('/api/projects/:projectId/transcripts/:transcriptId/pain-points/:painPointId/convert-to-task',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.convertPainPointToTask)),

            async function ProjectsModelController_convertPainPointToTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_convertPainPointToTask, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'convertPainPointToTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_createManualTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ManualTranscriptRequest"},
        };
        app.post('/api/projects/:projectId/transcripts/manual',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.createManualTranscript)),

            async function ProjectsModelController_createManualTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_createManualTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'createManualTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_updateProjectTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                transcriptId: {"in":"path","name":"transcriptId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateTranscriptRequest"},
        };
        app.put('/api/projects/:projectId/transcripts/:transcriptId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.updateProjectTranscript)),

            async function ProjectsModelController_updateProjectTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_updateProjectTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'updateProjectTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_deleteProjectTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                transcriptId: {"in":"path","name":"transcriptId","required":true,"dataType":"string"},
        };
        app.delete('/api/projects/:projectId/transcripts/:transcriptId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.deleteProjectTranscript)),

            async function ProjectsModelController_deleteProjectTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_deleteProjectTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'deleteProjectTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_listTasks: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                status: {"in":"query","name":"status","ref":"TaskStatus"},
                priority: {"in":"query","name":"priority","ref":"TaskPriority"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
        };
        app.get('/api/projects/:projectId/tasks',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.listTasks)),

            async function ProjectsModelController_listTasks(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_listTasks, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'listTasks',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_getTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                taskId: {"in":"path","name":"taskId","required":true,"dataType":"string"},
        };
        app.get('/api/projects/:projectId/tasks/:taskId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.getTask)),

            async function ProjectsModelController_getTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_getTask, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'getTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_createTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateTaskRequest"},
        };
        app.post('/api/projects/:projectId/tasks',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.createTask)),

            async function ProjectsModelController_createTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_createTask, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'createTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_updateTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                taskId: {"in":"path","name":"taskId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateTaskRequest"},
        };
        app.put('/api/projects/:projectId/tasks/:taskId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.updateTask)),

            async function ProjectsModelController_updateTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_updateTask, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'updateTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_refineTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"RefineTaskRequest"},
        };
        app.post('/api/projects/:projectId/tasks/refine',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.refineTask)),

            async function ProjectsModelController_refineTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_refineTask, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'refineTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_deleteTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                taskId: {"in":"path","name":"taskId","required":true,"dataType":"string"},
        };
        app.delete('/api/projects/:projectId/tasks/:taskId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.deleteTask)),

            async function ProjectsModelController_deleteTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_deleteTask, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'deleteTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_getSession: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
        };
        app.get('/api/projects/:projectId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.getSession)),

            async function ProjectsModelController_getSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_getSession, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'getSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_createSession: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateProjectRequest"},
        };
        app.post('/api/projects',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.createSession)),

            async function ProjectsModelController_createSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_createSession, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'createSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_updateSession: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateProjectRequest"},
        };
        app.put('/api/projects/:projectId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.updateSession)),

            async function ProjectsModelController_updateSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_updateSession, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'updateSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_generateProjectDigest: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
        };
        app.post('/api/projects/:projectId/digest',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.generateProjectDigest)),

            async function ProjectsModelController_generateProjectDigest(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_generateProjectDigest, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'generateProjectDigest',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_deleteSession: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
        };
        app.delete('/api/projects/:projectId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.deleteSession)),

            async function ProjectsModelController_deleteSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_deleteSession, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'deleteSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProjectsModelController_createProjectTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"path","name":"projectId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateTranscriptRequest"},
        };
        app.post('/api/projects/:projectId/transcripts',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController)),
            ...(fetchMiddlewares<RequestHandler>(ProjectsModelController.prototype.createProjectTranscript)),

            async function ProjectsModelController_createProjectTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProjectsModelController_createProjectTranscript, request, response });

                const controller = new ProjectsModelController();

              await templateService.apiHandler({
                methodName: 'createProjectTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_list: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                projectId: {"in":"query","name":"projectId","dataType":"string"},
        };
        app.get('/api/documents',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.list)),

            async function DocController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_list, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/documents/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.getById)),

            async function DocController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_getById, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateDocInput"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/documents',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.create)),

            async function DocController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_create, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_importDoc: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
                contextIds: {"in":"formData","name":"contextIds","dataType":"string"},
                projectIds: {"in":"formData","name":"projectIds","dataType":"string"},
                transcriptIds: {"in":"formData","name":"transcriptIds","dataType":"string"},
                themeId: {"in":"formData","name":"themeId","dataType":"string"},
        };
        app.post('/api/documents/import',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.importDoc)),

            async function DocController_importDoc(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_importDoc, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'importDoc',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateDocInput"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/api/documents/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.update)),

            async function DocController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_update, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/documents/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.delete)),

            async function DocController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_delete, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDocController_fixMermaid: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"brokenCode":{"dataType":"string","required":true}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/documents/assistant/mermaid-fix',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DocController)),
            ...(fetchMiddlewares<RequestHandler>(DocController.prototype.fixMermaid)),

            async function DocController_fixMermaid(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDocController_fixMermaid, request, response });

                const controller = new DocController();

              await templateService.apiHandler({
                methodName: 'fixMermaid',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_listTranscripts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                pageSize: {"default":20,"in":"query","name":"pageSize","dataType":"double"},
                source: {"in":"query","name":"source","ref":"TranscriptSource"},
                q: {"in":"query","name":"q","dataType":"string"},
                sentiment: {"in":"query","name":"sentiment","dataType":"string"},
                dateFilter: {"in":"query","name":"dateFilter","dataType":"string"},
                sources: {"in":"query","name":"sources","dataType":"string"},
                projectId: {"in":"query","name":"projectId","dataType":"string"},
        };
        app.get('/api/transcripts',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.listTranscripts)),

            async function TranscriptsController_listTranscripts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_listTranscripts, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'listTranscripts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_createTranscriptFromRecording: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                source: {"in":"formData","name":"source","dataType":"string"},
                content: {"in":"formData","name":"content","dataType":"string"},
                title: {"in":"formData","name":"title","dataType":"string"},
                recordedAt: {"in":"formData","name":"recordedAt","dataType":"string"},
                projectId: {"in":"formData","name":"projectId","dataType":"string"},
                contextIds: {"in":"formData","name":"contextIds","dataType":"string"},
                chatHistory: {"in":"formData","name":"chatHistory","dataType":"string"},
                modelKey: {"in":"formData","name":"modelKey","dataType":"string"},
                complexityLevel: {"in":"formData","name":"complexityLevel","dataType":"string"},
                syncToJira: {"in":"formData","name":"syncToJira","dataType":"string"},
                syncToLinear: {"in":"formData","name":"syncToLinear","dataType":"string"},
                syncToTrello: {"in":"formData","name":"syncToTrello","dataType":"string"},
                syncToNotion: {"in":"formData","name":"syncToNotion","dataType":"string"},
                syncToAsana: {"in":"formData","name":"syncToAsana","dataType":"string"},
                exportToGoogleDrive: {"in":"formData","name":"exportToGoogleDrive","dataType":"string"},
                exportToOneDrive: {"in":"formData","name":"exportToOneDrive","dataType":"string"},
                skipAi: {"in":"formData","name":"skipAi","dataType":"string"},
                taskStrategy: {"in":"formData","name":"taskStrategy","dataType":"string"},
                taskCount: {"in":"formData","name":"taskCount","dataType":"string"},
                agenticInvestigation: {"in":"formData","name":"agenticInvestigation","dataType":"string"},
                location: {"in":"formData","name":"location","dataType":"string"},
                createDoc: {"in":"formData","name":"createDoc","dataType":"string"},
                createSlides: {"in":"formData","name":"createSlides","dataType":"string"},
                language: {"in":"formData","name":"language","dataType":"string"},
                aecTelemetry: {"in":"formData","name":"aecTelemetry","dataType":"string"},
                recordingStartedAt: {"in":"formData","name":"recordingStartedAt","dataType":"string"},
                recordingWallClockSeconds: {"in":"formData","name":"recordingWallClockSeconds","dataType":"string"},
                micFile: {"in":"formData","name":"micFile","dataType":"file"},
                sysFile: {"in":"formData","name":"sysFile","dataType":"file"},
        };
        app.post('/api/transcripts/recorder-upload',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "micFile",
                    maxCount: 1
                },
                {
                    name: "sysFile",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.createTranscriptFromRecording)),

            async function TranscriptsController_createTranscriptFromRecording(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_createTranscriptFromRecording, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'createTranscriptFromRecording',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_createTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateStandaloneTranscriptBody"},
        };
        app.post('/api/transcripts',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.createTranscript)),

            async function TranscriptsController_createTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_createTranscript, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'createTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_getTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/transcripts/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.getTranscript)),

            async function TranscriptsController_getTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_getTranscript, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'getTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_updateTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateStandaloneTranscriptBody"},
        };
        app.put('/api/transcripts/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.updateTranscript)),

            async function TranscriptsController_updateTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_updateTranscript, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'updateTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_updateTranscriptSpeakers: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateSpeakerNamesBody"},
        };
        app.put('/api/transcripts/:id/speakers',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.updateTranscriptSpeakers)),

            async function TranscriptsController_updateTranscriptSpeakers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_updateTranscriptSpeakers, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'updateTranscriptSpeakers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_reprocessTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.post('/api/transcripts/:id/reprocess',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.reprocessTranscript)),

            async function TranscriptsController_reprocessTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_reprocessTranscript, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'reprocessTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_retryPostMeetingTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                kind: {"in":"path","name":"kind","required":true,"ref":"PostMeetingTaskKind"},
        };
        app.post('/api/transcripts/:id/post-meeting-tasks/:kind/retry',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.retryPostMeetingTask)),

            async function TranscriptsController_retryPostMeetingTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_retryPostMeetingTask, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'retryPostMeetingTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTranscriptsController_deleteTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/transcripts/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController)),
            ...(fetchMiddlewares<RequestHandler>(TranscriptsController.prototype.deleteTranscript)),

            async function TranscriptsController_deleteTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTranscriptsController_deleteTranscript, request, response });

                const controller = new TranscriptsController();

              await templateService.apiHandler({
                methodName: 'deleteTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTelegramController_handleWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/integrations/telegram/webhook',
            ...(fetchMiddlewares<RequestHandler>(TelegramController)),
            ...(fetchMiddlewares<RequestHandler>(TelegramController.prototype.handleWebhook)),

            async function TelegramController_handleWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTelegramController_handleWebhook, request, response });

                const controller = new TelegramController();

              await templateService.apiHandler({
                methodName: 'handleWebhook',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTaskIntegrationController_getMetadataTypes: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.post('/api/tasks/metadata-types',
            ...(fetchMiddlewares<RequestHandler>(TaskIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(TaskIntegrationController.prototype.getMetadataTypes)),

            async function TaskIntegrationController_getMetadataTypes(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTaskIntegrationController_getMetadataTypes, request, response });

                const controller = new TaskIntegrationController();

              await templateService.apiHandler({
                methodName: 'getMetadataTypes',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTaskIntegrationController_syncTask: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                taskId: {"in":"path","name":"taskId","required":true,"dataType":"string"},
                provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SyncTaskRequest"},
        };
        app.post('/api/tasks/:taskId/sync/:provider',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TaskIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(TaskIntegrationController.prototype.syncTask)),

            async function TaskIntegrationController_syncTask(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTaskIntegrationController_syncTask, request, response });

                const controller = new TaskIntegrationController();

              await templateService.apiHandler({
                methodName: 'syncTask',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsTaskIntegrationController_autoSyncTranscript: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                transcriptId: {"in":"path","name":"transcriptId","required":true,"dataType":"string"},
        };
        app.post('/api/tasks/auto-sync-transcript/:transcriptId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(TaskIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(TaskIntegrationController.prototype.autoSyncTranscript)),

            async function TaskIntegrationController_autoSyncTranscript(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsTaskIntegrationController_autoSyncTranscript, request, response });

                const controller = new TaskIntegrationController();

              await templateService.apiHandler({
                methodName: 'autoSyncTranscript',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSlideTemplateController_listTemplates: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/slide-templates',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController.prototype.listTemplates)),

            async function SlideTemplateController_listTemplates(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSlideTemplateController_listTemplates, request, response });

                const controller = new SlideTemplateController();

              await templateService.apiHandler({
                methodName: 'listTemplates',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSlideTemplateController_getTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                templateId: {"in":"path","name":"templateId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/slide-templates/:templateId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController.prototype.getTemplate)),

            async function SlideTemplateController_getTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSlideTemplateController_getTemplate, request, response });

                const controller = new SlideTemplateController();

              await templateService.apiHandler({
                methodName: 'getTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSlideTemplateController_createTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateTemplateRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/slide-templates',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController.prototype.createTemplate)),

            async function SlideTemplateController_createTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSlideTemplateController_createTemplate, request, response });

                const controller = new SlideTemplateController();

              await templateService.apiHandler({
                methodName: 'createTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSlideTemplateController_updateTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                templateId: {"in":"path","name":"templateId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateTemplateRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/api/slide-templates/:templateId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController.prototype.updateTemplate)),

            async function SlideTemplateController_updateTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSlideTemplateController_updateTemplate, request, response });

                const controller = new SlideTemplateController();

              await templateService.apiHandler({
                methodName: 'updateTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSlideTemplateController_deleteTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                templateId: {"in":"path","name":"templateId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/slide-templates/:templateId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(SlideTemplateController.prototype.deleteTemplate)),

            async function SlideTemplateController_deleteTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSlideTemplateController_deleteTemplate, request, response });

                const controller = new SlideTemplateController();

              await templateService.apiHandler({
                methodName: 'deleteTemplate',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSessionController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"string","required":true},"uuid":{"dataType":"string","required":true}}},
        };
        app.post('/api/session/login',
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.login)),

            async function SessionController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_login, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSessionController_getCurrentUser: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/session/me',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getCurrentUser)),

            async function SessionController_getCurrentUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_getCurrentUser, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'getCurrentUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSessionController_saveVoiceProfile: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                voiceFile: {"in":"formData","name":"voiceFile","dataType":"file"},
        };
        app.post('/api/session/me/voice-profile',
            authenticateMiddleware([{"BearerAuth":[]}]),
            upload.fields([
                {
                    name: "voiceFile",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.saveVoiceProfile)),

            async function SessionController_saveVoiceProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_saveVoiceProfile, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'saveVoiceProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSessionController_completeHomeTour: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/session/me/home-tour',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.completeHomeTour)),

            async function SessionController_completeHomeTour(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_completeHomeTour, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'completeHomeTour',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSessionController_getDesktopToken: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/session/desktop-token',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.getDesktopToken)),

            async function SessionController_getDesktopToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_getDesktopToken, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'getDesktopToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSessionController_exchangeDesktopCode: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"code":{"dataType":"string","required":true}}},
        };
        app.post('/api/session/desktop-exchange',
            ...(fetchMiddlewares<RequestHandler>(SessionController)),
            ...(fetchMiddlewares<RequestHandler>(SessionController.prototype.exchangeDesktopCode)),

            async function SessionController_exchangeDesktopCode(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSessionController_exchangeDesktopCode, request, response });

                const controller = new SessionController();

              await templateService.apiHandler({
                methodName: 'exchangeDesktopCode',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSentryTestController_getSentryError: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/sentry-error',
            ...(fetchMiddlewares<RequestHandler>(SentryTestController)),
            ...(fetchMiddlewares<RequestHandler>(SentryTestController.prototype.getSentryError)),

            async function SentryTestController_getSentryError(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSentryTestController_getSentryError, request, response });

                const controller = new SentryTestController();

              await templateService.apiHandler({
                methodName: 'getSentryError',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPublicPrototypeController_getPublicPrototype: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/public/prototypes/:id',
            ...(fetchMiddlewares<RequestHandler>(PublicPrototypeController)),
            ...(fetchMiddlewares<RequestHandler>(PublicPrototypeController.prototype.getPublicPrototype)),

            async function PublicPrototypeController_getPublicPrototype(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPublicPrototypeController_getPublicPrototype, request, response });

                const controller = new PublicPrototypeController();

              await templateService.apiHandler({
                methodName: 'getPublicPrototype',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPublicPresentationController_getPublicPresentation: Record<string, TsoaRoute.ParameterSchema> = {
                presentationId: {"in":"path","name":"presentationId","required":true,"dataType":"string"},
        };
        app.get('/api/public/presentations/:presentationId',
            ...(fetchMiddlewares<RequestHandler>(PublicPresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PublicPresentationController.prototype.getPublicPresentation)),

            async function PublicPresentationController_getPublicPresentation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPublicPresentationController_getPublicPresentation, request, response });

                const controller = new PublicPresentationController();

              await templateService.apiHandler({
                methodName: 'getPublicPresentation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPublicDocController_getPublicDoc: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/public/documents/:id',
            ...(fetchMiddlewares<RequestHandler>(PublicDocController)),
            ...(fetchMiddlewares<RequestHandler>(PublicDocController.prototype.getPublicDoc)),

            async function PublicDocController_getPublicDoc(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPublicDocController_getPublicDoc, request, response });

                const controller = new PublicDocController();

              await templateService.apiHandler({
                methodName: 'getPublicDoc',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProxyController_proxyGCSImage: Record<string, TsoaRoute.ParameterSchema> = {
                url: {"in":"query","name":"url","required":true,"dataType":"string"},
        };
        app.get('/api/proxy/image',
            ...(fetchMiddlewares<RequestHandler>(ProxyController)),
            ...(fetchMiddlewares<RequestHandler>(ProxyController.prototype.proxyGCSImage)),

            async function ProxyController_proxyGCSImage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProxyController_proxyGCSImage, request, response });

                const controller = new ProxyController();

              await templateService.apiHandler({
                methodName: 'proxyGCSImage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_generatePresentation: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"GeneratePresentationRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/presentations/generate',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.generatePresentation)),

            async function PresentationController_generatePresentation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_generatePresentation, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'generatePresentation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_generateSingleSlide: Record<string, TsoaRoute.ParameterSchema> = {
                presentationId: {"in":"path","name":"presentationId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"GenerateSingleSlideRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/presentations/:presentationId/slides/generate',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.generateSingleSlide)),

            async function PresentationController_generateSingleSlide(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_generateSingleSlide, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'generateSingleSlide',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_generateDemoPresentation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/presentations/demo',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.generateDemoPresentation)),

            async function PresentationController_generateDemoPresentation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_generateDemoPresentation, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'generateDemoPresentation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_listPresentations: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/presentations',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.listPresentations)),

            async function PresentationController_listPresentations(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_listPresentations, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'listPresentations',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_getPresentation: Record<string, TsoaRoute.ParameterSchema> = {
                presentationId: {"in":"path","name":"presentationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/presentations/:presentationId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.getPresentation)),

            async function PresentationController_getPresentation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_getPresentation, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'getPresentation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_deletePresentation: Record<string, TsoaRoute.ParameterSchema> = {
                presentationId: {"in":"path","name":"presentationId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/presentations/:presentationId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.deletePresentation)),

            async function PresentationController_deletePresentation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_deletePresentation, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'deletePresentation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_updatePresentation: Record<string, TsoaRoute.ParameterSchema> = {
                presentationId: {"in":"path","name":"presentationId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdatePresentationRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/api/presentations/:presentationId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.updatePresentation)),

            async function PresentationController_updatePresentation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_updatePresentation, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'updatePresentation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPresentationController_updatePresentationStatus: Record<string, TsoaRoute.ParameterSchema> = {
                presentationId: {"in":"path","name":"presentationId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdatePresentationStatusRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/api/presentations/:presentationId/status',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(PresentationController)),
            ...(fetchMiddlewares<RequestHandler>(PresentationController.prototype.updatePresentationStatus)),

            async function PresentationController_updatePresentationStatus(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPresentationController_updatePresentationStatus, request, response });

                const controller = new PresentationController();

              await templateService.apiHandler({
                methodName: 'updatePresentationStatus',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOnboardingController_completeOnboarding: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"OnboardingCompleteRequest"},
        };
        app.post('/api/onboarding/complete',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(OnboardingController)),
            ...(fetchMiddlewares<RequestHandler>(OnboardingController.prototype.completeOnboarding)),

            async function OnboardingController_completeOnboarding(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOnboardingController_completeOnboarding, request, response });

                const controller = new OnboardingController();

              await templateService.apiHandler({
                methodName: 'completeOnboarding',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotionController_getAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                redirectPath: {"in":"query","name":"redirectPath","dataType":"string"},
        };
        app.get('/api/notion/auth-url',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotionController)),
            ...(fetchMiddlewares<RequestHandler>(NotionController.prototype.getAuthUrl)),

            async function NotionController_getAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotionController_getAuthUrl, request, response });

                const controller = new NotionController();

              await templateService.apiHandler({
                methodName: 'getAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotionController_handleNotionCallback: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                code: {"in":"query","name":"code","required":true,"dataType":"string"},
                state: {"in":"query","name":"state","dataType":"string"},
        };
        app.get('/api/notion/callback',
            ...(fetchMiddlewares<RequestHandler>(NotionController)),
            ...(fetchMiddlewares<RequestHandler>(NotionController.prototype.handleNotionCallback)),

            async function NotionController_handleNotionCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotionController_handleNotionCallback, request, response });

                const controller = new NotionController();

              await templateService.apiHandler({
                methodName: 'handleNotionCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotionController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/notion/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotionController)),
            ...(fetchMiddlewares<RequestHandler>(NotionController.prototype.getSummary)),

            async function NotionController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotionController_getSummary, request, response });

                const controller = new NotionController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotionController_getDatabases: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/notion/databases',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotionController)),
            ...(fetchMiddlewares<RequestHandler>(NotionController.prototype.getDatabases)),

            async function NotionController_getDatabases(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotionController_getDatabases, request, response });

                const controller = new NotionController();

              await templateService.apiHandler({
                methodName: 'getDatabases',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsNotionController_setDefaultDatabase: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"SetDefaultDatabaseRequest"},
        };
        app.post('/api/notion/default-database',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(NotionController)),
            ...(fetchMiddlewares<RequestHandler>(NotionController.prototype.setDefaultDatabase)),

            async function NotionController_setDefaultDatabase(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNotionController_setDefaultDatabase, request, response });

                const controller = new NotionController();

              await templateService.apiHandler({
                methodName: 'setDefaultDatabase',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMicrosoftController_getAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                redirectPath: {"in":"query","name":"redirectPath","dataType":"string"},
        };
        app.get('/api/microsoft/auth-url',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController)),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController.prototype.getAuthUrl)),

            async function MicrosoftController_getAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMicrosoftController_getAuthUrl, request, response });

                const controller = new MicrosoftController();

              await templateService.apiHandler({
                methodName: 'getAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMicrosoftController_handleMicrosoftCallback: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                code: {"in":"query","name":"code","dataType":"string"},
                state: {"in":"query","name":"state","dataType":"string"},
                error: {"in":"query","name":"error","dataType":"string"},
                error_description: {"in":"query","name":"error_description","dataType":"string"},
        };
        app.get('/api/microsoft/callback',
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController)),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController.prototype.handleMicrosoftCallback)),

            async function MicrosoftController_handleMicrosoftCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMicrosoftController_handleMicrosoftCallback, request, response });

                const controller = new MicrosoftController();

              await templateService.apiHandler({
                methodName: 'handleMicrosoftCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMicrosoftController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/microsoft/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController)),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController.prototype.getSummary)),

            async function MicrosoftController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMicrosoftController_getSummary, request, response });

                const controller = new MicrosoftController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMicrosoftController_setDefaultFolder: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"folderName":{"dataType":"string","required":true},"folderId":{"dataType":"string","required":true}}},
        };
        app.post('/api/microsoft/default-folder',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController)),
            ...(fetchMiddlewares<RequestHandler>(MicrosoftController.prototype.setDefaultFolder)),

            async function MicrosoftController_setDefaultFolder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMicrosoftController_setDefaultFolder, request, response });

                const controller = new MicrosoftController();

              await templateService.apiHandler({
                methodName: 'setDefaultFolder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLinearController_manualConnect: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"LinearManualConnectRequest"},
        };
        app.post('/api/linear/manual-connect',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LinearController)),
            ...(fetchMiddlewares<RequestHandler>(LinearController.prototype.manualConnect)),

            async function LinearController_manualConnect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLinearController_manualConnect, request, response });

                const controller = new LinearController();

              await templateService.apiHandler({
                methodName: 'manualConnect',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLinearController_getAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                redirectPath: {"in":"query","name":"redirectPath","dataType":"string"},
        };
        app.get('/api/linear/auth-url',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LinearController)),
            ...(fetchMiddlewares<RequestHandler>(LinearController.prototype.getAuthUrl)),

            async function LinearController_getAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLinearController_getAuthUrl, request, response });

                const controller = new LinearController();

              await templateService.apiHandler({
                methodName: 'getAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLinearController_handleLinearCallback: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                code: {"in":"query","name":"code","required":true,"dataType":"string"},
                state: {"in":"query","name":"state","dataType":"string"},
        };
        app.get('/api/linear/callback',
            ...(fetchMiddlewares<RequestHandler>(LinearController)),
            ...(fetchMiddlewares<RequestHandler>(LinearController.prototype.handleLinearCallback)),

            async function LinearController_handleLinearCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLinearController_handleLinearCallback, request, response });

                const controller = new LinearController();

              await templateService.apiHandler({
                methodName: 'handleLinearCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLinearController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/linear/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LinearController)),
            ...(fetchMiddlewares<RequestHandler>(LinearController.prototype.getSummary)),

            async function LinearController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLinearController_getSummary, request, response });

                const controller = new LinearController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLinearController_getTeams: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/linear/teams',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LinearController)),
            ...(fetchMiddlewares<RequestHandler>(LinearController.prototype.getTeams)),

            async function LinearController_getTeams(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLinearController_getTeams, request, response });

                const controller = new LinearController();

              await templateService.apiHandler({
                methodName: 'getTeams',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsLinearController_setDefaultTeam: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"SetDefaultTeamRequest"},
        };
        app.post('/api/linear/default-team',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(LinearController)),
            ...(fetchMiddlewares<RequestHandler>(LinearController.prototype.setDefaultTeam)),

            async function LinearController_setDefaultTeam(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLinearController_setDefaultTeam, request, response });

                const controller = new LinearController();

              await templateService.apiHandler({
                methodName: 'setDefaultTeam',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJiraController_getAuthorizationUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                state: {"in":"query","name":"state","dataType":"string"},
        };
        app.get('/api/jira/auth',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JiraController)),
            ...(fetchMiddlewares<RequestHandler>(JiraController.prototype.getAuthorizationUrl)),

            async function JiraController_getAuthorizationUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJiraController_getAuthorizationUrl, request, response });

                const controller = new JiraController();

              await templateService.apiHandler({
                methodName: 'getAuthorizationUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJiraController_handleCallback: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                code: {"in":"query","name":"code","dataType":"string"},
                state: {"in":"query","name":"state","dataType":"string"},
                error: {"in":"query","name":"error","dataType":"string"},
                errorDescription: {"in":"query","name":"error_description","dataType":"string"},
        };
        app.get('/api/jira/callback',
            ...(fetchMiddlewares<RequestHandler>(JiraController)),
            ...(fetchMiddlewares<RequestHandler>(JiraController.prototype.handleCallback)),

            async function JiraController_handleCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJiraController_handleCallback, request, response });

                const controller = new JiraController();

              await templateService.apiHandler({
                methodName: 'handleCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJiraController_manualConnect: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"JiraManualConnectRequest"},
        };
        app.post('/api/jira/manual-connect',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JiraController)),
            ...(fetchMiddlewares<RequestHandler>(JiraController.prototype.manualConnect)),

            async function JiraController_manualConnect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJiraController_manualConnect, request, response });

                const controller = new JiraController();

              await templateService.apiHandler({
                methodName: 'manualConnect',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJiraController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/jira/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JiraController)),
            ...(fetchMiddlewares<RequestHandler>(JiraController.prototype.getSummary)),

            async function JiraController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJiraController_getSummary, request, response });

                const controller = new JiraController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJiraController_getProjects: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/jira/projects',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JiraController)),
            ...(fetchMiddlewares<RequestHandler>(JiraController.prototype.getProjects)),

            async function JiraController_getProjects(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJiraController_getProjects, request, response });

                const controller = new JiraController();

              await templateService.apiHandler({
                methodName: 'getProjects',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsJiraController_setDefaultProject: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"SetDefaultProjectRequest"},
        };
        app.post('/api/jira/default-project',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(JiraController)),
            ...(fetchMiddlewares<RequestHandler>(JiraController.prototype.setDefaultProject)),

            async function JiraController_setDefaultProject(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsJiraController_setDefaultProject, request, response });

                const controller = new JiraController();

              await templateService.apiHandler({
                methodName: 'setDefaultProject',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationController_listIntegrations: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/integrations',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.listIntegrations)),

            async function IntegrationController_listIntegrations(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_listIntegrations, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'listIntegrations',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationController_getIntegration: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
        };
        app.get('/api/integrations/:provider',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.getIntegration)),

            async function IntegrationController_getIntegration(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_getIntegration, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'getIntegration',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsIntegrationController_disconnectIntegration: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                provider: {"in":"path","name":"provider","required":true,"dataType":"string"},
        };
        app.delete('/api/integrations/:provider',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(IntegrationController.prototype.disconnectIntegration)),

            async function IntegrationController_disconnectIntegration(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsIntegrationController_disconnectIntegration, request, response });

                const controller = new IntegrationController();

              await templateService.apiHandler({
                methodName: 'disconnectIntegration',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthckeckController_getStatusPayload: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/healthcheck/status',
            ...(fetchMiddlewares<RequestHandler>(HealthckeckController)),
            ...(fetchMiddlewares<RequestHandler>(HealthckeckController.prototype.getStatusPayload)),

            async function HealthckeckController_getStatusPayload(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthckeckController_getStatusPayload, request, response });

                const controller = new HealthckeckController();

              await templateService.apiHandler({
                methodName: 'getStatusPayload',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGoogleController_getAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                redirectPath: {"in":"query","name":"redirectPath","dataType":"string"},
        };
        app.get('/api/google/auth-url',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GoogleController)),
            ...(fetchMiddlewares<RequestHandler>(GoogleController.prototype.getAuthUrl)),

            async function GoogleController_getAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGoogleController_getAuthUrl, request, response });

                const controller = new GoogleController();

              await templateService.apiHandler({
                methodName: 'getAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGoogleController_handleGoogleCallback: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                code: {"in":"query","name":"code","dataType":"string"},
                state: {"in":"query","name":"state","dataType":"string"},
                error: {"in":"query","name":"error","dataType":"string"},
        };
        app.get('/api/google/callback',
            ...(fetchMiddlewares<RequestHandler>(GoogleController)),
            ...(fetchMiddlewares<RequestHandler>(GoogleController.prototype.handleGoogleCallback)),

            async function GoogleController_handleGoogleCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGoogleController_handleGoogleCallback, request, response });

                const controller = new GoogleController();

              await templateService.apiHandler({
                methodName: 'handleGoogleCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGoogleController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/google/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GoogleController)),
            ...(fetchMiddlewares<RequestHandler>(GoogleController.prototype.getSummary)),

            async function GoogleController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGoogleController_getSummary, request, response });

                const controller = new GoogleController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGoogleController_setDefaultFolder: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"folderName":{"dataType":"string","required":true},"folderId":{"dataType":"string","required":true}}},
        };
        app.post('/api/google/default-folder',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GoogleController)),
            ...(fetchMiddlewares<RequestHandler>(GoogleController.prototype.setDefaultFolder)),

            async function GoogleController_setDefaultFolder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGoogleController_setDefaultFolder, request, response });

                const controller = new GoogleController();

              await templateService.apiHandler({
                methodName: 'setDefaultFolder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGithubIntegrationController_handleWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/integrations/github/webhook',
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController.prototype.handleWebhook)),

            async function GithubIntegrationController_handleWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGithubIntegrationController_handleWebhook, request, response });

                const controller = new GithubIntegrationController();

              await templateService.apiHandler({
                methodName: 'handleWebhook',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGithubIntegrationController_bindInstallation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"installationId":{"dataType":"string","required":true}}},
        };
        app.post('/api/integrations/github/bind',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController.prototype.bindInstallation)),

            async function GithubIntegrationController_bindInstallation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGithubIntegrationController_bindInstallation, request, response });

                const controller = new GithubIntegrationController();

              await templateService.apiHandler({
                methodName: 'bindInstallation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGithubIntegrationController_getConnectedRepositories: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/integrations/github/repositories',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController.prototype.getConnectedRepositories)),

            async function GithubIntegrationController_getConnectedRepositories(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGithubIntegrationController_getConnectedRepositories, request, response });

                const controller = new GithubIntegrationController();

              await templateService.apiHandler({
                methodName: 'getConnectedRepositories',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsGithubIntegrationController_getRepositoryBranches: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                installationId: {"in":"path","name":"installationId","required":true,"dataType":"string"},
                owner: {"in":"path","name":"owner","required":true,"dataType":"string"},
                repo: {"in":"path","name":"repo","required":true,"dataType":"string"},
        };
        app.get('/api/integrations/github/installations/:installationId/repositories/:owner/:repo/branches',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController)),
            ...(fetchMiddlewares<RequestHandler>(GithubIntegrationController.prototype.getRepositoryBranches)),

            async function GithubIntegrationController_getRepositoryBranches(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsGithubIntegrationController_getRepositoryBranches, request, response });

                const controller = new GithubIntegrationController();

              await templateService.apiHandler({
                methodName: 'getRepositoryBranches',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_listContexts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/contexts',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.listContexts)),

            async function ContextController_listContexts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_listContexts, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'listContexts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_createContext: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateContextRequest"},
        };
        app.post('/api/contexts',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.createContext)),

            async function ContextController_createContext(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_createContext, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'createContext',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_getContext: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
        };
        app.get('/api/contexts/:contextId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.getContext)),

            async function ContextController_getContext(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_getContext, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'getContext',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_getContextFileContent: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                fileId: {"in":"path","name":"fileId","required":true,"dataType":"string"},
        };
        app.get('/api/contexts/:contextId/files/:fileId/content',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.getContextFileContent)),

            async function ContextController_getContextFileContent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_getContextFileContent, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'getContextFileContent',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_updateContext: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateContextRequest"},
        };
        app.put('/api/contexts/:contextId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.updateContext)),

            async function ContextController_updateContext(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_updateContext, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'updateContext',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_updateContextKeywords: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"keywords":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
        };
        app.put('/api/contexts/:contextId/keywords',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.updateContextKeywords)),

            async function ContextController_updateContextKeywords(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_updateContextKeywords, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'updateContextKeywords',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_connectGithubRepository: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ConnectGithubRequest"},
        };
        app.post('/api/contexts/:contextId/github',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.connectGithubRepository)),

            async function ContextController_connectGithubRepository(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_connectGithubRepository, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'connectGithubRepository',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_deleteContext: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
        };
        app.delete('/api/contexts/:contextId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.deleteContext)),

            async function ContextController_deleteContext(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_deleteContext, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'deleteContext',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_uploadContextFile: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                files: {"in":"formData","name":"files","required":true,"dataType":"array","array":{"dataType":"file"}},
                metadata: {"in":"query","name":"metadata","dataType":"string"},
        };
        app.post('/api/contexts/:contextId/files',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "files",
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.uploadContextFile)),

            async function ContextController_uploadContextFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_uploadContextFile, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'uploadContextFile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_deleteContextFile: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                fileId: {"in":"path","name":"fileId","required":true,"dataType":"string"},
        };
        app.delete('/api/contexts/:contextId/files/:fileId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.deleteContextFile)),

            async function ContextController_deleteContextFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_deleteContextFile, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'deleteContextFile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_retryContextFileProcessing: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                fileId: {"in":"path","name":"fileId","required":true,"dataType":"string"},
        };
        app.post('/api/contexts/:contextId/files/:fileId/retry',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.retryContextFileProcessing)),

            async function ContextController_retryContextFileProcessing(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_retryContextFileProcessing, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'retryContextFileProcessing',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_importFromGoogleDrive: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"fileIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
        };
        app.post('/api/contexts/:contextId/google-drive-import',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.importFromGoogleDrive)),

            async function ContextController_importFromGoogleDrive(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_importFromGoogleDrive, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'importFromGoogleDrive',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_importFromOneDrive: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"fileIds":{"dataType":"array","array":{"dataType":"string"},"required":true}}},
        };
        app.post('/api/contexts/:contextId/onedrive-import',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.importFromOneDrive)),

            async function ContextController_importFromOneDrive(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_importFromOneDrive, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'importFromOneDrive',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsContextController_importFromWebsite: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                contextId: {"in":"path","name":"contextId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"ImportWebsiteRequest"},
        };
        app.post('/api/contexts/:contextId/website',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ContextController)),
            ...(fetchMiddlewares<RequestHandler>(ContextController.prototype.importFromWebsite)),

            async function ContextController_importFromWebsite(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContextController_importFromWebsite, request, response });

                const controller = new ContextController();

              await templateService.apiHandler({
                methodName: 'importFromWebsite',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_getAssistantSkills: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/chat/assistant/skills',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.getAssistantSkills)),

            async function ChatController_getAssistantSkills(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_getAssistantSkills, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'getAssistantSkills',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_listThreads: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/chat/threads',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.listThreads)),

            async function ChatController_listThreads(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_listThreads, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'listThreads',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_getThread: Record<string, TsoaRoute.ParameterSchema> = {
                threadId: {"in":"path","name":"threadId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/chat/threads/:threadId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.getThread)),

            async function ChatController_getThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_getThread, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'getThread',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_uploadAttachment: Record<string, TsoaRoute.ParameterSchema> = {
                threadId: {"in":"path","name":"threadId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/api/chat/threads/:threadId/attachments',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.uploadAttachment)),

            async function ChatController_uploadAttachment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_uploadAttachment, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'uploadAttachment',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_uploadAssistantAttachment: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/api/chat/attachments',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.uploadAssistantAttachment)),

            async function ChatController_uploadAssistantAttachment(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_uploadAssistantAttachment, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'uploadAssistantAttachment',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_createThread: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateThreadRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/chat/threads',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.createThread)),

            async function ChatController_createThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_createThread, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'createThread',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_updateThread: Record<string, TsoaRoute.ParameterSchema> = {
                threadId: {"in":"path","name":"threadId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"complexityLevel":{"dataType":"string"},"projectIds":{"dataType":"array","array":{"dataType":"string"}},"contextIds":{"dataType":"array","array":{"dataType":"string"}},"title":{"dataType":"string"}}},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/api/chat/threads/:threadId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.updateThread)),

            async function ChatController_updateThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_updateThread, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'updateThread',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_deleteThread: Record<string, TsoaRoute.ParameterSchema> = {
                threadId: {"in":"path","name":"threadId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/chat/threads/:threadId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.deleteThread)),

            async function ChatController_deleteThread(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_deleteThread, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'deleteThread',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_sendMessage: Record<string, TsoaRoute.ParameterSchema> = {
                threadId: {"in":"path","name":"threadId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"SendMessageRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/chat/threads/:threadId/messages',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.sendMessage)),

            async function ChatController_sendMessage(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_sendMessage, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'sendMessage',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_sendMessageLive: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LiveChatMessageRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/chat/live',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.sendMessageLive)),

            async function ChatController_sendMessageLive(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_sendMessageLive, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'sendMessageLive',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsChatController_generateLiveSummary: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LiveSummaryRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/chat/live-summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ChatController)),
            ...(fetchMiddlewares<RequestHandler>(ChatController.prototype.generateLiveSummary)),

            async function ChatController_generateLiveSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsChatController_generateLiveSummary, request, response });

                const controller = new ChatController();

              await templateService.apiHandler({
                methodName: 'generateLiveSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBrandThemeController_list: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/brand-themes',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController)),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController.prototype.list)),

            async function BrandThemeController_list(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBrandThemeController_list, request, response });

                const controller = new BrandThemeController();

              await templateService.apiHandler({
                methodName: 'list',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBrandThemeController_getById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/brand-themes/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController)),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController.prototype.getById)),

            async function BrandThemeController_getById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBrandThemeController_getById, request, response });

                const controller = new BrandThemeController();

              await templateService.apiHandler({
                methodName: 'getById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBrandThemeController_create: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateBrandThemeInput"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/brand-themes',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController)),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController.prototype.create)),

            async function BrandThemeController_create(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBrandThemeController_create, request, response });

                const controller = new BrandThemeController();

              await templateService.apiHandler({
                methodName: 'create',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBrandThemeController_analyzeUrl: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"AnalyzeUrlRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/brand-themes/analyze-url',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController)),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController.prototype.analyzeUrl)),

            async function BrandThemeController_analyzeUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBrandThemeController_analyzeUrl, request, response });

                const controller = new BrandThemeController();

              await templateService.apiHandler({
                methodName: 'analyzeUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBrandThemeController_update: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"Partial_CreateBrandThemeInput_"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.patch('/api/brand-themes/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController)),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController.prototype.update)),

            async function BrandThemeController_update(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBrandThemeController_update, request, response });

                const controller = new BrandThemeController();

              await templateService.apiHandler({
                methodName: 'update',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBrandThemeController_delete: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/api/brand-themes/:id',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController)),
            ...(fetchMiddlewares<RequestHandler>(BrandThemeController.prototype.delete)),

            async function BrandThemeController_delete(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBrandThemeController_delete, request, response });

                const controller = new BrandThemeController();

              await templateService.apiHandler({
                methodName: 'delete',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_getSubscription: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/billing/subscription',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.getSubscription)),

            async function BillingController_getSubscription(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_getSubscription, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'getSubscription',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_getUsageLimits: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/billing/usage-limits',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.getUsageLimits)),

            async function BillingController_getUsageLimits(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_getUsageLimits, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'getUsageLimits',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_getCatalog: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/billing/catalog',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.getCatalog)),

            async function BillingController_getCatalog(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_getCatalog, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'getCatalog',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_createCheckout: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CheckoutBody"},
        };
        app.post('/api/billing/checkout',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.createCheckout)),

            async function BillingController_createCheckout(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_createCheckout, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'createCheckout',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_createPortal: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/billing/portal',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.createPortal)),

            async function BillingController_createPortal(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_createPortal, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'createPortal',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_syncSession: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"sessionId":{"dataType":"string","required":true}}},
        };
        app.post('/api/billing/sync-session',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.syncSession)),

            async function BillingController_syncSession(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_syncSession, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'syncSession',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_syncPortal: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/billing/sync-portal',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.syncPortal)),

            async function BillingController_syncPortal(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_syncPortal, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'syncPortal',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsBillingController_handleWebhook: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.post('/api/billing/webhook',
            ...(fetchMiddlewares<RequestHandler>(BillingController)),
            ...(fetchMiddlewares<RequestHandler>(BillingController.prototype.handleWebhook)),

            async function BillingController_handleWebhook(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsBillingController_handleWebhook, request, response });

                const controller = new BillingController();

              await templateService.apiHandler({
                methodName: 'handleWebhook',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAudioController_transcribeChunk: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                micFile: {"in":"formData","name":"mic","dataType":"file"},
                sysFile: {"in":"formData","name":"system","dataType":"file"},
        };
        app.post('/api/audio/transcribe-chunk',
            authenticateMiddleware([{"ClientLevel":[]}]),
            upload.fields([
                {
                    name: "mic",
                    maxCount: 1
                },
                {
                    name: "system",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(AudioController)),
            ...(fetchMiddlewares<RequestHandler>(AudioController.prototype.transcribeChunk)),

            async function AudioController_transcribeChunk(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAudioController_transcribeChunk, request, response });

                const controller = new AudioController();

              await templateService.apiHandler({
                methodName: 'transcribeChunk',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAsanaController_getAuthorizationUrl: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                state: {"in":"query","name":"state","dataType":"string"},
        };
        app.get('/api/asana/auth',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AsanaController)),
            ...(fetchMiddlewares<RequestHandler>(AsanaController.prototype.getAuthorizationUrl)),

            async function AsanaController_getAuthorizationUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAsanaController_getAuthorizationUrl, request, response });

                const controller = new AsanaController();

              await templateService.apiHandler({
                methodName: 'getAuthorizationUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAsanaController_handleCallback: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                code: {"in":"query","name":"code","dataType":"string"},
                state: {"in":"query","name":"state","dataType":"string"},
                error: {"in":"query","name":"error","dataType":"string"},
        };
        app.get('/api/asana/callback',
            ...(fetchMiddlewares<RequestHandler>(AsanaController)),
            ...(fetchMiddlewares<RequestHandler>(AsanaController.prototype.handleCallback)),

            async function AsanaController_handleCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAsanaController_handleCallback, request, response });

                const controller = new AsanaController();

              await templateService.apiHandler({
                methodName: 'handleCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAsanaController_manualConnect: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"AsanaManualConnectRequest"},
        };
        app.post('/api/asana/manual-connect',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AsanaController)),
            ...(fetchMiddlewares<RequestHandler>(AsanaController.prototype.manualConnect)),

            async function AsanaController_manualConnect(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAsanaController_manualConnect, request, response });

                const controller = new AsanaController();

              await templateService.apiHandler({
                methodName: 'manualConnect',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAsanaController_getSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/asana/summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AsanaController)),
            ...(fetchMiddlewares<RequestHandler>(AsanaController.prototype.getSummary)),

            async function AsanaController_getSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAsanaController_getSummary, request, response });

                const controller = new AsanaController();

              await templateService.apiHandler({
                methodName: 'getSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAsanaController_getProjects: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/asana/projects',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AsanaController)),
            ...(fetchMiddlewares<RequestHandler>(AsanaController.prototype.getProjects)),

            async function AsanaController_getProjects(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAsanaController_getProjects, request, response });

                const controller = new AsanaController();

              await templateService.apiHandler({
                methodName: 'getProjects',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAsanaController_setDefaultProject: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"AsanaSetDefaultProjectRequest"},
        };
        app.post('/api/asana/default-project',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AsanaController)),
            ...(fetchMiddlewares<RequestHandler>(AsanaController.prototype.setDefaultProject)),

            async function AsanaController_setDefaultProject(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAsanaController_setDefaultProject, request, response });

                const controller = new AsanaController();

              await templateService.apiHandler({
                methodName: 'setDefaultProject',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAnalyticsController_getDashboardAnalytics: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                period: {"default":"30d","in":"query","name":"period","dataType":"union","subSchemas":[{"dataType":"enum","enums":["7d"]},{"dataType":"enum","enums":["30d"]},{"dataType":"enum","enums":["90d"]},{"dataType":"enum","enums":["all"]}]},
        };
        app.get('/api/analytics/dashboard',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AnalyticsController)),
            ...(fetchMiddlewares<RequestHandler>(AnalyticsController.prototype.getDashboardAnalytics)),

            async function AnalyticsController_getDashboardAnalytics(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAnalyticsController_getDashboardAnalytics, request, response });

                const controller = new AnalyticsController();

              await templateService.apiHandler({
                methodName: 'getDashboardAnalytics',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiUsageController_getUsageMetrics: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                limit: {"default":50,"in":"query","name":"limit","dataType":"double"},
                feature: {"in":"query","name":"feature","dataType":"string"},
                provider: {"in":"query","name":"provider","dataType":"string"},
                model: {"in":"query","name":"model","dataType":"string"},
                targetUserId: {"in":"query","name":"targetUserId","dataType":"string"},
                currentMonthOnly: {"in":"query","name":"currentMonthOnly","dataType":"boolean"},
        };
        app.get('/api/ai-usage',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AiUsageController)),
            ...(fetchMiddlewares<RequestHandler>(AiUsageController.prototype.getUsageMetrics)),

            async function AiUsageController_getUsageMetrics(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiUsageController_getUsageMetrics, request, response });

                const controller = new AiUsageController();

              await templateService.apiHandler({
                methodName: 'getUsageMetrics',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiUsageController_getWorkspaceSummary: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/ai-usage/workspace-summary',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AiUsageController)),
            ...(fetchMiddlewares<RequestHandler>(AiUsageController.prototype.getWorkspaceSummary)),

            async function AiUsageController_getWorkspaceSummary(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiUsageController_getWorkspaceSummary, request, response });

                const controller = new AiUsageController();

              await templateService.apiHandler({
                methodName: 'getWorkspaceSummary',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiUsageController_getPricingMap: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/ai-usage/pricing',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AiUsageController)),
            ...(fetchMiddlewares<RequestHandler>(AiUsageController.prototype.getPricingMap)),

            async function AiUsageController_getPricingMap(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiUsageController_getPricingMap, request, response });

                const controller = new AiUsageController();

              await templateService.apiHandler({
                methodName: 'getPricingMap',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAiController_getModels: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/ai/models',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AiController)),
            ...(fetchMiddlewares<RequestHandler>(AiController.prototype.getModels)),

            async function AiController_getModels(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAiController_getModels, request, response });

                const controller = new AiController();

              await templateService.apiHandler({
                methodName: 'getModels',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAdminEmailController_getTemplates: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/admin/emails/templates',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AdminEmailController)),
            ...(fetchMiddlewares<RequestHandler>(AdminEmailController.prototype.getTemplates)),

            async function AdminEmailController_getTemplates(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAdminEmailController_getTemplates, request, response });

                const controller = new AdminEmailController();

              await templateService.apiHandler({
                methodName: 'getTemplates',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAccountController_getCustomTheme: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/account/theme',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AccountController)),
            ...(fetchMiddlewares<RequestHandler>(AccountController.prototype.getCustomTheme)),

            async function AccountController_getCustomTheme(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAccountController_getCustomTheme, request, response });

                const controller = new AccountController();

              await templateService.apiHandler({
                methodName: 'getCustomTheme',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAccountController_upsertCustomTheme: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"UpdateCustomThemeRequest"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.put('/account/theme',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AccountController)),
            ...(fetchMiddlewares<RequestHandler>(AccountController.prototype.upsertCustomTheme)),

            async function AccountController_upsertCustomTheme(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAccountController_upsertCustomTheme, request, response });

                const controller = new AccountController();

              await templateService.apiHandler({
                methodName: 'upsertCustomTheme',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAccountController_deleteUser: Record<string, TsoaRoute.ParameterSchema> = {
                userId: {"in":"path","name":"userId","required":true,"dataType":"string"},
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/account/user/:userId',
            authenticateMiddleware([{"AdminOnly":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AccountController)),
            ...(fetchMiddlewares<RequestHandler>(AccountController.prototype.deleteUser)),

            async function AccountController_deleteUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAccountController_deleteUser, request, response });

                const controller = new AccountController();

              await templateService.apiHandler({
                methodName: 'deleteUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAccountController_deleteMyAccount: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.delete('/account/self',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AccountController)),
            ...(fetchMiddlewares<RequestHandler>(AccountController.prototype.deleteMyAccount)),

            async function AccountController_deleteMyAccount(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAccountController_deleteMyAccount, request, response });

                const controller = new AccountController();

              await templateService.apiHandler({
                methodName: 'deleteMyAccount',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_getMyWorkspaces: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/workspaces',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.getMyWorkspaces)),

            async function WorkspaceController_getMyWorkspaces(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_getMyWorkspaces, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'getMyWorkspaces',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_getWorkspaceMembers: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/workspaces/members',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.getWorkspaceMembers)),

            async function WorkspaceController_getWorkspaceMembers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_getWorkspaceMembers, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'getWorkspaceMembers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_createWorkspace: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateWorkspaceRequest"},
        };
        app.post('/api/workspaces',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.createWorkspace)),

            async function WorkspaceController_createWorkspace(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_createWorkspace, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'createWorkspace',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_inviteMember: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"InviteMemberRequest"},
        };
        app.post('/api/workspaces/members/invite',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.inviteMember)),

            async function WorkspaceController_inviteMember(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_inviteMember, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'inviteMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_updateWorkspaceMember: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                memberId: {"in":"path","name":"memberId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateMemberRequest"},
        };
        app.put('/api/workspaces/members/:memberId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.updateWorkspaceMember)),

            async function WorkspaceController_updateWorkspaceMember(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_updateWorkspaceMember, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'updateWorkspaceMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_removeWorkspaceMember: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                memberId: {"in":"path","name":"memberId","required":true,"dataType":"string"},
        };
        app.delete('/api/workspaces/members/:memberId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.removeWorkspaceMember)),

            async function WorkspaceController_removeWorkspaceMember(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_removeWorkspaceMember, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'removeWorkspaceMember',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_cancelInvitation: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                invitationId: {"in":"path","name":"invitationId","required":true,"dataType":"string"},
        };
        app.delete('/api/workspaces/invitations/:invitationId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.cancelInvitation)),

            async function WorkspaceController_cancelInvitation(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_cancelInvitation, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'cancelInvitation',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsWorkspaceController_updateWorkspaceSettings: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateWorkspaceSettingsRequest"},
        };
        app.put('/api/workspaces/settings',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController)),
            ...(fetchMiddlewares<RequestHandler>(WorkspaceController.prototype.updateWorkspaceSettings)),

            async function WorkspaceController_updateWorkspaceSettings(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsWorkspaceController_updateWorkspaceSettings, request, response });

                const controller = new WorkspaceController();

              await templateService.apiHandler({
                methodName: 'updateWorkspaceSettings',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMcpTokenController_createToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateMcpTokenRequest"},
        };
        app.post('/api/mcp-tokens',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(McpTokenController)),
            ...(fetchMiddlewares<RequestHandler>(McpTokenController.prototype.createToken)),

            async function McpTokenController_createToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMcpTokenController_createToken, request, response });

                const controller = new McpTokenController();

              await templateService.apiHandler({
                methodName: 'createToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMcpTokenController_listTokens: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/api/mcp-tokens',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(McpTokenController)),
            ...(fetchMiddlewares<RequestHandler>(McpTokenController.prototype.listTokens)),

            async function McpTokenController_listTokens(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMcpTokenController_listTokens, request, response });

                const controller = new McpTokenController();

              await templateService.apiHandler({
                methodName: 'listTokens',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMcpTokenController_revokeToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                tokenId: {"in":"path","name":"tokenId","required":true,"dataType":"string"},
        };
        app.delete('/api/mcp-tokens/:tokenId',
            authenticateMiddleware([{"BearerAuth":[]}]),
            ...(fetchMiddlewares<RequestHandler>(McpTokenController)),
            ...(fetchMiddlewares<RequestHandler>(McpTokenController.prototype.revokeToken)),

            async function McpTokenController_revokeToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMcpTokenController_revokeToken, request, response });

                const controller = new McpTokenController();

              await templateService.apiHandler({
                methodName: 'revokeToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDiagramController_getUserDiagrams: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/api/diagrams',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DiagramController)),
            ...(fetchMiddlewares<RequestHandler>(DiagramController.prototype.getUserDiagrams)),

            async function DiagramController_getUserDiagrams(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDiagramController_getUserDiagrams, request, response });

                const controller = new DiagramController();

              await templateService.apiHandler({
                methodName: 'getUserDiagrams',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDiagramController_getDiagram: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                diagramId: {"in":"path","name":"diagramId","required":true,"dataType":"string"},
        };
        app.get('/api/diagrams/:diagramId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DiagramController)),
            ...(fetchMiddlewares<RequestHandler>(DiagramController.prototype.getDiagram)),

            async function DiagramController_getDiagram(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDiagramController_getDiagram, request, response });

                const controller = new DiagramController();

              await templateService.apiHandler({
                methodName: 'getDiagram',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDiagramController_createDiagram: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateDiagramRequest"},
        };
        app.post('/api/diagrams',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DiagramController)),
            ...(fetchMiddlewares<RequestHandler>(DiagramController.prototype.createDiagram)),

            async function DiagramController_createDiagram(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDiagramController_createDiagram, request, response });

                const controller = new DiagramController();

              await templateService.apiHandler({
                methodName: 'createDiagram',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDiagramController_updateDiagram: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                diagramId: {"in":"path","name":"diagramId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateDiagramRequest"},
        };
        app.put('/api/diagrams/:diagramId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DiagramController)),
            ...(fetchMiddlewares<RequestHandler>(DiagramController.prototype.updateDiagram)),

            async function DiagramController_updateDiagram(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDiagramController_updateDiagram, request, response });

                const controller = new DiagramController();

              await templateService.apiHandler({
                methodName: 'updateDiagram',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDiagramController_deleteDiagram: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                diagramId: {"in":"path","name":"diagramId","required":true,"dataType":"string"},
        };
        app.delete('/api/diagrams/:diagramId',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DiagramController)),
            ...(fetchMiddlewares<RequestHandler>(DiagramController.prototype.deleteDiagram)),

            async function DiagramController_deleteDiagram(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDiagramController_deleteDiagram, request, response });

                const controller = new DiagramController();

              await templateService.apiHandler({
                methodName: 'deleteDiagram',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsDiagramController_assistDiagram: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                diagramId: {"in":"path","name":"diagramId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"DiagramAssistantRequest"},
        };
        app.post('/api/diagrams/:diagramId/assistant',
            authenticateMiddleware([{"ClientLevel":[]}]),
            ...(fetchMiddlewares<RequestHandler>(DiagramController)),
            ...(fetchMiddlewares<RequestHandler>(DiagramController.prototype.assistDiagram)),

            async function DiagramController_assistDiagram(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsDiagramController_assistDiagram, request, response });

                const controller = new DiagramController();

              await templateService.apiHandler({
                methodName: 'assistDiagram',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPublicDiagramController_getPublicDiagram: Record<string, TsoaRoute.ParameterSchema> = {
                diagramId: {"in":"path","name":"diagramId","required":true,"dataType":"string"},
        };
        app.get('/api/public/diagrams/:diagramId',
            ...(fetchMiddlewares<RequestHandler>(PublicDiagramController)),
            ...(fetchMiddlewares<RequestHandler>(PublicDiagramController.prototype.getPublicDiagram)),

            async function PublicDiagramController_getPublicDiagram(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPublicDiagramController_getPublicDiagram, request, response });

                const controller = new PublicDiagramController();

              await templateService.apiHandler({
                methodName: 'getPublicDiagram',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
