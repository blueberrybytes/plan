import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  useGetTwentySummaryQuery,
  useLazySearchTwentyCompaniesQuery,
  useLazySearchTwentyPeopleQuery,
  usePushTranscriptToTwentyMutation,
} from "../../store/apis/twentyApi";
import type { components } from "../../types/api";

type SpeakerInsight = components["schemas"]["SpeakerInsight"];
type TwentyNoteRef = components["schemas"]["TwentyNoteRef"];
type TwentyCompanyItem = components["schemas"]["TwentyCompanyItem"];
type TwentyPersonItem = components["schemas"]["TwentyPersonItem"];

interface Props {
  transcriptId: string;
  /** metadata.speakers — used to pre-suggest which people to link, by name. */
  speakers?: SpeakerInsight[] | null;
  /** metadata.twenty — present once this transcript has been pushed (or deduped). */
  twentyRef?: TwentyNoteRef | null;
}

/**
 * Entry point for pushing a meeting into Twenty CRM as a note linked to a
 * company (+ people). Deliberately its own card, not a row in
 * PostMeetingTasksPanel: pushing to Twenty is a USER ACTION (pick a company),
 * not a fire-and-forget effect that already ran — there's nothing to show
 * until someone chooses to send it.
 *
 * When the backend reports DEDUPED (a teammate already pushed this exact
 * meeting), this shows their note instead of silently doing nothing — and
 * offers an explicit override for the rare case the match is wrong.
 */
export const TwentyPushCard: React.FC<Props> = ({ transcriptId, speakers, twentyRef }) => {
  const { data: summary } = useGetTwentySummaryQuery();
  const [searchCompanies, { isFetching: isSearchingCompanies }] =
    useLazySearchTwentyCompaniesQuery();
  const [searchPeople, { isFetching: isSearchingPeople }] = useLazySearchTwentyPeopleQuery();
  const [pushTranscript, { isLoading: isPushing }] = usePushTranscriptToTwentyMutation();

  const [open, setOpen] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<TwentyCompanyItem[]>([]);
  const [personOptions, setPersonOptions] = useState<TwentyPersonItem[]>([]);
  const [company, setCompany] = useState<TwentyCompanyItem | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<TwentyPersonItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    outcome: "CREATED" | "ALREADY_PUSHED" | "DEDUPED";
    noteId: string;
    url?: string;
    canonicalTranscriptId?: string;
  } | null>(null);

  const speakerNames = useMemo(
    () =>
      (speakers ?? [])
        .map((s) => s.identifiedName?.trim())
        .filter((n): n is string => !!n && n.length > 1),
    [speakers],
  );

  const companySearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSearchCompanies = (q: string) => {
    if (companySearchTimer.current) clearTimeout(companySearchTimer.current);
    companySearchTimer.current = setTimeout(async () => {
      const res = await searchCompanies(q)
        .unwrap()
        .then((r) => r.data)
        .catch(() => []);
      setCompanyOptions(res ?? []);
    }, 300);
  };

  // Once a company is picked, best-effort pre-suggest people who match a
  // corrected speaker name — never blocks, never auto-selects on the user's
  // behalf beyond this convenience list.
  const loadPeopleForCompany = async () => {
    if (speakerNames.length === 0) return;
    const results = await Promise.all(
      speakerNames.map((name) =>
        searchPeople(name)
          .unwrap()
          .then((r) => r.data)
          .catch(() => []),
      ),
    );
    const flat = results.flat();
    const seen = new Set<string>();
    setPersonOptions(flat.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))));
  };

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    void debouncedSearchCompanies("");
  };

  const handlePush = async (forceSeparateNote = false) => {
    if (!company) return;
    setError(null);
    try {
      const res = await pushTranscript({
        transcriptId,
        companyId: company.id,
        personIds: selectedPeople.map((p) => p.id),
        forceSeparateNote,
      }).unwrap();
      setResult(res.data);
      if (res.data.outcome !== "DEDUPED") setOpen(false);
    } catch (err: unknown) {
      const rtkError = err as { data?: { message?: string } };
      setError(rtkError?.data?.message || "Failed to push to Twenty");
    }
  };

  if (!summary?.data?.connected) return null;

  // Normalize the two possible sources of "already resolved" state — a push
  // result from this session, or metadata.twenty from a PAST push (ours or a
  // teammate's) — into one shape so the render logic below doesn't need to
  // know which one it's looking at.
  const resolved: { isSecondary: boolean; noteId: string; url?: string } | null = result
    ? { isSecondary: result.outcome === "DEDUPED", noteId: result.noteId, url: result.url }
    : twentyRef
      ? {
          isSecondary: twentyRef.role === "SECONDARY",
          noteId: twentyRef.noteId,
          url: twentyRef.url,
        }
      : null;

  if (resolved?.isSecondary) {
    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HubOutlinedIcon color="action" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Already sent to Twenty
              </Typography>
              <Typography variant="caption" color="text.secondary">
                A teammate already pushed this same meeting to Twenty.
              </Typography>
            </Box>
            {resolved.url && (
              <Link
                href={resolved.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem" }}
              >
                View note <OpenInNewIcon sx={{ fontSize: "0.95rem" }} />
              </Link>
            )}
          </Stack>
          <Button
            size="small"
            sx={{ mt: 1 }}
            onClick={() => {
              setResult(null);
              handleOpen();
            }}
          >
            Not the same meeting — send separately
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (resolved && !resolved.isSecondary) {
    return (
      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HubOutlinedIcon color="success" />
            <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>
              Sent to Twenty
            </Typography>
            {resolved.url && (
              <Link
                href={resolved.url}
                target="_blank"
                rel="noopener noreferrer"
                underline="none"
                sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.8rem" }}
              >
                View note <OpenInNewIcon sx={{ fontSize: "0.95rem" }} />
              </Link>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        {!open ? (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <HubOutlinedIcon color="action" />
            <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1 }}>
              Send this meeting to Twenty
            </Typography>
            <Button size="small" variant="outlined" onClick={handleOpen}>
              Send to Twenty
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Send to Twenty
            </Typography>
            <Autocomplete
              size="small"
              options={companyOptions}
              loading={isSearchingCompanies}
              getOptionLabel={(o) => o.name}
              value={company}
              onChange={(_, value) => {
                setCompany(value);
                if (value) void loadPeopleForCompany();
              }}
              onInputChange={(_, value) => void debouncedSearchCompanies(value)}
              renderInput={(params) => (
                <TextField {...params} label="Company" placeholder="Search Twenty companies…" />
              )}
            />
            <Autocomplete
              multiple
              size="small"
              options={personOptions}
              loading={isSearchingPeople}
              getOptionLabel={(o) => o.name}
              value={selectedPeople}
              onChange={(_, value) => setSelectedPeople(value)}
              onInputChange={(_, value) => {
                void searchPeople(value)
                  .unwrap()
                  .then((res) => setPersonOptions(res.data ?? []))
                  .catch(() => {});
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip size="small" label={option.name} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="People (optional)"
                  placeholder="Search Twenty people…"
                  helperText={
                    speakerNames.length > 0
                      ? `Suggested from this meeting's speakers: ${speakerNames.join(", ")}`
                      : undefined
                  }
                />
              )}
            />
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                size="small"
                disabled={!company || isPushing}
                onClick={() => handlePush(false)}
                startIcon={isPushing ? <CircularProgress size={14} /> : undefined}
              >
                {isPushing ? "Sending…" : "Send"}
              </Button>
              <Button size="small" onClick={() => setOpen(false)} disabled={isPushing}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default TwentyPushCard;
