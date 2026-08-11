import React, { useCallback, useMemo, useRef, useState } from "react";
import { useParams, Navigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Home as HomeIcon,
  Refresh as RefreshIcon,
  InfoOutlined,
  AddCircleOutline,
  FileDownloadOutlined,
  AddTask,
  TuneOutlined,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useListIntegrationsQuery } from "../store/apis/integrationApi";
import SidebarLayout from "../components/layout/SidebarLayout";
import {
  useGetProjectQuery,
  useListProjectTasksQuery,
  useDeleteProjectTaskMutation,
  useListProjectTranscriptsQuery,
} from "../store/apis/projectApi";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../store/slices/app/appSlice";
import { useTranslation } from "react-i18next";
import ProjectTaskFormDialog from "../components/project/ProjectTaskFormDialog";
import ProjectTaskBoard from "../components/project/ProjectTaskBoard";
import CategoryFilterBar from "../components/project/CategoryFilterBar";
import MeetingsTab from "../components/project/MeetingsTab";
import ProjectFilesTab from "../components/project/ProjectFilesTab";
import ProjectKeywordsTab from "../components/project/ProjectKeywordsTab";
import AssistantChatPanel from "../components/chat/AssistantChatPanel";
import ProjectDigestBanner from "../components/project/ProjectDigestBanner";
import ProjectTaskDependencyDiagram from "../components/project/ProjectTaskDependencyDiagram";
import ProjectTaskGantt from "../components/project/ProjectTaskGantt";
import ProjectExportDialog, { type ExportFormat } from "../components/project/ProjectExportDialog";
import ProjectTranscriptDialog from "../components/project/ProjectTranscriptDialog";
import ProjectTaskDialog from "../components/project/ProjectTaskDialog";
import ProjectTaskCanvasView from "../components/project/ProjectTaskCanvasView";
import { toPng } from "html-to-image";
import type { TaskResponse } from "../store/apis/projectApi";
import ConfirmDeletionDialog from "../components/dialogs/ConfirmDeletionDialog";
import ProjectViewPreferenceDialog from "../components/project/ProjectViewPreferenceDialog";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

