import React from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setToastMessage } from "../../store/slices/app/appSlice";
import {
  useGetTwentySummaryQuery,
  useLazySearchTwentyCompaniesQuery,
  useLinkProjectToTwentyCompanyMutation,
} from "../../store/apis/twentyApi";
import { useGetProjectQuery, projectApi } from "../../store/apis/projectApi";
import type { components } from "../../types/api";

type TwentyCompanyItem = components["schemas"]["TwentyCompanyItem"];

interface ProjectTwentyLinkCardProps {
  projectId: string;
}

interface ProjectTwentyMeta {
  twentyCompanyId?: string;
  twentyCompanyName?: string;
}

/**
 * Links a project to a company in Twenty.
 *
 * This is the switch that makes unattended CRM push possible. Every other
 * integration works off a single workspace-wide default (a Jira project, a
 * Trello board), but a CRM note has to land on a DIFFERENT company per client —
 * so the destination is resolved per project, once, and every meeting recorded
 * into it inherits it. Without this link the recorder/mobile toggle stays
 * disabled, because there'd be nowhere to file the note.
 */
const ProjectTwentyLinkCard: React.FC<ProjectTwentyLinkCardProps> = ({ projectId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { data: summary } = useGetTwentySummaryQuery();
  const { data: projectData } = useGetProjectQuery(projectId, { skip: !projectId });
  const [searchCompanies, { data: results, isFetching }] = useLazySearchTwentyCompaniesQuery();
  const [linkProject, { isLoading: isLinking }] = useLinkProjectToTwentyCompanyMutation();

  const [input, setInput] = React.useState("");

  const meta = (projectData?.data?.metadata as ProjectTwentyMeta | null) ?? {};
  const linkedId = meta.twentyCompanyId;
  const linkedName = meta.twentyCompanyName;

  // Debounced remote search — Twenty is a self-hosted instance, so we don't
  // hammer it on every keystroke.
  React.useEffect(() => {
    if (input.trim().length < 2) return;
    const handle = setTimeout(() => void searchCompanies(input.trim()), 350);
    return () => clearTimeout(handle);
  }, [input, searchCompanies]);

  // Nothing to configure until Twenty is actually connected.
  if (!summary?.data?.connected) return null;

  const applyLink = async (company: TwentyCompanyItem | null) => {
    try {
      await linkProject({
        projectId,
        companyId: company?.id ?? null,
        companyName: company?.name ?? null,
      }).unwrap();
      // The recorder and mobile read this off the project, so the cached
      // project must refetch or the toggle stays disabled until a reload.
      dispatch(projectApi.util.invalidateTags([{ type: "Project", id: projectId }]));
      dispatch(
        setToastMessage({
          severity: "success",
          message: company
            ? t("twenty.link.linked", "Project linked to {{name}} in Twenty.", {
                name: company.name,
              })
            : t("twenty.link.unlinked", "Project unlinked from Twenty."),
        }),
      );
    } catch {
      dispatch(
        setToastMessage({
          severity: "error",
          message: t("twenty.link.error", "Couldn't update the Twenty link."),
        }),
      );
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <BusinessOutlinedIcon color="primary" fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t("twenty.link.title", "Twenty CRM")}
        </Typography>
        {linkedId && (
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={linkedName || t("twenty.link.linkedGeneric", "Linked")}
          />
        )}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {linkedId
          ? t(
              "twenty.link.subtitleLinked",
              "Meetings recorded into this project can be sent to this company automatically.",
            )
          : t(
              "twenty.link.subtitleEmpty",
              "Pick the company in Twenty this project belongs to. Until then, the recorder can't file its meeting notes.",
            )}
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
        <Autocomplete<TwentyCompanyItem>
          sx={{ flex: 1, minWidth: 240 }}
          size="small"
          options={results?.data ?? []}
          loading={isFetching}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(x) => x} // server-side search; don't re-filter locally
          onInputChange={(_, value) => setInput(value)}
          onChange={(_, value) => void applyLink(value)}
          noOptionsText={
            input.trim().length < 2
              ? t("twenty.link.typeToSearch", "Type at least 2 characters…")
              : t("twenty.link.noResults", "No companies found")
          }
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box>
                <Typography variant="body2">{option.name}</Typography>
                {option.domainName && (
                  <Typography variant="caption" color="text.secondary">
                    {option.domainName}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t("twenty.link.search", "Search companies in Twenty…")}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isFetching ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        {linkedId && (
          <Button
            size="small"
            color="inherit"
            startIcon={<LinkOffIcon />}
            disabled={isLinking}
            onClick={() => void applyLink(null)}
          >
            {t("twenty.link.unlink", "Unlink")}
          </Button>
        )}
      </Stack>
    </Card>
  );
};

export default ProjectTwentyLinkCard;
