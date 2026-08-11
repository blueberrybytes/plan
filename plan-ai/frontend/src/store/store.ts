/* eslint-disable @typescript-eslint/no-explicit-any */
import { configureStore, Tuple } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import createSagaMiddleware from "redux-saga";
import { persistStore, persistReducer, createMigrate } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Defaults to localStorage for web
import rootSaga from "./rootSaga";
import rootReducer from "./rootReducers";
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

const migrations = {
  1: (state: any) => {
    console.debug("Executing migration 1");
    return {
      ...state,
    };
  },
};

const persistConfig = {
  key: "root",
  storage,
  // billingApi holds live server state (catalog, subscription, usage limits).
  // Persisting it served a STALE catalog from localStorage after deploys — e.g.
  // a cached catalog without `byokTrialDays` hid the free-trial badge until the
  // cache happened to refetch. Never persist it; always fetch fresh.
  blacklist: ["docApi", "slideApi", "authApi", "transcriptApi", "billingApi"],
  version: 1,
  migrate: createMigrate(migrations, { debug: false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the store
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    new Tuple(
      ...getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }),
      sagaMiddleware,
      authApi.middleware,
      projectApi.middleware,
      accountApi.middleware,
      contextApi.middleware,
      jiraApi.middleware,
      linearApi.middleware,
      integrationApi.middleware,
      chatApi.middleware,
      slideApi.middleware,
      transcriptApi.middleware,
      docApi.middleware,
      brandThemeApi.middleware,
      diagramApi.middleware,
      aiApi.middleware,
      taskApi.middleware,
      trelloApi.middleware,
      twentyApi.middleware,
      notionApi.middleware,
      asanaApi.middleware,
      aiUsageApi.middleware,
      userApi.middleware,
      adminApi.middleware,
      workspaceApi.middleware,
      onboardingApi.middleware,
      analyticsApi.middleware,
      mcpApi.middleware,
      billingApi.middleware,
    ),
});

// Run the root saga
sagaMiddleware.run(rootSaga);
// Configure persistor
export const persistor = persistStore(store);

// Enable RTK Query listener behavior (e.g. refetchOnFocus, refetchOnReconnect, pollingInterval)
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export default store;