const ProjectDetails: React.FC = () => {
  const params = useParams();
  const projectId = params.projectId ?? null;
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const defaultProjectView = useSelector(
    (state: RootState) => state.preferences.defaultProjectView,
  );

  const { data, isLoading, isFetching, error, refetch } = useGetProjectQuery(projectId ?? "", {
    skip: !projectId,
  });

  const { data: integrationsResponse } = useListIntegrationsQuery();
  const connectedIntegrations = useMemo(() => {
    return (integrationsResponse?.data || []).filter(
      (i) => i.status === "CONNECTED" && i.defaultBoardUrl,
    );
  }, [integrationsResponse]);

  const [pollingInterval, setPollingInterval] = useState(0);

  const { data: transcriptsData } = useListProjectTranscriptsQuery(
    { projectId: projectId ?? "", params: undefined },
    { skip: !projectId, pollingInterval },
  );

  const isPending = useMemo(() => {
    return (
      transcriptsData?.data?.transcripts?.some(
        (t) =>
          (t.metadata as { processingStatus?: string })?.processingStatus === "PENDING" ||
          (t.metadata as { processingStatus?: string })?.processingStatus === "EXTRACTING_TASKS" ||
          (t.metadata as { processingStatus?: string })?.processingStatus === "REFINING_TASKS",
      ) ?? false
    );
  }, [transcriptsData]);

  React.useEffect(() => {
    setPollingInterval(isPending ? 3000 : 0);
  }, [isPending]);

  const {
    data: tasksData,
    isLoading: isTasksLoading,
    isFetching: isTasksFetching,
    error: tasksError,
    refetch: refetchTasks,
  } = useListProjectTasksQuery(
    { projectId: projectId ?? "", params: undefined },
    { skip: !projectId, pollingInterval },
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = [
    "files",
    "meetings",
    "board",
    "diagram",
    "timeline",
    "canvas",
    "keywords",
    "assistant",
  ] as const;
  type TabValue = (typeof VALID_TABS)[number];
  const rawTab = searchParams.get("tab");
  // If no ?tab= in URL, fall back to the user's stored preference
  const activeTab: TabValue = VALID_TABS.includes(rawTab as TabValue)
    ? (rawTab as TabValue)
    : (defaultProjectView as TabValue);

  const setActiveTab = (value: TabValue) => {
    setSearchParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  };
  const [isPreferenceDialogOpen, setIsPreferenceDialogOpen] = useState(false);
  const [isTranscriptDialogOpen, setIsTranscriptDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormMode, setTaskFormMode] = useState<"create" | "edit">("create");
  const [taskForForm, setTaskForForm] = useState<TaskResponse | null>(null);
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<HTMLDivElement | null>(null);
  const [isDeleteTaskConfirmOpen, setIsDeleteTaskConfirmOpen] = useState(false);
  const [taskPendingDeletion, setTaskPendingDeletion] = useState<TaskResponse | null>(null);

  /**
   * Category filter — added in IMPROVEMENTS #27.4 to let agency customers
   * keep their engineering board clean of support / design / ops items
   * that the AI also extracts from meetings. Default = "engineering" so the
   * board behaves like a pure dev kanban out of the box.
   *
   * Values: "all" | "engineering" | "design" | "support" | "ops" | "research".
   */
  type TaskCategoryFilter = "all" | "engineering" | "design" | "support" | "ops" | "research";
  const [categoryFilter, setCategoryFilter] = useState<TaskCategoryFilter>("engineering");

  const session = data?.data;
  // Create deep clones of the tasks to prevent "object is not extensible" errors
  // when charting libraries (like Recharts) try to mutate deeply nested properties.
  const tasks = useMemo(() => {
    const rawTasks = tasksData?.data?.tasks ?? [];
    return JSON.parse(JSON.stringify(rawTasks)) as typeof rawTasks;
  }, [tasksData]);

  /**
   * Per-category bucket count. Always read against the FULL unfiltered task
   * list so the badge numbers don't change when the user switches filters.
   * Engineering is the default; absent category defaults to "engineering"
   * for backward compatibility with tasks created before the field existed.
   */
  const categoryCounts = useMemo(() => {
    const counts: Record<TaskCategoryFilter, number> = {
      all: tasks.length,
      engineering: 0,
      design: 0,
      support: 0,
      ops: 0,
      research: 0,
    };
    tasks.forEach((task) => {
      const cat =
        ((task.metadata as Record<string, unknown> | null | undefined)?.category as
          | TaskCategoryFilter
          | undefined) ?? "engineering";
      if (cat in counts) counts[cat] += 1;
    });
    return counts;
  }, [tasks]);

  /**
   * Tasks after applying the category filter — fed to ALL views (board,
   * diagram, canvas, gantt) so the filter is global.
   */
  const filteredTasks = useMemo(() => {
    if (categoryFilter === "all") return tasks;
    return tasks.filter((task) => {
      const cat =
        ((task.metadata as Record<string, unknown> | null | undefined)?.category as
          | TaskCategoryFilter
          | undefined) ?? "engineering";
      return cat === categoryFilter;
    });
  }, [tasks, categoryFilter]);
  const exportableTasks = useMemo(() => tasks, [tasks]);
  const [deleteProjectTask, { isLoading: isDeletingTask }] = useDeleteProjectTaskMutation();

  const ensuredSessionId = projectId as string;
  const buildJiraPayload = useCallback(() => {
    return exportableTasks.map((task) => ({
      id: task.id,
      title: task.title,
      summary: task.summary,
      description: task.description,
      acceptanceCriteria: task.acceptanceCriteria,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dependencies: task.dependencies ?? [],
    }));
  }, [exportableTasks]);

  const buildCsv = useCallback(() => {
    const header = [
      "ID",
      "Title",
      "Summary",
      "Description",
      "Acceptance Criteria",
      "Status",
      "Priority",
      "Due Date",
      "Created At",
      "Updated At",
      "Dependencies",
    ];

    const rows = exportableTasks.map((task) => [
      task.id,
      task.title,
      task.summary ?? "",
      task.description ?? "",
      task.acceptanceCriteria ?? "",
      task.status,
      task.priority,
      task.dueDate ?? "",
      task.createdAt,
      task.updatedAt,
      (task.dependencies ?? []).join(";"),
    ]);

    const formatCsvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

    return [header, ...rows]
      .map((row) => row.map((cell) => formatCsvCell(String(cell ?? ""))).join(","))
      .join("\n");
  }, [exportableTasks]);

  const triggerDownload = useCallback((content: Blob | string, filename: string) => {
    const url = typeof content === "string" ? content : URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof content !== "string") {
      URL.revokeObjectURL(url);
    }
  }, []);

  const captureNodeAsPng = useCallback(
    async (node: HTMLElement | null, filename: string) => {
      if (!node) {
        throw new Error("Element not available for capture");
      }
      const dataUrl = await toPng(node, {
        cacheBust: true,
        backgroundColor: "white",
      });
      triggerDownload(dataUrl, filename);
    },
    [triggerDownload],
  );

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      try {
        if (format === "jira") {
          const payload = buildJiraPayload();
          const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
          });
          triggerDownload(blob, "tasks-jira.json");
        } else if (format === "csv") {
          const csv = buildCsv();
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          triggerDownload(blob, "tasks.csv");
        } else if (format === "diagram") {
          await captureNodeAsPng(diagramRef.current, "tasks-diagram.png");
        } else if (format === "gantt") {
          await captureNodeAsPng(ganttRef.current, "tasks-gantt.png");
        }
      } catch (error) {
        console.error("Export failed", error);
      } finally {
        setIsExportDialogOpen(false);
      }
    },
    [buildCsv, buildJiraPayload, captureNodeAsPng, triggerDownload],
  );

  const tasksErrorMessage = (() => {
    if (!tasksError) {
      return null;
    }

    if ("status" in tasksError) {
      if (typeof tasksError.data === "string") {
        return tasksError.data;
      }
      if (
        typeof tasksError.data === "object" &&
        tasksError.data !== null &&
        "message" in tasksError.data &&
        typeof (tasksError.data as { message?: string }).message === "string"
      ) {
        return (tasksError.data as { message?: string }).message;
      }
      return typeof tasksError.status === "number"
        ? t("projectDetails.messages.tasksErrorStatus", { status: tasksError.status })
        : t("projectDetails.messages.tasksErrorFallback");
    }

    return (
      (tasksError as { message?: string }).message ??
      t("projectDetails.messages.tasksErrorFallback")
    );
  })();

  const errorMessage = (() => {
    if (!error) {
      return null;
    }

    if ("status" in error) {
      const statusLabel = typeof error.status === "number" ? `Error ${error.status}` : "Error";

      if (typeof error.data === "string") {
        return error.data;
      }

      if (typeof error.data === "object" && error.data !== null && "message" in error.data) {
        const message = (error.data as { message?: string }).message;
        if (typeof message === "string" && message.trim().length > 0) {
          return message;
        }
      }

      return statusLabel;
    }

    return (error as { message?: string }).message ?? t("projectDetails.messages.unexpectedError");
  })();

  const handleOpenCreateTask = () => {
    setTaskFormMode("create");
    setTaskForForm(null);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setTaskForForm(null);
  };

  const handleTaskFormSuccess = (savedTask: TaskResponse) => {
    setIsTaskFormOpen(false);
    setTaskForForm(null);
    setSelectedTask(savedTask);
    refetchTasks();
  };

  const handleDeleteTask = async (task: TaskResponse) => {
    setTaskPendingDeletion(task);
    setIsDeleteTaskConfirmOpen(true);
  };

  const executeTaskDeletion = async () => {
    if (!taskPendingDeletion) {
      return;
    }

    try {
      await deleteProjectTask({
        projectId: ensuredSessionId,
        taskId: taskPendingDeletion.id,
      }).unwrap();
      dispatch(
        setToastMessage({
          severity: "success",
          message: t("projectDetails.messages.deleteSuccess"),
        }),
      );
      setSelectedTask(null);
      refetchTasks();
    } catch (mutationError) {
      console.error("Failed to delete task", mutationError);
      dispatch(
        setToastMessage({
          severity: "error",
          message: t("projectDetails.messages.deleteError"),
        }),
      );
    } finally {
      setIsDeleteTaskConfirmOpen(false);
      setTaskPendingDeletion(null);
    }
  };

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <SidebarLayout>
      <Box
        sx={{
          p: { xs: 3, md: 6 },
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack spacing={1}>
              <Breadcrumbs aria-label={t("projectDetails.breadcrumbs.aria")}>
                <Button
                  component={RouterLink}
                  to="/home"
                  color="inherit"
                  startIcon={<HomeIcon fontSize="small" />}
                  sx={{ textTransform: "none" }}
                >
                  {t("projectDetails.breadcrumbs.home")}
                </Button>
                <Button
                  component={RouterLink}
                  to="/projects"
                  color="inherit"
                  sx={{ textTransform: "none" }}
                >
                  {t("projectDetails.breadcrumbs.sessions")}
                </Button>
                <Typography color="text.primary">
                  {session?.title ?? t("projectDetails.breadcrumbs.fallback")}
                </Typography>
              </Breadcrumbs>

              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {session?.title ?? t("projectDetails.breadcrumbs.fallback")}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {t("projectDetails.subtitle")}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              {connectedIntegrations.map((integration) => (
                <Tooltip
                  key={integration.provider}
                  title={`Open ${integration.provider.charAt(0) + integration.provider.slice(1).toLowerCase()} Board`}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                    onClick={() => {
                      if (integration.defaultBoardUrl) {
                        window.open(integration.defaultBoardUrl, "_blank");
                      }
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    {integration.provider.charAt(0) + integration.provider.slice(1).toLowerCase()}
                  </Button>
                </Tooltip>
              ))}
              <Tooltip title={t("projectDetails.buttons.export")}>
                <IconButton
                  onClick={() => setIsExportDialogOpen(true)}
                  size="small"
                  color="secondary"
                >
                  <FileDownloadOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("projectDetails.buttons.moreInfo")}>
                <IconButton component={RouterLink} to={`/projects/${projectId}/info`} size="small">
                  <InfoOutlined />
                </IconButton>
              </Tooltip>
              <Tooltip title={t("projectDetails.buttons.refresh")}>
                <span>
                  <IconButton onClick={() => refetch()} disabled={isFetching} size="small">
                    <RefreshIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddCircleOutline />}
                onClick={() => setIsTranscriptDialogOpen(true)}
              >
                {t("projectDetails.buttons.addTranscript")}
              </Button>
            </Stack>
          </Stack>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
              <CircularProgress />
            </Box>
          ) : errorMessage ? (
            <Alert severity="error">{errorMessage}</Alert>
          ) : session ? (
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ xs: "flex-start", md: "center" }}
                      justifyContent="space-between"
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {t("projectDetails.sections.tasksOverviewTitle")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t("projectDetails.sections.tasksOverviewDescription")}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        {isPending && (
                          <Tooltip title="AI is currently processing transcripts to generate tasks...">
                            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                              <CircularProgress size={20} color="secondary" sx={{ mr: 1 }} />
                              <Typography
                                variant="body2"
                                color="secondary.main"
                                sx={{ fontWeight: 600 }}
                              >
                                Generating tasks...
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                        <Tooltip title="Change default view">
                          <IconButton onClick={() => setIsPreferenceDialogOpen(true)} size="small">
                            <TuneOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("projectDetails.buttons.refreshTasks")}>
                          <span>
                            <IconButton
                              onClick={() => refetchTasks()}
                              disabled={isTasksFetching}
                              size="small"
                            >
                              <RefreshIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Button
                          variant="contained"
                          startIcon={<AddTask />}
                          onClick={handleOpenCreateTask}
                        >
                          {t("projectDetails.buttons.createTask")}
                        </Button>
                      </Stack>
                    </Stack>

                    <Divider />

                    {/* The digest is the single most useful artifact in a
                        project — it belongs above the tabs, not inside one. */}
                    {projectId && <ProjectDigestBanner projectId={projectId} />}

                    <Tabs
                      value={activeTab}
                      onChange={(_, value: TabValue) => setActiveTab(value)}
                      aria-label={t("projectDetails.tabs.aria")}
                    >
                      <Tab label="Files" value="files" />
                      <Tab label={t("meetings.tab", "Meetings")} value="meetings" />
                      <Tab label="Keywords" value="keywords" />
                      <Tab label={t("projectDetails.tabs.board")} value="board" />
                      <Tab label={t("projectDetails.tabs.diagram")} value="diagram" />
                      <Tab label={t("projectDetails.tabs.timeline")} value="timeline" />
                      <Tab label="Canvas" value="canvas" />
                      <Tab label="Assistant" value="assistant" />
                    </Tabs>

                    {activeTab === "meetings" ? (
                      projectId ? (
                        <MeetingsTab projectId={projectId} />
                      ) : null
                    ) : activeTab === "assistant" ? (
                      projectId ? (
                        <Box
                          sx={{
                            height: { xs: "70vh", md: "75vh" },
                            mx: -3,
                            mb: -3,
                            borderTop: 1,
                            borderColor: "divider",
                          }}
                        >
                          <AssistantChatPanel
                            lockedProjectId={projectId}
                            storageKey={`local:project_assistant_${projectId}`}
                          />
                        </Box>
                      ) : null
                    ) : activeTab === "files" ? (
                      session?.contextId ? (
                        <ProjectFilesTab projectId={projectId} contextId={session.contextId} />
                      ) : (
                        <Alert severity="warning">
                          This project has no files store yet. Please refresh the page.
                        </Alert>
                      )
                    ) : activeTab === "keywords" ? (
                      session?.contextId ? (
                        <ProjectKeywordsTab contextId={session.contextId} />
                      ) : (
                        <Alert severity="warning">
                          This project has no context yet. Please refresh the page.
                        </Alert>
                      )
                    ) : isTasksLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          py: 6,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : tasksErrorMessage ? (
                      <Alert severity="error">{tasksErrorMessage}</Alert>
                    ) : tasks.length === 0 ? (
                      <Alert
                        severity="info"
                        action={
                          <Button color="primary" size="small" onClick={handleOpenCreateTask}>
                            {t("projectDetails.buttons.createTask")}
                          </Button>
                        }
                      >
                        {t("projectDetails.messages.noTasks")}
                      </Alert>
                    ) : (
                      // All ticket views (board / diagram / canvas / timeline)
                      // share the same category filter bar so the filter is
                      // global across visualisations.
                      <>
                        <CategoryFilterBar
                          value={categoryFilter}
                          onChange={setCategoryFilter}
                          counts={categoryCounts}
                        />
                        {activeTab === "board" ? (
                          <ProjectTaskBoard
                            tasks={filteredTasks}
                            onTaskClick={(task) => setSelectedTask(task)}
                          />
                        ) : activeTab === "diagram" ? (
                          <div ref={diagramRef}>
                            <ProjectTaskDependencyDiagram
                              tasks={filteredTasks}
                              onTaskClick={(task) => setSelectedTask(task)}
                            />
                          </div>
                        ) : activeTab === "canvas" ? (
                          <ProjectTaskCanvasView
                            tasks={filteredTasks}
                            onTaskClick={(task) => setSelectedTask(task)}
                          />
                        ) : (
                          <div ref={ganttRef}>
                            <ProjectTaskGantt
                              tasks={filteredTasks}
                              onTaskClick={(task) => setSelectedTask(task)}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Alert severity="warning">{t("projectDetails.messages.sessionNotFound")}</Alert>
          )}
        </Stack>
      </Box>
      <ProjectTranscriptDialog
        open={isTranscriptDialogOpen}
        onClose={() => setIsTranscriptDialogOpen(false)}
        projectId={ensuredSessionId}
      />
      <ProjectTaskDialog
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setTaskFormMode("edit");
          setTaskForForm(task);
          setIsTaskFormOpen(true);
        }}
        onDelete={(task) => handleDeleteTask(task)}
        isDeleting={isDeletingTask && Boolean(taskPendingDeletion)}
      />
      <ConfirmDeletionDialog
        open={isDeleteTaskConfirmOpen}
        onCancel={() => {
          if (!isDeletingTask) {
            setIsDeleteTaskConfirmOpen(false);
            setTaskPendingDeletion(null);
          }
        }}
        onConfirm={executeTaskDeletion}
        isProcessing={isDeletingTask}
        title={t("projectDetails.dialogs.deleteTask.title")}
        entityName={
          taskPendingDeletion?.title ?? t("projectDetails.dialogs.deleteTask.entityFallback")
        }
        description={t("projectDetails.dialogs.deleteTask.description")}
        additionalWarning={t("projectDetails.dialogs.deleteTask.additionalWarning")}
        confirmLabel={t("projectDetails.dialogs.deleteTask.confirm")}
      />
      <ProjectExportDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onExport={async (format) => {
          await handleExport(format);
        }}
        tasks={tasks}
      />
      <ProjectTaskFormDialog
        open={isTaskFormOpen}
        mode={taskFormMode}
        projectId={ensuredSessionId}
        tasks={tasks}
        task={taskFormMode === "edit" ? taskForForm : null}
        onClose={handleTaskFormClose}
        onSuccess={handleTaskFormSuccess}
      />
      <ProjectViewPreferenceDialog
        open={isPreferenceDialogOpen}
        onClose={() => setIsPreferenceDialogOpen(false)}
      />
    </SidebarLayout>
  );
};

export default ProjectDetails;
