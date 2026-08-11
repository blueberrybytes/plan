import React, { useEffect, useState } from "react";
import { View, Linking } from "react-native";
import { Card, Text, Button, useTheme, ActivityIndicator } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import type { TwentyCompanyItem } from "@/services/planAiApi";
import { TwentyCompanyPicker } from "./TwentyCompanyPicker";

interface TwentyRef {
  noteId?: string;
  url?: string;
  role?: "CANONICAL" | "SECONDARY";
}

interface Props {
  transcriptId: string;
  /** metadata.twenty — present once this meeting has been pushed (or deduped). */
  twenty?: TwentyRef | null;
  /** Called after a successful push so the screen can refetch the transcript. */
  onPushed?: () => void;
}

/**
 * Send a meeting to Twenty CRM from the phone.
 *
 * Recovery path for anything the automatic push skipped (no company chosen at
 * save time) or that failed. Web had this from the start; without it a mobile
 * user had to open a laptop to fix a meeting — which defeats the point for the
 * executives who live in this app.
 */
export const TwentyPushCard: React.FC<Props> = ({ transcriptId, twenty, onPushed }) => {
  const theme = useTheme();
  const { api } = useAuth();

  const [connected, setConnected] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [company, setCompany] = useState<TwentyCompanyItem | null>(null);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url?: string; deduped: boolean } | null>(null);

  useEffect(() => {
    if (!api) return;
    api
      .listIntegrations()
      .then((ints) =>
        setConnected(ints.some((i) => i.provider === "TWENTY" && i.status === "CONNECTED")),
      )
      .catch(() => setConnected(false));
  }, [api]);

  if (!connected || !api) return null;

  // Already in the CRM — from this session or a previous push (possibly a
  // teammate's recording of the same meeting).
  const existingUrl = result?.url ?? twenty?.url;
  const alreadyPushed = Boolean(result || twenty?.noteId);

  const handlePush = async (chosen: TwentyCompanyItem) => {
    setPushing(true);
    setError(null);
    try {
      const res = await api.pushTranscriptToTwenty({
        transcriptId,
        companyId: chosen.id,
      });
      setResult({ url: res.url, deduped: res.outcome === "DEDUPED" });
      onPushed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to push to Twenty");
    } finally {
      setPushing(false);
    }
  };

  return (
    <>
      <Card mode="outlined" style={{ marginTop: 12 }}>
        <Card.Content>
          <Text variant="titleSmall" style={{ fontWeight: "700", marginBottom: 4 }}>
            Twenty CRM
          </Text>

          {alreadyPushed ? (
            <>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                {result?.deduped || twenty?.role === "SECONDARY"
                  ? "A teammate already sent this meeting to Twenty."
                  : "This meeting is in Twenty."}
              </Text>
              {existingUrl && (
                <Button
                  mode="text"
                  compact
                  icon="open-in-new"
                  onPress={() => void Linking.openURL(existingUrl)}
                  style={{ alignSelf: "flex-start", marginTop: 4 }}
                >
                  Open note
                </Button>
              )}
            </>
          ) : (
            <>
              <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 8 }}>
                Send the meeting note to a company in your CRM.
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Button
                  mode="outlined"
                  compact
                  icon="office-building"
                  disabled={pushing}
                  onPress={() => setPickerOpen(true)}
                >
                  {company ? company.name : "Choose company…"}
                </Button>
                {company && (
                  <Button
                    mode="contained"
                    compact
                    disabled={pushing}
                    icon={pushing ? () => <ActivityIndicator size={14} /> : "send"}
                    onPress={() => void handlePush(company)}
                  >
                    {pushing ? "Sending…" : "Send"}
                  </Button>
                )}
              </View>
            </>
          )}

          {error && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
              {error}
            </Text>
          )}
        </Card.Content>
      </Card>

      <TwentyCompanyPicker
        visible={pickerOpen}
        onDismiss={() => setPickerOpen(false)}
        onSelect={(c) => {
          setCompany(c);
          setPickerOpen(false);
          // One tap instead of two — picking a company IS the intent to send.
          void handlePush(c);
        }}
      />
    </>
  );
};

export default TwentyPushCard;
