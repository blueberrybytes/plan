/* eslint-disable @typescript-eslint/no-explicit-any */
import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/auth/authSlice";
import appReducer from "./slices/app/appSlice";
import chatHomeReducer from "./slices/chatHome/chatHomeSlice";
import preferencesReducer from "./slices/preferences/preferencesSlice";
import { resetStore } from "./actions";
import { authApi } from "./apis/authApi";
import { projectApi } from "./apis/projectApi";
import { accountApi } from "./apis/accountApi";
import { contextApi } from "./apis/contextApi";
import { jiraApi } from "./apis/jiraApi";
import { linearApi } from "./apis/linearApi";
import { integrationApi } from "./apis/integrationApi";
import { chatApi } from "./apis/chatApi";
import { slideApi } from "./apis/slideApi";
import { transcriptApi } from "./apis/transcriptApi";
import { docApi } from "./apis/docApi";
import { brandThemeApi } from "./apis/brandThemeApi";
import { diagramApi } from "./apis/diagramApi";
import { aiApi } from "./apis/aiApi";
import { taskApi } from "./apis/taskApi";
import { trelloApi } from "./apis/trelloApi";
import { twentyApi } from "./apis/twentyApi";
import { notionApi } from "./apis/notionApi";
import { asanaApi } from "./apis/asanaApi";
import { aiUsageApi } from "./apis/aiUsageApi";
import { userApi } from "./apis/userApi";
import { adminApi } from "./apis/adminApi";
import { workspaceApi } from "./apis/workspaceApi";
import { onboardingApi } from "./apis/onboardingApi";
import { analyticsApi } from "./apis/analyticsApi";
import { mcpApi } from "./apis/mcpApi";
import { billingApi } from "./apis/billingApi";

// Define the combined reducers
const appReducers = combineReducers({
  app: appReducer,
  auth: authReducer,
  chatHome: chatHomeReducer,
  preferences: preferencesReducer,
  [authApi.reducerPath]: authApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [accountApi.reducerPath]: accountApi.reducer,
  [contextApi.reducerPath]: contextApi.reducer,
  [jiraApi.reducerPath]: jiraApi.reducer,
  [linearApi.reducerPath]: linearApi.reducer,
  [integrationApi.reducerPath]: integrationApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [slideApi.reducerPath]: slideApi.reducer,
  [transcriptApi.reducerPath]: transcriptApi.reducer,
  [docApi.reducerPath]: docApi.reducer,
  [brandThemeApi.reducerPath]: brandThemeApi.reducer,
  [diagramApi.reducerPath]: diagramApi.reducer,
  [aiApi.reducerPath]: aiApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [trelloApi.reducerPath]: trelloApi.reducer,
  [twentyApi.reducerPath]: twentyApi.reducer,
  [notionApi.reducerPath]: notionApi.reducer,
  [asanaApi.reducerPath]: asanaApi.reducer,
  [aiUsageApi.reducerPath]: aiUsageApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [adminApi.reducerPath]: adminApi.reducer,
  [workspaceApi.reducerPath]: workspaceApi.reducer,
  [onboardingApi.reducerPath]: onboardingApi.reducer,
  [analyticsApi.reducerPath]: analyticsApi.reducer,
  [mcpApi.reducerPath]: mcpApi.reducer,
  [billingApi.reducerPath]: billingApi.reducer,
});

// Create a root reducer that can handle the reset action
const rootReducers = (state: any, action: any) => {
  // When the reset action is dispatched, return undefined state
  // which will cause each reducer to return its initial state
  if (action.type === resetStore.type) {
    // Clear the state but keep some non-sensitive data if needed
    state = undefined;
  }

  // Intercept Workspace Switching to globally flush all workspace-dependent caches
  // This guarantees absolute zero data bleeding between workspaces and forces refetches
  if (action.type === "app/setActiveWorkspaceId") {
    state = {
      ...state,
      [projectApi.reducerPath]: undefined,
      [contextApi.reducerPath]: undefined,
      [jiraApi.reducerPath]: undefined,
      [linearApi.reducerPath]: undefined,
      [integrationApi.reducerPath]: undefined,
      [chatApi.reducerPath]: undefined,
      [slideApi.reducerPath]: undefined,
      [transcriptApi.reducerPath]: undefined,
      [docApi.reducerPath]: undefined,
      [brandThemeApi.reducerPath]: undefined,
      [diagramApi.reducerPath]: undefined,
      [aiApi.reducerPath]: undefined,
      [taskApi.reducerPath]: undefined,
      [trelloApi.reducerPath]: undefined,
      [twentyApi.reducerPath]: undefined,
      [notionApi.reducerPath]: undefined,
      [asanaApi.reducerPath]: undefined,
      [aiUsageApi.reducerPath]: undefined,
      [analyticsApi.reducerPath]: undefined,
      [billingApi.reducerPath]: undefined,
      // Note: We deliberately exclude authApi, accountApi, userApi, adminApi, onboardingApi
      // because their context is global (User-level) and doesn't rotate.
      // We also exclude workspaceApi so the switcher UI doesn't stutter/reload its dropdown list.
    };
  }

  // Pass the state and action to the combined reducers
  return appReducers(state, action);
};

export default rootReducers;
