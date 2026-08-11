/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  TextField,
  useTheme,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CodeIcon from "@mui/icons-material/Code";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";

import githubSvg from "../icons/github.svg";
import notionSvg from "../icons/notion.svg";
import jiraSvg from "../icons/jira.svg";
import linearSvg from "../icons/linear.svg";
import trelloSvg from "../icons/trello.svg";
import googleDriveSvg from "../icons/google-drive.svg";
import oneDriveSvg from "../icons/one-drive.svg";
import asanaSvg from "../icons/asana.svg";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SidebarLayout from "../components/layout/SidebarLayout";
import { selectUser } from "../store/slices/auth/authSelector";
import { setToastMessage } from "../store/slices/app/appSlice";
import { selectActiveWorkspaceId } from "../store/slices/app/appSelector";
import { useGetMyWorkspacesQuery } from "../store/apis/workspaceApi";
import {
  useListMcpTokensQuery,
  useCreateMcpTokenMutation,
  useRevokeMcpTokenMutation,
} from "../store/apis/mcpApi";
import {
  IntegrationProviderType,
  useListIntegrationsQuery,
  useBindGithubInstallationMutation,
  useGetGithubRepositoriesQuery,
  useLazyGetGoogleAuthUrlQuery,
  useLazyGetMicrosoftAuthUrlQuery,
  GithubRepository,
  integrationApi,
  useDisconnectIntegrationMutation,
  useSetGoogleDefaultFolderMutation,
  useSetMicrosoftDefaultFolderMutation,
} from "../store/apis/integrationApi";
import {
  useConnectJiraManuallyMutation,
  useLazyGetJiraAuthorizationUrlQuery,
  useGetJiraSummaryQuery,
  useGetJiraProjectsQuery,
  useSetJiraDefaultProjectMutation,
} from "../store/apis/jiraApi";
import {
  useConnectLinearManuallyMutation,
  useGetLinearSummaryQuery,
  useGetLinearTeamsQuery,
  useSetLinearDefaultTeamMutation,
  useLazyGetLinearAuthUrlQuery,
} from "../store/apis/linearApi";
import {
  useConnectTrelloManuallyMutation,
  useGetTrelloSummaryQuery,
  useGetTrelloBoardsQuery,
  useGetTrelloListsQuery,
  useSetTrelloDefaultBoardListMutation,
  useLazyGetTrelloAuthorizationUrlQuery,
  useAutoConnectTrelloMutation,
} from "../store/apis/trelloApi";
import { useConnectTwentyManuallyMutation } from "../store/apis/twentyApi";
import {
  useLazyGetNotionAuthUrlQuery,
  useGetNotionSummaryQuery,
  useGetNotionDatabasesQuery,
  useSetNotionDefaultDatabaseMutation,
} from "../store/apis/notionApi";
import {
  useLazyGetAsanaAuthUrlQuery,
  useConnectAsanaManuallyMutation,
  useGetAsanaSummaryQuery,
  useGetAsanaProjectsQuery,
  useSetAsanaDefaultProjectMutation,
} from "../store/apis/asanaApi";
import type { components } from "../types/api";
import { useTranslation } from "react-i18next";
import { useGooglePicker } from "../hooks/useGooglePicker";
import { useOneDrivePicker } from "../hooks/useOneDrivePicker";
import { HowToConnectDialog, HowToProvider } from "../components/integrations/HowToConnectDialog";
import McpPanel from "../components/integrations/McpPanel";
import IconButton from "@mui/material/IconButton";

const PROVIDER_TAB_PARAM = "provider";

const STATUS_PARAM = "status";
const MESSAGE_PARAM = "message";

type ProviderTabValue =
  | "jira"
  | "linear"
  | "trello"
  | "twenty"
  | "github"
  | "google"
  | "notion"
  | "microsoft"
  | "asana"
  | "plan-ai-mcp";

type ProviderConfig = {
  tabValue: ProviderTabValue;
  provider: IntegrationProviderType;
  labelKey: string;
  descriptionKey: string;
  connectCtaKey?: string;
  comingSoon?: boolean;
  comingSoonMessageKey?: string;
  notConnectedKey?: string;
  isBeta?: boolean;
  isWorkspaceLevel: boolean;
};

type UserIntegrationSummary = components["schemas"]["IntegrationSummaryResponse"];

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    tabValue: "jira",
    provider: "JIRA",
    labelKey: "integrationsPage.providers.jira.label",
    descriptionKey: "integrationsPage.providers.jira.description",
    connectCtaKey: "integrationsPage.providers.jira.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.jira.notConnected",
    isWorkspaceLevel: true,
  },
  {
    tabValue: "linear",
    provider: "LINEAR",
    labelKey: "integrationsPage.providers.linear.label",
    descriptionKey: "integrationsPage.providers.linear.description",
    connectCtaKey: "integrationsPage.providers.linear.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.linear.notConnected",
    isWorkspaceLevel: true,
  },
  {
    tabValue: "trello",
    provider: "TRELLO",
    labelKey: "integrationsPage.providers.trello.label",
    descriptionKey: "integrationsPage.providers.trello.description",
    connectCtaKey: "integrationsPage.providers.trello.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.trello.notConnected",
    isWorkspaceLevel: true,
  },
  {
    tabValue: "asana",
    provider: "ASANA",
    labelKey: "integrationsPage.providers.asana.label",
    descriptionKey: "integrationsPage.providers.asana.description",
    connectCtaKey: "integrationsPage.providers.asana.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.asana.notConnected",
    isWorkspaceLevel: true,
  },
  {
    tabValue: "twenty",
    provider: "TWENTY",
    labelKey: "integrationsPage.providers.twenty.label",
    descriptionKey: "integrationsPage.providers.twenty.description",
    connectCtaKey: "integrationsPage.providers.twenty.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.twenty.notConnected",
    isWorkspaceLevel: true,
  },
  {
    tabValue: "notion",
    provider: "NOTION",
    labelKey: "integrationsPage.providers.notion.label",
    descriptionKey: "integrationsPage.providers.notion.description",
    connectCtaKey: "integrationsPage.providers.notion.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.notion.notConnected",
    //isBeta: true,
    isWorkspaceLevel: true,
  },
  {
    tabValue: "github",
    provider: "GITHUB",
    labelKey: "integrationsPage.providers.github.label",
    descriptionKey: "integrationsPage.providers.github.description",
    connectCtaKey: "integrationsPage.providers.github.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.github.notConnected",
    isWorkspaceLevel: false,
  },
  {
    tabValue: "google",
    provider: "GOOGLE_DRIVE",
    labelKey: "integrationsPage.providers.google.label",
    descriptionKey: "integrationsPage.providers.google.description",
    connectCtaKey: "integrationsPage.providers.google.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.google.notConnected",
    //isBeta: true,
    isWorkspaceLevel: true,
  },
  {
    tabValue: "microsoft",
    provider: "ONEDRIVE",
    labelKey: "integrationsPage.providers.microsoft.label",
    descriptionKey: "integrationsPage.providers.microsoft.description",
    connectCtaKey: "integrationsPage.providers.microsoft.connectCta",
    comingSoon: false,
    notConnectedKey: "integrationsPage.providers.microsoft.notConnected",
    //isBeta: true,
    isWorkspaceLevel: true,
  },
];

const defaultTab: ProviderTabValue = "jira";

const Integrations: React.FC = () => {
  const user = useSelector(selectUser);
  const activeWorkspaceId = useSelector(selectActiveWorkspaceId);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const theme = useTheme();

  const { data: workspaces } = useGetMyWorkspacesQuery();
  const activeWorkspace = workspaces?.find((w) => w.id === activeWorkspaceId);
  const canManageIntegrations =
    activeWorkspace?.role === "OWNER" || activeWorkspace?.role === "ADMIN";
  const { provider: providerParam } = useParams<{ provider?: string }>();
  const [searchParams] = useSearchParams();
  const normalizeProviderTab = (value: string | null | undefined): ProviderTabValue | null => {
    if (!value) {
      return null;
    }
    const lower = value.toLowerCase();
    // Handle the MCP tab which is not in PROVIDER_CONFIGS
    if (lower === "plan-ai-mcp") return "plan-ai-mcp";
    const match = PROVIDER_CONFIGS.find((config) => config.tabValue.toLowerCase() === lower);
    return match?.tabValue ?? null;
  };

  const providerFromPath = useMemo(() => normalizeProviderTab(providerParam), [providerParam]);

  const providerFromQuery = useMemo(
    () => normalizeProviderTab(searchParams.get(PROVIDER_TAB_PARAM)),
    [searchParams],
  );

  const activeTab: ProviderTabValue = providerFromPath ?? providerFromQuery ?? defaultTab;
  const navigate = useNavigate();

  const [triggerJiraAuthorization, { isFetching: isJiraAuthLoading }] =
    useLazyGetJiraAuthorizationUrlQuery();

  const [jiraAuthError, setJiraAuthError] = useState<string | null>(null);
  const [jiraSiteUrl, setJiraSiteUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraApiToken, setJiraApiToken] = useState("");
  const [connectJiraManually, { isLoading: isJiraManualConnecting }] =
    useConnectJiraManuallyMutation();

  const [trelloAuthError, setTrelloAuthError] = useState<string | null>(null);

  const [helpDialogProvider, setHelpDialogProvider] = useState<HowToProvider | null>(null);

  const [linearAuthError, setLinearAuthError] = useState<string | null>(null);
  const [linearApiKey, setLinearApiKey] = useState("");
  const [connectLinearManually, { isLoading: isLinearManualConnecting }] =
    useConnectLinearManuallyMutation();
  const [triggerLinearAuthorization, { isFetching: isLinearAuthLoading }] =
    useLazyGetLinearAuthUrlQuery();

  const [triggerNotionAuthorization, { isFetching: isNotionAuthLoading }] =
    useLazyGetNotionAuthUrlQuery();
  const [notionAuthError, setNotionAuthError] = useState<string | null>(null);

  const [triggerAsanaAuthorization, { isFetching: isAsanaAuthLoading }] =
    useLazyGetAsanaAuthUrlQuery();
  const [asanaAuthError, setAsanaAuthError] = useState<string | null>(null);
  const [asanaPat, setAsanaPat] = useState("");
  const [connectAsanaManually, { isLoading: isAsanaManualConnecting }] =
    useConnectAsanaManuallyMutation();

  // Twenty is self-hosted per customer, so — unlike every other provider on
  // this page — connecting it always means "manual": there is no global OAuth
  // app to authorize against, only this workspace's instance URL + API key.
  const [twentyBaseUrl, setTwentyBaseUrl] = useState("");
  const [twentyApiKey, setTwentyApiKey] = useState("");
  const [twentyAuthError, setTwentyAuthError] = useState<string | null>(null);
  const [connectTwentyManually, { isLoading: isTwentyManualConnecting }] =
    useConnectTwentyManuallyMutation();

  const [trelloApiKey, setTrelloApiKey] = useState("");
  const [trelloApiToken, setTrelloApiToken] = useState("");
  const [connectTrelloManually, { isLoading: isTrelloManualConnecting }] =
    useConnectTrelloManuallyMutation();

  const {
    data: integrationsData,
    isLoading: isIntegrationsLoading,
    error: integrationsError,
    refetch: refetchIntegrations,
  } = useListIntegrationsQuery(undefined, {
    skip: !user,
  });

  const integrations = useMemo(() => integrationsData?.data ?? [], [integrationsData?.data]);

  useEffect(() => {
    if (integrations.length > 0) {
      const brokenIntegrations = integrations.filter((i) => i.status === "ERROR");
      if (brokenIntegrations.length > 0) {
        const names = brokenIntegrations.map((i) => i.provider).join(", ");
        dispatch(
          setToastMessage({
            severity: "error",
            message: `Action Required: Your connection to ${names} has expired. Please reconnect.`,
          }),
        );
      }
    }
  }, [integrations, dispatch]);

  const { data: notionDatabasesData } = useGetNotionDatabasesQuery(undefined, {
    skip: !integrations.some((i) => i.provider === "NOTION" && i.status === "CONNECTED"),
  });

  const status = searchParams.get(STATUS_PARAM);
  const messageFromQuery = searchParams.get(MESSAGE_PARAM) ?? undefined;
  const isSuccessStatus = status === "success";
  const isErrorStatus = status === "error";

  const [triggerTrelloAuthorization, { isFetching: isTrelloAuthLoading }] =
    useLazyGetTrelloAuthorizationUrlQuery();
  const [autoConnectTrello] = useAutoConnectTrelloMutation();

  const handleConnectTrello = async () => {
    try {
      const returnUrl = `${window.location.origin}/integrations?provider=trello`;
      const result = await triggerTrelloAuthorization(returnUrl).unwrap();
      window.location.href = result.data.authorizationUrl;
    } catch (error) {
      console.error(error);
      setTrelloAuthError(
        "Failed to fetch Trello authorization URL. Is TRELLO_GLOBAL_API_KEY configured?",
      );
    }
  };

  const handleConnectNotion = async () => {
    try {
      const redirectPath = "/integrations?provider=notion";
      const result = await triggerNotionAuthorization({ redirectPath }).unwrap();
      window.location.href = result.data.authorizationUrl;
    } catch (error) {
      console.error(error);
      setNotionAuthError("Failed to fetch Notion authorization URL.");
    }
  };

  const handleConnectAsana = async () => {
    try {
      const response = await triggerAsanaAuthorization().unwrap();
      const authorizationUrl = response.data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (error) {
      console.error("Failed to fetch Asana authorization URL", error);
      setAsanaAuthError("Failed to start Asana Auth");
    }
  };

  const handleManualAsanaConnect = async () => {
    setAsanaAuthError(null);
    try {
      await connectAsanaManually({ personalAccessToken: asanaPat }).unwrap();
      dispatch(setToastMessage({ severity: "success", message: "Asana connected successfully" }));
      refetchIntegrations();
      setAsanaPat("");
    } catch (err: unknown) {
      console.error("Failed to connect to Asana manually", err);
      const rtkError = err as { data?: { message?: string } };
      setAsanaAuthError(rtkError?.data?.message || "Failed to connect Asana");
    }
  };

  useEffect(() => {
    if (isSuccessStatus) {
      refetchIntegrations();
      if (messageFromQuery) {
        dispatch(setToastMessage({ severity: "success", message: messageFromQuery }));
      }
    } else if (isErrorStatus && messageFromQuery) {
      dispatch(setToastMessage({ severity: "error", message: messageFromQuery }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessStatus, isErrorStatus]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("token");
      if (token) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        autoConnectTrello({ token })
          .unwrap()
          .then(() => {
            dispatch(
              setToastMessage({ severity: "success", message: "Trello connected successfully" }),
            );
            refetchIntegrations();
          })
          .catch((e) => {
            setTrelloAuthError(e?.data?.message || "Failed to connect Trello automatically.");
          });
      }
    }
  }, [autoConnectTrello, dispatch, refetchIntegrations]);

  const [bindGithub, { isLoading: isBindingGithub }] = useBindGithubInstallationMutation();
  const [triggerGoogleAuthorization, { isFetching: isGoogleAuthLoading }] =
    useLazyGetGoogleAuthUrlQuery();
  const [triggerMicrosoftAuthorization, { isFetching: isMicrosoftAuthLoading }] =
    useLazyGetMicrosoftAuthUrlQuery();

  useEffect(() => {
    const installationId = searchParams.get("installation_id");

    if (installationId && user) {
      // Prevent double firing if already loading
      if (isBindingGithub) return;

      bindGithub(installationId)
        .unwrap()
        .then(() => {
          dispatch(
            setToastMessage({
              severity: "success",
              message: t("integrationsPage.statusAlert.success"),
            }),
          );
          navigate(`/integrations/github`, { replace: true });
        })
        .catch((error) => {
          console.error("Failed to bind github installation", error);
          dispatch(
            setToastMessage({
              severity: "error",
              message: t("integrationsPage.statusAlert.error"),
            }),
          );
          navigate(`/integrations/github`, { replace: true });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user, bindGithub, navigate]);

  const handleChangeTab = (_event: React.SyntheticEvent, newValue: ProviderTabValue) => {
    navigate(`/integrations?provider=${newValue}`);
  };

  const handleManualJiraConnect = async () => {
    setJiraAuthError(null);
    try {
      await connectJiraManually({
        siteUrl: jiraSiteUrl,
        email: jiraEmail,
        apiToken: jiraApiToken,
      }).unwrap();

      dispatch(
        setToastMessage({
          severity: "success",
          message: t("integrationsPage.statusAlert.success"),
        }),
      );
      refetchIntegrations();

      setJiraSiteUrl("");
      setJiraEmail("");
      setJiraApiToken("");
    } catch (err: unknown) {
      console.error("Failed to connect to Jira manually", err);
      const rtkError = err as { data?: { message?: string } };
      setJiraAuthError(rtkError?.data?.message || t("integrationsPage.errors.jiraAuthFlow"));
    }
  };

  const handleConnectJira = async () => {
    try {
      const response = await triggerJiraAuthorization("/integrations?provider=jira").unwrap();
      if (response?.data?.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (error) {
      console.error("Failed to fetch Jira authorization URL", error);
      dispatch(setToastMessage({ severity: "error", message: "Failed to start Jira Auth" }));
    }
  };

  const handleManualLinearConnect = async () => {
    setLinearAuthError(null);
    try {
      await connectLinearManually({
        apiKey: linearApiKey,
      }).unwrap();

      dispatch(
        setToastMessage({
          severity: "success",
          message: t("integrationsPage.statusAlert.success"),
        }),
      );
      refetchIntegrations();

      setLinearApiKey("");
    } catch (err: unknown) {
      console.error("Failed to connect to Linear manually", err);
      const rtkError = err as { data?: { message?: string } };
      setLinearAuthError(rtkError?.data?.message || t("integrationsPage.statusAlert.error"));
    }
  };

  const handleConnectLinear = async () => {
    try {
      const response = await triggerLinearAuthorization().unwrap();
      const authorizationUrl = response.data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (error) {
      console.error("Failed to fetch Linear authorization URL", error);
      dispatch(setToastMessage({ severity: "error", message: "Failed to start Linear Auth" }));
    }
  };

  const handleManualTrelloConnect = async () => {
    setTrelloAuthError(null);
    try {
      await connectTrelloManually({
        apiKey: trelloApiKey,
        token: trelloApiToken,
      }).unwrap();

      dispatch(
        setToastMessage({
          severity: "success",
          message: t("integrationsPage.statusAlert.success"),
        }),
      );
      refetchIntegrations();

      setTrelloApiKey("");
      setTrelloApiToken("");
    } catch (err: unknown) {
      console.error("Failed to connect to Trello manually", err);
      const rtkError = err as { data?: { message?: string } };
      setTrelloAuthError(rtkError?.data?.message || t("integrationsPage.statusAlert.error"));
    }
  };

  const handleManualTwentyConnect = async () => {
    setTwentyAuthError(null);
    try {
      await connectTwentyManually({
        baseUrl: twentyBaseUrl,
        apiKey: twentyApiKey,
      }).unwrap();

      dispatch(
        setToastMessage({
          severity: "success",
          message: t("integrationsPage.statusAlert.success"),
        }),
      );
      refetchIntegrations();

      setTwentyBaseUrl("");
      setTwentyApiKey("");
    } catch (err: unknown) {
      console.error("Failed to connect to Twenty manually", err);
      const rtkError = err as { data?: { message?: string } };
      setTwentyAuthError(rtkError?.data?.message || t("integrationsPage.statusAlert.error"));
    }
  };

  const handleConnectGithub = () => {
    const rawAppName =
      process.env.REACT_APP_GITHUB_APP_NAME ||
      process.env.REACT_APP_VITE_GITHUB_APP_NAME ||
      "plan-ai-architect";
    const githubAppName = rawAppName.replace("https://github.com/apps/", "").split("/")[0];
    const setupUrl = `https://github.com/apps/${githubAppName}/installations/new`;
    window.location.href = setupUrl;
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await triggerGoogleAuthorization("/integrations/google").unwrap();
      const authorizationUrl = response.data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (error) {
      console.error("Failed to fetch Google authorization URL", error);
      dispatch(setToastMessage({ severity: "error", message: "Failed to start Google Auth" }));
    }
  };

  const handleConnectMicrosoft = async () => {
    try {
      const response = await triggerMicrosoftAuthorization("/integrations/microsoft").unwrap();
      const authorizationUrl = response.data?.authorizationUrl;
      if (authorizationUrl) {
        window.location.href = authorizationUrl;
      }
    } catch (error) {
      console.error("Failed to fetch Microsoft authorization URL", error);
      dispatch(setToastMessage({ severity: "error", message: "Failed to start Microsoft Auth" }));
    }
  };

  const findIntegration = (provider: IntegrationProviderType): UserIntegrationSummary | undefined =>
    integrations.find(
      (integration): integration is UserIntegrationSummary =>
        Boolean(integration) && integration.provider === provider,
    );

  const renderProviderContent = (config: ProviderConfig) => {
    const integration = findIntegration(config.provider);
    const canEdit = config.isWorkspaceLevel ? canManageIntegrations : true;

    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h5">{t(config.labelKey)}</Typography>
              {config.isBeta && (
                <Chip
                  label="BETA"
                  size="small"
                  color="secondary"
                  variant="filled"
                  sx={{ fontWeight: "bold" }}
                />
              )}
              <Tooltip
                title={
                  config.isWorkspaceLevel
                    ? "Shared across the entire workspace. Only Admins and Owners can manage."
                    : "Connected per user. Each member manages their own."
                }
              >
                <Chip
                  icon={
                    config.isWorkspaceLevel ? (
                      <BusinessIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  label={config.isWorkspaceLevel ? "Workspace" : "Personal"}
                  size="small"
                  variant="outlined"
                  color={config.isWorkspaceLevel ? "primary" : "default"}
                  sx={{ fontWeight: 500, height: 24, fontSize: "0.75rem" }}
                />
              </Tooltip>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              {t(config.descriptionKey)}
            </Typography>
          </Box>

          {config.comingSoon ? (
            <Alert severity="info">
              {config.comingSoonMessageKey
                ? t(config.comingSoonMessageKey)
                : t("integrationsPage.comingSoonFallback", { provider: t(config.labelKey) })}
            </Alert>
          ) : null}

          {!config.comingSoon && integration ? (
            <ConnectedIntegrationDetails
              integration={integration}
              onAddMore={config.tabValue === "github" ? handleConnectGithub : undefined}
              onReconnect={
                config.tabValue === "notion"
                  ? handleConnectNotion
                  : config.tabValue === "jira"
                    ? handleConnectJira
                    : config.tabValue === "linear"
                      ? handleConnectLinear
                      : config.tabValue === "google"
                        ? handleConnectGoogle
                        : config.tabValue === "microsoft"
                          ? handleConnectMicrosoft
                          : config.tabValue === "asana"
                            ? handleConnectAsana
                            : undefined
              }
              canEdit={canEdit}
            />
          ) : null}

          {!config.comingSoon && !integration && !canEdit ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              This integration is managed by workspace Admins/Owners. Contact your administrator to
              connect it.
            </Alert>
          ) : null}

          {!config.comingSoon && !integration && canEdit ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {config.notConnectedKey
                  ? t(config.notConnectedKey)
                  : t("integrationsPage.providers.jira.notConnected", {
                      provider: t(config.labelKey),
                    })}
              </Typography>
              {config.tabValue === "jira" && (
                <Box
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3, maxWidth: 400 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 1: Connect via Atlassian (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Authorize Plan AI to access your Jira workspace securely.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleConnectJira}
                      disabled={isJiraAuthLoading}
                    >
                      {isJiraAuthLoading
                        ? t("integrationsPage.connect.redirecting", {
                            defaultValue: "Redirecting...",
                          })
                        : t("integrationsPage.providers.jira.connectCta", {
                            defaultValue: "Connect Jira",
                          })}
                    </Button>
                  </Box>

                  <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 2: Connect Manually
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For custom or restricted setups.
                    </Typography>
                    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField
                        size="small"
                        label={t("integrationsPage.providers.jira.manualForm.siteUrlLabel")}
                        value={jiraSiteUrl}
                        onChange={(e) => setJiraSiteUrl(e.target.value)}
                        placeholder="https://my-company.atlassian.net"
                        required
                      />
                      <TextField
                        size="small"
                        label={t("integrationsPage.providers.jira.manualForm.emailLabel")}
                        value={jiraEmail}
                        onChange={(e) => setJiraEmail(e.target.value)}
                        type="email"
                        required
                      />
                      <TextField
                        size="small"
                        label={t("integrationsPage.providers.jira.manualForm.apiTokenLabel")}
                        value={jiraApiToken}
                        onChange={(e) => setJiraApiToken(e.target.value)}
                        type="password"
                        required
                      />
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={handleManualJiraConnect}
                          disabled={
                            isJiraManualConnecting || !jiraSiteUrl || !jiraEmail || !jiraApiToken
                          }
                        >
                          {isJiraManualConnecting
                            ? t("integrationsPage.loading")
                            : t("integrationsPage.providers.jira.connectManualSubmit")}
                        </Button>
                        <Button
                          variant="text"
                          color="secondary"
                          onClick={() => setHelpDialogProvider("jira")}
                        >
                          {"How to find my token?"}
                        </Button>
                      </Stack>
                      {jiraAuthError && (
                        <Typography variant="body2" color="error">
                          {jiraAuthError}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
              {config.tabValue === "linear" && (
                <Box
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3, maxWidth: 400 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 1: Connect via Linear App (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Authorize Plan AI to access your Linear workspace securely.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleConnectLinear}
                      disabled={isLinearAuthLoading}
                    >
                      {isLinearAuthLoading
                        ? t("integrationsPage.connect.redirecting", {
                            defaultValue: "Redirecting...",
                          })
                        : "Connect with Linear"}
                    </Button>
                  </Box>

                  <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 2: Connect Manually with API Key
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For custom or restricted setups.
                    </Typography>
                    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField
                        size="small"
                        label="Personal API Key"
                        value={linearApiKey}
                        onChange={(e) => setLinearApiKey(e.target.value)}
                        placeholder="lin_api_..."
                        required
                      />
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={handleManualLinearConnect}
                          disabled={isLinearManualConnecting || !linearApiKey.trim()}
                        >
                          {isLinearManualConnecting
                            ? t("integrationsPage.loading")
                            : t("integrationsPage.providers.linear.connectCta")}
                        </Button>
                        <Button
                          variant="text"
                          color="secondary"
                          onClick={() => setHelpDialogProvider("linear")}
                        >
                          {"How to find my key?"}
                        </Button>
                      </Stack>
                      {linearAuthError && (
                        <Typography variant="body2" color="error">
                          {linearAuthError}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
              {config.tabValue === "trello" && (
                <Box
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3, maxWidth: 500 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 1: Connect via Trello (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Click the button below to authorize Plan AI to access your Trello boards.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleConnectTrello}
                      disabled={isTrelloAuthLoading}
                    >
                      {isTrelloAuthLoading ? "Redirecting..." : "Connect with Trello"}
                    </Button>
                  </Box>

                  <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 2: Connect Manually
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For custom or restricted setups where the global connection is unavailable.
                    </Typography>
                    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField
                        size="small"
                        label="Trello App Key"
                        value={trelloApiKey}
                        onChange={(e) => setTrelloApiKey(e.target.value)}
                        required
                      />
                      <TextField
                        size="small"
                        label="Trello Token"
                        value={trelloApiToken}
                        onChange={(e) => setTrelloApiToken(e.target.value)}
                        required
                      />
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={handleManualTrelloConnect}
                          disabled={
                            isTrelloManualConnecting ||
                            !trelloApiKey.trim() ||
                            !trelloApiToken.trim()
                          }
                        >
                          {isTrelloManualConnecting
                            ? t("integrationsPage.loading")
                            : "Connect Trello"}
                        </Button>
                        <Button
                          variant="text"
                          color="secondary"
                          onClick={() => setHelpDialogProvider("trello")}
                        >
                          {"How to find my token?"}
                        </Button>
                      </Stack>
                      {trelloAuthError && (
                        <Typography variant="body2" color="error">
                          {trelloAuthError}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
              {config.tabValue === "twenty" && (
                <Box
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3, maxWidth: 500 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {t("integrationsPage.providers.twenty.connectHeading")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {t("integrationsPage.providers.twenty.connectHelp")}
                    </Typography>
                    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField
                        size="small"
                        label={t("integrationsPage.providers.twenty.baseUrlLabel")}
                        placeholder="https://crm.tuempresa.com"
                        value={twentyBaseUrl}
                        onChange={(e) => setTwentyBaseUrl(e.target.value)}
                        required
                      />
                      <TextField
                        size="small"
                        label={t("integrationsPage.providers.twenty.apiKeyLabel")}
                        value={twentyApiKey}
                        onChange={(e) => setTwentyApiKey(e.target.value)}
                        required
                      />
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={handleManualTwentyConnect}
                          disabled={
                            isTwentyManualConnecting ||
                            !twentyBaseUrl.trim() ||
                            !twentyApiKey.trim()
                          }
                        >
                          {isTwentyManualConnecting
                            ? t("integrationsPage.loading")
                            : t("integrationsPage.providers.twenty.connectCta")}
                        </Button>
                      </Stack>
                      {twentyAuthError && (
                        <Typography variant="body2" color="error">
                          {twentyAuthError}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
              {config.tabValue === "github" && (
                <Button variant="contained" color="primary" onClick={handleConnectGithub}>
                  {config.connectCtaKey ? t(config.connectCtaKey) : undefined}
                </Button>
              )}
              {config.tabValue === "google" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnectGoogle}
                  disabled={isGoogleAuthLoading}
                >
                  {isGoogleAuthLoading
                    ? t("integrationsPage.connect.redirecting")
                    : config.connectCtaKey
                      ? t(config.connectCtaKey)
                      : undefined}
                </Button>
              )}
              {config.tabValue === "microsoft" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnectMicrosoft}
                  disabled={isMicrosoftAuthLoading}
                >
                  {isMicrosoftAuthLoading
                    ? t("integrationsPage.connect.redirecting")
                    : config.connectCtaKey
                      ? t(config.connectCtaKey)
                      : undefined}
                </Button>
              )}
              {config.tabValue === "notion" && (
                <Box
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3, maxWidth: 400 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Connect via Notion
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Authorize Plan AI to access your Notion workspace and databases securely.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleConnectNotion}
                      disabled={isNotionAuthLoading}
                    >
                      {isNotionAuthLoading
                        ? t("integrationsPage.connect.redirecting", {
                            defaultValue: "Redirecting...",
                          })
                        : config.connectCtaKey
                          ? t(config.connectCtaKey)
                          : "Connect Notion"}
                    </Button>
                    {notionAuthError && (
                      <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        {notionAuthError}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              {config.tabValue === "asana" && (
                <Box
                  sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3, maxWidth: 400 }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 1: Connect via Asana (Recommended)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Authorize Plan AI to access your Asana workspace securely.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleConnectAsana}
                      disabled={isAsanaAuthLoading}
                    >
                      {isAsanaAuthLoading ? "Redirecting..." : "Connect with Asana"}
                    </Button>
                  </Box>

                  <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Option 2: Connect with Personal Access Token
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      For custom or restricted setups.
                    </Typography>
                    <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField
                        size="small"
                        label="Personal Access Token"
                        value={asanaPat}
                        onChange={(e) => setAsanaPat(e.target.value)}
                        placeholder="0/abc123..."
                        type="password"
                        required
                      />
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          onClick={handleManualAsanaConnect}
                          disabled={isAsanaManualConnecting || !asanaPat.trim()}
                        >
                          {isAsanaManualConnecting ? "Connecting..." : "Connect Asana"}
                        </Button>
                      </Stack>
                      {asanaAuthError && (
                        <Typography variant="body2" color="error">
                          {asanaAuthError}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
              {config.tabValue !== "jira" &&
                config.tabValue !== "linear" &&
                config.tabValue !== "trello" &&
                config.tabValue !== "github" &&
                config.tabValue !== "google" &&
                config.tabValue !== "notion" &&
                config.tabValue !== "microsoft" &&
                config.tabValue !== "asana" && (
                  <Button variant="contained" color="primary" disabled>
                    {config.connectCtaKey ? t(config.connectCtaKey) : undefined}
                  </Button>
                )}
            </Box>
          ) : null}
        </Stack>
      </Paper>
    );
  };

  const handleDismissStatus = () => {
    navigate(`/integrations/${activeTab}`, { replace: true });
  };

  if (!user) {
    return (
      <SidebarLayout>
        <Box sx={{ p: 4 }}>
          <Alert severity="warning">{t("integrationsPage.notSignedIn")}</Alert>
        </Box>
      </SidebarLayout>
    );
  }

  // Removed the blanket block — members can now view integrations, just can't configure workspace-level ones

  return (
    <SidebarLayout>
      <Box sx={{ p: { xs: 3, md: 6 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {t("integrationsPage.heading")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t("integrationsPage.description")}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 1 }}>
            {PROVIDER_CONFIGS.map((config) => {
              const isConnected = integrations.some(
                (i) => i.provider === config.provider && i.status === "CONNECTED",
              );

              const hasError = integrations.some(
                (i) => i.provider === config.provider && i.status === "ERROR",
              );

              const hasWarning = false; // No database requirement for Notion anymore

              let iconEl = null;
              switch (config.tabValue) {
                case "github":
                  iconEl = <img src={githubSvg} alt="GitHub" width={16} height={16} />;
                  break;
                case "jira":
                  iconEl = <img src={jiraSvg} alt="Jira" width={16} height={16} />;
                  break;
                case "linear":
                  iconEl = <img src={linearSvg} alt="Linear" width={16} height={16} />;
                  break;
                case "notion":
                  iconEl = <img src={notionSvg} alt="Notion" width={16} height={16} />;
                  break;
                case "trello":
                  iconEl = <img src={trelloSvg} alt="Trello" width={16} height={16} />;
                  break;
                case "twenty":
                  iconEl = <HubOutlinedIcon sx={{ fontSize: 16 }} />;
                  break;
                case "google":
                  iconEl = <img src={googleDriveSvg} alt="Google Drive" width={16} height={16} />;
                  break;
                case "microsoft":
                  iconEl = <img src={oneDriveSvg} alt="Microsoft" width={16} height={16} />;
                  break;
                case "asana":
                  iconEl = <img src={asanaSvg} alt="Asana" width={16} height={16} />;
                  break;
              }

              if (iconEl && theme.palette.mode === "dark") {
                iconEl = (
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: "white",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {iconEl}
                  </Box>
                );
              }

              const isActive = activeTab === config.tabValue;

              return (
                <Chip
                  key={config.tabValue}
                  onClick={(e) => handleChangeTab(e, config.tabValue)}
                  variant={isActive ? "filled" : "outlined"}
                  color={isActive ? "primary" : "default"}
                  sx={{ py: 2.5, px: 0.5, borderRadius: 2 }}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {iconEl}
                      <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
                        {t(config.labelKey)}
                      </Typography>
                      {isConnected && !hasWarning && !hasError && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "success.main",
                          }}
                        />
                      )}
                      {hasError && (
                        <Tooltip title="Action required: connection expired. Please reconnect.">
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "error.main",
                            }}
                          />
                        </Tooltip>
                      )}
                      {hasWarning && (
                        <Tooltip title="Action required: No databases found">
                          <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main" }} />
                        </Tooltip>
                      )}
                      {config.isBeta && (
                        <Chip
                          label="BETA"
                          size="small"
                          color="secondary"
                          sx={{ height: 18, fontSize: "0.65rem", fontWeight: "bold" }}
                        />
                      )}
                    </Stack>
                  }
                />
              );
            })}

            {/* Plan AI MCP tab */}
            <Chip
              onClick={(e) => handleChangeTab(e, "plan-ai-mcp")}
              variant={activeTab === "plan-ai-mcp" ? "filled" : "outlined"}
              color={activeTab === "plan-ai-mcp" ? "primary" : "default"}
              sx={{ py: 2.5, px: 0.5, borderRadius: 2 }}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CodeIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
                    Plan AI MCP
                  </Typography>
                  <Chip
                    label="NEW"
                    size="small"
                    color="primary"
                    sx={{ height: 18, fontSize: "0.65rem", fontWeight: "bold" }}
                  />
                </Stack>
              }
            />
          </Box>

          {isSuccessStatus || isErrorStatus ? (
            <Alert severity={isSuccessStatus ? "success" : "error"} onClose={handleDismissStatus}>
              {messageFromQuery ??
                (isSuccessStatus
                  ? t("integrationsPage.statusAlert.success")
                  : t("integrationsPage.statusAlert.error"))}
            </Alert>
          ) : null}

          {integrationsError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => refetchIntegrations()}>
                  {t("integrationsPage.buttons.retry")}
                </Button>
              }
            >
              {t("integrationsPage.errors.cannotLoad")}
            </Alert>
          ) : null}

          {isIntegrationsLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                {t("integrationsPage.loading")}
              </Typography>
            </Box>
          ) : null}

          {PROVIDER_CONFIGS.filter((config) => config.tabValue === activeTab).map((config) => (
            <Box key={config.tabValue}>{renderProviderContent(config)}</Box>
          ))}

          {activeTab === "plan-ai-mcp" && <McpPanel workspaceId={activeWorkspaceId ?? ""} />}
        </Stack>
      </Box>
      <HowToConnectDialog
        open={!!helpDialogProvider}
        provider={helpDialogProvider}
        onClose={() => setHelpDialogProvider(null)}
      />
    </SidebarLayout>
  );
};

// Component to display connected integration details
const ConnectedIntegrationDetails: React.FC<{
  integration: UserIntegrationSummary;
  onAddMore?: () => void;
  onReconnect?: () => void;
  canEdit?: boolean;
}> = ({ integration, onAddMore, onReconnect, canEdit = true }) => {
  const { t } = useTranslation();
  const statusColorMap: Record<UserIntegrationSummary["status"], "success" | "default" | "error"> =
    {
      CONNECTED: "success",
      DISCONNECTED: "default",
      ERROR: "error",
    };

  const dispatch = useDispatch();
  const [disconnectIntegration, { isLoading: isDisconnecting }] =
    useDisconnectIntegrationMutation();
  const [setGoogleFolder, { isLoading: isSavingGoogleFolder }] =
    useSetGoogleDefaultFolderMutation();
  const [setMicrosoftFolder, { isLoading: isSavingMicrosoftFolder }] =
    useSetMicrosoftDefaultFolderMutation();
  const { openPicker: openGooglePicker, loadPicker: loadGooglePicker } = useGooglePicker();
  const { openPicker: openOneDrivePicker } = useOneDrivePicker();

  React.useEffect(() => {
    if (integration.provider === "GOOGLE_DRIVE" && integration.status === "CONNECTED") {
      loadGooglePicker();
    }
  }, [integration.provider, integration.status, loadGooglePicker]);

  const { data: jiraProjectsData, isLoading: isJiraProjectsLoading } = useGetJiraProjectsQuery(
    undefined,
    { skip: integration.provider !== "JIRA" || integration.status !== "CONNECTED" },
  );
  const [setJiraDefaultProject, { isLoading: isSavingJiraProject }] =
    useSetJiraDefaultProjectMutation();

  const { data: linearTeamsData, isLoading: isLinearTeamsLoading } = useGetLinearTeamsQuery(
    undefined,
    { skip: integration.provider !== "LINEAR" || integration.status !== "CONNECTED" },
  );
  const [setLinearDefaultTeam, { isLoading: isSavingLinearTeam }] =
    useSetLinearDefaultTeamMutation();

  const [selectedJiraProjectId, setSelectedJiraProjectId] = React.useState(
    () =>
      ((integration.metadata as Record<string, unknown> | null)?.defaultProjectId as string) ?? "",
  );
  const [selectedLinearTeamId, setSelectedLinearTeamId] = React.useState(
    () => ((integration.metadata as Record<string, unknown> | null)?.defaultTeamId as string) ?? "",
  );

  const {
    data: notionSummaryResponse,
    isLoading: isNotionSummaryLoading,
    isFetching: isNotionSummaryFetching,
    refetch: refetchNotionSummary,
  } = useGetNotionSummaryQuery(undefined, {
    skip: integration.provider !== "NOTION" || integration.status !== "CONNECTED",
  });
  const { data: notionDatabasesData, isLoading: isNotionDatabasesLoading } =
    useGetNotionDatabasesQuery(undefined, {
      skip: integration.provider !== "NOTION" || integration.status !== "CONNECTED",
    });
  const [setNotionDefaultDatabase, { isLoading: isSavingNotionDatabase }] =
    useSetNotionDefaultDatabaseMutation();
  const [selectedNotionDatabaseId, setSelectedNotionDatabaseId] = React.useState(
    () =>
      ((integration.metadata as Record<string, unknown> | null)?.defaultDatabaseId as string) ?? "",
  );

  const {
    data: asanaSummaryResponse,
    isLoading: isAsanaSummaryLoading,
    isFetching: isAsanaSummaryFetching,
    refetch: refetchAsanaSummary,
  } = useGetAsanaSummaryQuery(undefined, {
    skip: integration.provider !== "ASANA" || integration.status !== "CONNECTED",
  });

  const { data: asanaProjectsData, isLoading: isAsanaProjectsLoading } = useGetAsanaProjectsQuery(
    undefined,
    { skip: integration.provider !== "ASANA" || integration.status !== "CONNECTED" },
  );
  const [setAsanaDefaultProject, { isLoading: isSavingAsanaProject }] =
    useSetAsanaDefaultProjectMutation();
  const [selectedAsanaProjectGid, setSelectedAsanaProjectGid] = React.useState(
    () =>
      ((integration.metadata as Record<string, unknown> | null)?.defaultProjectGid as string) ?? "",
  );

  const { data: trelloBoardsData, isLoading: isTrelloBoardsLoading } = useGetTrelloBoardsQuery(
    undefined,
    { skip: integration.provider !== "TRELLO" || integration.status !== "CONNECTED" },
  );

  const [selectedTrelloBoardId, setSelectedTrelloBoardId] = React.useState(
    () =>
      ((integration.metadata as Record<string, unknown> | null)?.defaultBoardId as string) ?? "",
  );

  const [selectedTrelloListId, setSelectedTrelloListId] = React.useState(
    () => ((integration.metadata as Record<string, unknown> | null)?.defaultListId as string) ?? "",
  );

  const { data: trelloListsData, isLoading: isTrelloListsLoading } = useGetTrelloListsQuery(
    selectedTrelloBoardId,
    {
      skip:
        integration.provider !== "TRELLO" ||
        integration.status !== "CONNECTED" ||
        !selectedTrelloBoardId,
    },
  );

  const [setTrelloDefaultBoardList, { isLoading: isSavingTrelloDefault }] =
    useSetTrelloDefaultBoardListMutation();

  // Sync local state when the integration metadata refreshes from the network (e.g. on page load)
  React.useEffect(() => {
    const meta = integration.metadata as Record<string, unknown> | null;
    console.log(`[Integrations] Syncing from metadata for ${integration.provider}:`, meta);
    const projectId = (meta?.defaultProjectId as string) ?? "";
    const teamId = (meta?.defaultTeamId as string) ?? "";
    const boardId = (meta?.defaultBoardId as string) ?? "";
    const listId = (meta?.defaultListId as string) ?? "";
    const notionDbId = (meta?.defaultDatabaseId as string) ?? "";
    const asanaProjectGid = (meta?.defaultProjectGid as string) ?? "";
    setSelectedJiraProjectId(projectId);
    setSelectedLinearTeamId(teamId);
    setSelectedTrelloBoardId(boardId);
    setSelectedTrelloListId(listId);
    setSelectedNotionDatabaseId(notionDbId);
    setSelectedAsanaProjectGid(asanaProjectGid);
  }, [integration.metadata, integration.provider]);

  // Use a ref to prevent race conditions / duplicate auto-selects
  const autoSelectRef = React.useRef({
    jira: false,
    linear: false,
    trelloBoard: false,
    trelloList: false,
    notion: false,
    asana: false,
  });

  // Auto-select first options if none selected
  React.useEffect(() => {
    if (
      integration.provider === "JIRA" &&
      integration.status === "CONNECTED" &&
      !selectedJiraProjectId &&
      jiraProjectsData?.data?.length &&
      canEdit &&
      !autoSelectRef.current.jira
    ) {
      autoSelectRef.current.jira = true;
      const firstProjectId = jiraProjectsData.data[0].id;
      setSelectedJiraProjectId(firstProjectId);
      setJiraDefaultProject({ projectId: firstProjectId })
        .unwrap()
        .then(() => dispatch(integrationApi.util.invalidateTags(["Integration"])))
        .catch(() => {
          autoSelectRef.current.jira = false;
        });
    }
  }, [
    integration.provider,
    integration.status,
    selectedJiraProjectId,
    jiraProjectsData,
    canEdit,
    setJiraDefaultProject,
    dispatch,
  ]);

  React.useEffect(() => {
    if (
      integration.provider === "LINEAR" &&
      integration.status === "CONNECTED" &&
      !selectedLinearTeamId &&
      linearTeamsData?.data?.length &&
      canEdit &&
      !autoSelectRef.current.linear
    ) {
      autoSelectRef.current.linear = true;
      const firstTeamId = linearTeamsData.data[0].id;
      setSelectedLinearTeamId(firstTeamId);
      setLinearDefaultTeam({ teamId: firstTeamId })
        .unwrap()
        .then(() => dispatch(integrationApi.util.invalidateTags(["Integration"])))
        .catch(() => {
          autoSelectRef.current.linear = false;
        });
    }
  }, [
    integration.provider,
    integration.status,
    selectedLinearTeamId,
    linearTeamsData,
    canEdit,
    setLinearDefaultTeam,
    dispatch,
  ]);

  React.useEffect(() => {
    if (
      integration.provider === "TRELLO" &&
      integration.status === "CONNECTED" &&
      !selectedTrelloBoardId &&
      trelloBoardsData?.data?.length &&
      canEdit &&
      !autoSelectRef.current.trelloBoard
    ) {
      autoSelectRef.current.trelloBoard = true;
      const firstBoardId = trelloBoardsData.data[0].id;
      setSelectedTrelloBoardId(firstBoardId);
      setTrelloDefaultBoardList({ boardId: firstBoardId, listId: "" })
        .unwrap()
        .then(() => dispatch(integrationApi.util.invalidateTags(["Integration"])))
        .catch(() => {
          autoSelectRef.current.trelloBoard = false;
        });
    }
  }, [
    integration.provider,
    integration.status,
    selectedTrelloBoardId,
    trelloBoardsData,
    canEdit,
    setTrelloDefaultBoardList,
    dispatch,
  ]);

  React.useEffect(() => {
    if (
      integration.provider === "TRELLO" &&
      integration.status === "CONNECTED" &&
      selectedTrelloBoardId &&
      !selectedTrelloListId &&
      trelloListsData?.data?.length &&
      canEdit &&
      !autoSelectRef.current.trelloList
    ) {
      autoSelectRef.current.trelloList = true;
      const firstListId = trelloListsData.data[0].id;
      setSelectedTrelloListId(firstListId);
      setTrelloDefaultBoardList({ boardId: selectedTrelloBoardId, listId: firstListId })
        .unwrap()
        .then(() => dispatch(integrationApi.util.invalidateTags(["Integration"])))
        .catch(() => {
          autoSelectRef.current.trelloList = false;
        });
    }
  }, [
    integration.provider,
    integration.status,
    selectedTrelloBoardId,
    selectedTrelloListId,
    trelloListsData,
    canEdit,
    setTrelloDefaultBoardList,
    dispatch,
  ]);

  React.useEffect(() => {
    if (
      integration.provider === "NOTION" &&
      integration.status === "CONNECTED" &&
      !selectedNotionDatabaseId &&
      notionDatabasesData?.data?.length &&
      canEdit &&
      !autoSelectRef.current.notion
    ) {
      autoSelectRef.current.notion = true;
      const firstDbId = notionDatabasesData.data[0].id;
      setSelectedNotionDatabaseId(firstDbId);
      setNotionDefaultDatabase({ databaseId: firstDbId })
        .unwrap()
        .then(() => dispatch(integrationApi.util.invalidateTags(["Integration"])))
        .catch(() => {
          autoSelectRef.current.notion = false;
        });
    }
  }, [
    integration.provider,
    integration.status,
    selectedNotionDatabaseId,
    notionDatabasesData,
    canEdit,
    setNotionDefaultDatabase,
    dispatch,
  ]);

  React.useEffect(() => {
    if (
      integration.provider === "ASANA" &&
      integration.status === "CONNECTED" &&
      !selectedAsanaProjectGid &&
      asanaProjectsData?.data?.length &&
      canEdit &&
      !autoSelectRef.current.asana
    ) {
      autoSelectRef.current.asana = true;
      const firstGid = asanaProjectsData.data[0].gid;
      setSelectedAsanaProjectGid(firstGid);
      setAsanaDefaultProject({ projectGid: firstGid })
        .unwrap()
        .then(() => dispatch(integrationApi.util.invalidateTags(["Integration"])))
        .catch(() => {
          autoSelectRef.current.asana = false;
        });
    }
  }, [
    integration.provider,
    integration.status,
    selectedAsanaProjectGid,
    asanaProjectsData,
    canEdit,
    setAsanaDefaultProject,
    dispatch,
  ]);

  const {
    data: reposData,
    isLoading: isReposLoading,
    isFetching: isReposFetching,
    error: reposError,
    refetch,
  } = useGetGithubRepositoriesQuery(undefined, {
    skip: integration.provider !== "GITHUB" || integration.status !== "CONNECTED",
  });

  const {
    data: jiraSummaryResponse,
    isLoading: isJiraSummaryLoading,
    isFetching: isJiraSummaryFetching,
    refetch: refetchJiraSummary,
  } = useGetJiraSummaryQuery(undefined, {
    skip: integration.provider !== "JIRA" || integration.status !== "CONNECTED",
  });

  const {
    data: linearSummaryResponse,
    isLoading: isLinearSummaryLoading,
    isFetching: isLinearSummaryFetching,
    refetch: refetchLinearSummary,
  } = useGetLinearSummaryQuery(undefined, {
    skip: integration.provider !== "LINEAR" || integration.status !== "CONNECTED",
  });

  const {
    data: trelloSummaryResponse,
    isLoading: isTrelloSummaryLoading,
    isFetching: isTrelloSummaryFetching,
    refetch: refetchTrelloSummary,
  } = useGetTrelloSummaryQuery(undefined, {
    skip: integration.provider !== "TRELLO" || integration.status !== "CONNECTED",
  });

  // Client-side safety net: if repos take >12s to load, show error + retry
  const [reposTimedOut, setReposTimedOut] = React.useState(false);

  useEffect(() => {
    if (integration.provider !== "GITHUB" || integration.status !== "CONNECTED") return;
    if (!isReposLoading && !isReposFetching) {
      setReposTimedOut(false);
      return;
    }
    // Start a 12-second timeout when loading begins
    setReposTimedOut(false);
    const timer = setTimeout(() => setReposTimedOut(true), 20_000);
    return () => clearTimeout(timer);
  }, [isReposLoading, isReposFetching, integration.provider, integration.status]);

  useEffect(() => {
    if (reposError) {
      dispatch(
        setToastMessage({
          severity: "error",
          message: "Failed to load connected repositories from GitHub.",
        }),
      );
    }
  }, [reposError, dispatch]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip
          label={integration.status.toLowerCase()}
          color={statusColorMap[integration.status]}
          sx={{ textTransform: "capitalize" }}
        />
        {integration.accountName ? (
          <Typography variant="body2" color="text.secondary">
            {integration.accountName}
          </Typography>
        ) : null}
        <Box sx={{ flexGrow: 1 }} />
        {canEdit ? (
          <Stack direction="row" spacing={1}>
            {onReconnect && (
              <Button
                size="small"
                color="primary"
                variant="outlined"
                onClick={onReconnect}
                disabled={isDisconnecting}
              >
                Reconnect
              </Button>
            )}
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={async () => {
                if (window.confirm("Are you sure you want to disconnect this integration?")) {
                  try {
                    await disconnectIntegration(integration.provider).unwrap();
                    dispatch(
                      setToastMessage({
                        severity: "success",
                        message: "Integration disconnected successfully",
                      }),
                    );
                  } catch (e) {
                    dispatch(
                      setToastMessage({
                        severity: "error",
                        message: "Failed to disconnect integration",
                      }),
                    );
                  }
                }
              }}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </Stack>
        ) : (
          <Tooltip title="Only workspace Admins or Owners can manage this integration">
            <span>
              <Chip label="Read-only" size="small" variant="outlined" color="default" />
            </span>
          </Tooltip>
        )}
      </Stack>

      {integration.status === "ERROR" && (
        <Alert severity="error" sx={{ mt: 1 }}>
          The connection to this integration has expired or failed. Please click
          &quot;Reconnect&quot; to authorize it again.
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary">
        {t("integrationsPage.connectedDetails.linkedAccount", {
          accountId: integration.accountId ?? t("integrationsPage.connectedDetails.unknownAccount"),
        })}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {t("integrationsPage.connectedDetails.connectedOn", {
          timestamp: new Date(integration.createdAt).toLocaleString(),
        })}
      </Typography>

      {integration.expiresAt ? (
        <Typography variant="body2" color="text.secondary">
          {t("integrationsPage.connectedDetails.expiresOn", {
            timestamp: new Date(integration.expiresAt).toLocaleString(),
          })}
        </Typography>
      ) : null}

      {integration.provider === "JIRA" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Jira Workspace Overview
            </Typography>
            <IconButton
              size="small"
              onClick={() => refetchJiraSummary()}
              disabled={isJiraSummaryFetching || isJiraSummaryLoading}
            >
              <SyncIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
          </Stack>

          {isJiraSummaryLoading || isJiraSummaryFetching ? (
            <CircularProgress size={20} />
          ) : jiraSummaryResponse?.data ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Total Projects:</strong> {jiraSummaryResponse.data.totalProjects ?? "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Assigned Issues:</strong> {jiraSummaryResponse.data.totalIssues ?? "N/A"}
                </Typography>

                {jiraSummaryResponse.data.latestBoards?.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Agile Boards:</strong>
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {jiraSummaryResponse.data.latestBoards.map((board) => (
                        <Chip key={board} label={board} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Unable to load Jira summary statistics.
            </Typography>
          )}
        </Box>
      )}

      {integration.provider === "JIRA" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Default Destination Project
          </Typography>
          {isJiraProjectsLoading ? (
            <CircularProgress size={20} />
          ) : (
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Select Default Project</InputLabel>
              <Select
                label="Select Default Project"
                value={selectedJiraProjectId}
                disabled={isSavingJiraProject || !canEdit}
                onChange={async (e) => {
                  const projectId = e.target.value as string;
                  setSelectedJiraProjectId(projectId);
                  try {
                    await setJiraDefaultProject({ projectId }).unwrap();
                    dispatch(integrationApi.util.invalidateTags(["Integration"]));
                    dispatch(
                      setToastMessage({
                        severity: "success",
                        message: "Default Jira project saved",
                      }),
                    );
                  } catch {
                    dispatch(
                      setToastMessage({
                        severity: "error",
                        message: "Failed to save default project",
                      }),
                    );
                  }
                }}
              >
                {(jiraProjectsData?.data ?? []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      {integration.provider === "LINEAR" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Linear Workspace Overview
            </Typography>
            <IconButton
              size="small"
              onClick={() => refetchLinearSummary()}
              disabled={isLinearSummaryFetching || isLinearSummaryLoading}
            >
              <SyncIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
          </Stack>

          {isLinearSummaryLoading || isLinearSummaryFetching ? (
            <CircularProgress size={20} />
          ) : linearSummaryResponse?.data ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Total Projects:</strong>{" "}
                  {linearSummaryResponse.data.totalProjects ?? "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Assigned Issues:</strong>{" "}
                  {linearSummaryResponse.data.totalIssues ?? "N/A"}
                </Typography>

                {linearSummaryResponse.data.latestTeams?.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Active Teams:</strong>
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {linearSummaryResponse.data.latestTeams.map((team: string) => (
                        <Chip key={team} label={team} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Unable to load Linear summary statistics.
            </Typography>
          )}
        </Box>
      )}

      {integration.provider === "LINEAR" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Default Destination Team
          </Typography>
          {isLinearTeamsLoading ? (
            <CircularProgress size={20} />
          ) : (
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Select Default Team</InputLabel>
              <Select
                label="Select Default Team"
                value={selectedLinearTeamId}
                disabled={isSavingLinearTeam || !canEdit}
                onChange={async (e) => {
                  const teamId = e.target.value as string;
                  setSelectedLinearTeamId(teamId);
                  try {
                    await setLinearDefaultTeam({ teamId }).unwrap();
                    dispatch(integrationApi.util.invalidateTags(["Integration"]));
                    dispatch(
                      setToastMessage({
                        severity: "success",
                        message: "Default Linear team saved",
                      }),
                    );
                  } catch {
                    dispatch(
                      setToastMessage({
                        severity: "error",
                        message: "Failed to save default team",
                      }),
                    );
                  }
                }}
              >
                {(linearTeamsData?.data ?? []).map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      {integration.provider === "TRELLO" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Trello Connection
            </Typography>
            <IconButton
              size="small"
              onClick={() => refetchTrelloSummary()}
              disabled={isTrelloSummaryFetching || isTrelloSummaryLoading}
            >
              <SyncIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
          </Stack>

          {isTrelloSummaryLoading || isTrelloSummaryFetching ? (
            <CircularProgress size={20} />
          ) : trelloSummaryResponse?.data ? (
            <Stack spacing={2} sx={{ mt: 1, mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Total Boards:</strong> {trelloSummaryResponse.data.totalBoards ?? "N/A"}
                </Typography>
                {trelloSummaryResponse.data.latestBoards?.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Active Boards:</strong>
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {trelloSummaryResponse.data.latestBoards.map((board: string) => (
                        <Chip key={board} label={board} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Stack>
          ) : null}

          <Typography variant="subtitle2" sx={{ mb: 1, mt: 2 }}>
            Default Destination Board & List
          </Typography>
          <Stack spacing={2}>
            {isTrelloBoardsLoading ? (
              <CircularProgress size={20} />
            ) : (
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Select Default Board</InputLabel>
                <Select
                  label="Select Default Board"
                  value={selectedTrelloBoardId}
                  disabled={isSavingTrelloDefault || !canEdit}
                  onChange={async (e) => {
                    const boardId = e.target.value as string;
                    setSelectedTrelloBoardId(boardId);
                    setSelectedTrelloListId(""); // Reset list
                    try {
                      await setTrelloDefaultBoardList({ boardId, listId: "" }).unwrap();
                      dispatch(integrationApi.util.invalidateTags(["Integration"]));
                    } catch {
                      dispatch(
                        setToastMessage({
                          severity: "error",
                          message: "Failed to update default board",
                        }),
                      );
                    }
                  }}
                >
                  {(trelloBoardsData?.data ?? []).map((board: { id: string; name: string }) => (
                    <MenuItem key={board.id} value={board.id}>
                      {board.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedTrelloBoardId &&
              (isTrelloListsLoading ? (
                <CircularProgress size={20} />
              ) : (
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <InputLabel>Select Default List</InputLabel>
                  <Select
                    label="Select Default List"
                    value={selectedTrelloListId}
                    disabled={isSavingTrelloDefault || !canEdit}
                    onChange={async (e) => {
                      const listId = e.target.value as string;
                      setSelectedTrelloListId(listId);
                      try {
                        await setTrelloDefaultBoardList({
                          boardId: selectedTrelloBoardId,
                          listId,
                        }).unwrap();
                        dispatch(integrationApi.util.invalidateTags(["Integration"]));
                        dispatch(
                          setToastMessage({
                            severity: "success",
                            message: "Default Trello List saved",
                          }),
                        );
                      } catch {
                        dispatch(
                          setToastMessage({
                            severity: "error",
                            message: "Failed to save default list",
                          }),
                        );
                      }
                    }}
                  >
                    {(trelloListsData?.data ?? []).map((list: { id: string; name: string }) => (
                      <MenuItem key={list.id} value={list.id}>
                        {list.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
          </Stack>
        </Box>
      )}

      {integration.provider === "NOTION" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Notion is connected. Tasks from your recordings will automatically be exported as pages
            in your Notion workspace.
          </Alert>
        </Box>
      )}

      {integration.provider === "ASANA" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Asana is connected. Tasks from your recordings will automatically be synced to your
            Asana workspace.
          </Alert>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Asana Workspace Overview
            </Typography>
            <IconButton
              size="small"
              onClick={() => refetchAsanaSummary()}
              disabled={isAsanaSummaryFetching || isAsanaSummaryLoading}
            >
              <SyncIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
          </Stack>

          {isAsanaSummaryLoading || isAsanaSummaryFetching ? (
            <CircularProgress size={20} />
          ) : asanaSummaryResponse?.data ? (
            <Stack spacing={2} sx={{ mt: 1, mb: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Total Projects:</strong>{" "}
                  {asanaSummaryResponse.data.totalProjects ?? "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Total Tasks:</strong> {asanaSummaryResponse.data.totalTasks ?? "N/A"}
                </Typography>
              </Paper>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Unable to load Asana summary statistics.
            </Typography>
          )}

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Default Destination Project
          </Typography>
          {isAsanaProjectsLoading ? (
            <CircularProgress size={20} />
          ) : (
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Select Default Project</InputLabel>
              <Select
                label="Select Default Project"
                value={selectedAsanaProjectGid}
                disabled={isSavingAsanaProject || !canEdit}
                onChange={async (e) => {
                  const projectGid = e.target.value as string;
                  setSelectedAsanaProjectGid(projectGid);
                  try {
                    await setAsanaDefaultProject({ projectGid }).unwrap();
                    dispatch(integrationApi.util.invalidateTags(["Integration"]));
                    dispatch(
                      setToastMessage({
                        severity: "success",
                        message: "Default Asana project saved",
                      }),
                    );
                  } catch {
                    dispatch(
                      setToastMessage({
                        severity: "error",
                        message: "Failed to save default project",
                      }),
                    );
                  }
                }}
              >
                {(asanaProjectsData?.data ?? []).map((p) => (
                  <MenuItem key={p.gid} value={p.gid}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      {integration.provider === "GOOGLE_DRIVE" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Default Export Folder
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              disabled
              value={
                ((integration.metadata as Record<string, unknown> | null)
                  ?.defaultFolderName as string) ?? "Root Directory"
              }
              fullWidth
            />
            <Button
              variant="outlined"
              size="small"
              disabled={isSavingGoogleFolder || !canEdit}
              onClick={() => {
                openGooglePicker({
                  pickerType: "folder",
                  multiple: false,
                  onPick: async (fileIds, _, docs) => {
                    if (fileIds.length > 0 && docs && docs[0]) {
                      const folderId = fileIds[0];
                      const folderName = docs[0].name;
                      try {
                        await setGoogleFolder({ folderId, folderName }).unwrap();
                        dispatch(integrationApi.util.invalidateTags(["Integration"]));
                        dispatch(
                          setToastMessage({
                            severity: "success",
                            message: "Default folder updated",
                          }),
                        );
                      } catch {
                        dispatch(
                          setToastMessage({
                            severity: "error",
                            message: "Failed to update folder",
                          }),
                        );
                      }
                    }
                  },
                });
              }}
            >
              Select Folder
            </Button>
          </Stack>
        </Box>
      )}

      {integration.provider === "ONEDRIVE" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Default Export Folder
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              disabled
              value={
                ((integration.metadata as Record<string, unknown> | null)
                  ?.defaultFolderName as string) ?? "Root Directory"
              }
              fullWidth
            />
            <Button
              variant="outlined"
              size="small"
              disabled={isSavingMicrosoftFolder || !canEdit}
              onClick={() => {
                openOneDrivePicker({
                  pickerType: "folder",
                  multiple: false,
                  onPick: async (fileIds, items) => {
                    console.log(
                      "[Integrations] OneDrive folder pick - fileIds:",
                      fileIds,
                      "items:",
                      items,
                    );
                    if (fileIds.length > 0) {
                      const folderId = fileIds[0];
                      // OneDrive picker doesn't return name for folders — use fallback
                      const folderName = items?.[0]?.name || "OneDrive Folder";
                      console.log(
                        "[Integrations] Sending to API - folderId:",
                        folderId,
                        "folderName:",
                        folderName,
                      );
                      try {
                        await setMicrosoftFolder({ folderId, folderName }).unwrap();
                        dispatch(integrationApi.util.invalidateTags(["Integration"]));
                        dispatch(
                          setToastMessage({
                            severity: "success",
                            message: "Default folder updated",
                          }),
                        );
                      } catch {
                        dispatch(
                          setToastMessage({
                            severity: "error",
                            message: "Failed to update folder",
                          }),
                        );
                      }
                    }
                  },
                });
              }}
            >
              Select Folder
            </Button>
          </Stack>
        </Box>
      )}

      {integration.provider !== "GITHUB" && (
        <Typography variant="body2" color="text.secondary">
          {t("integrationsPage.connectedDetails.refreshToken", {
            status: integration.hasRefreshToken
              ? t("integrationsPage.connectedDetails.refreshAvailable")
              : t("integrationsPage.connectedDetails.refreshUnavailable"),
          })}
        </Typography>
      )}

      {integration.provider === "GITHUB" && integration.status === "CONNECTED" && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
              Connected Repositories
            </Typography>
            {onAddMore && (
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAddMore}>
                Add Organization
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => {
                setReposTimedOut(false);
                refetch();
              }}
              disabled={isReposFetching || isReposLoading}
            >
              <SyncIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </IconButton>
          </Stack>

          {reposTimedOut ? (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setReposTimedOut(false);
                    refetch();
                  }}
                >
                  Retry
                </Button>
              }
            >
              GitHub is taking too long to respond. One of your connected organizations may have
              revoked access. Try refreshing or reconnecting via <strong>Add Organization</strong>.
            </Alert>
          ) : isReposLoading || isReposFetching ? (
            <CircularProgress size={20} />
          ) : reposData?.installations && reposData.installations.length > 0 ? (
            <Stack spacing={2}>
              {reposData.installations.map((installation) => (
                <Paper key={installation.installationId} variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    {installation.orgName}
                  </Typography>
                  <List dense disablePadding>
                    {installation.repositories.map((repo: GithubRepository) => (
                      <ListItem key={repo.id} disableGutters>
                        <Typography variant="body2">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            {repo.full_name}
                          </a>
                        </Typography>
                        {repo.private && (
                          <Chip
                            label="Private"
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, height: 20, fontSize: "0.65rem" }}
                          />
                        )}
                      </ListItem>
                    ))}
                    {installation.repositories.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No repositories granted.
                      </Typography>
                    )}
                  </List>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No repositories found or access not granted.
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default Integrations;
