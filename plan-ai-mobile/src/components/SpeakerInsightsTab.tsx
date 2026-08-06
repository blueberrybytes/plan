import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import {
  Surface,
  Text,
  Chip,
  Avatar,
  useTheme,
  IconButton,
  Portal,
  Dialog,
  TextInput,
  Button,
} from "react-native-paper";

export interface SpeakerInsight {
  label: string;
  identifiedName: string | null;
  role?: string | null;
  isPrincipalSpeaker: boolean;
  summary: string;
  keyQuotes?: string[];
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "MIXED";
  speakingTimeSeconds: number;
  utteranceCount: number;
}

interface Props {
  speakers?: SpeakerInsight[] | null;
  principalSpeakerLabel?: string | null;
  /**
   * Persist a corrected speaker name (blank clears the identification).
   * When provided, each speaker card shows a pencil icon that opens an
   * edit dialog. The parent owns the API call and transcript state update.
   */
  onRenameSpeaker?: (label: string, name: string) => Promise<void>;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const initialsFor = (name: string | null, label: string): string => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  const labelMatch = label.match(/(\D+)\s*(\d+)/);
  if (labelMatch) return `${labelMatch[1][0].toUpperCase()}${labelMatch[2]}`;
  return label.slice(0, 2).toUpperCase();
};

const SpeakerInsightsTab: React.FC<Props> = ({
  speakers,
  principalSpeakerLabel,
  onRenameSpeaker,
}) => {
  const theme = useTheme();
  const [editingSpeaker, setEditingSpeaker] = useState<SpeakerInsight | null>(null);
  const [draftName, setDraftName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openEditor = (s: SpeakerInsight) => {
    setDraftName(s.identifiedName ?? "");
    setEditingSpeaker(s);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setEditingSpeaker(null);
  };

  const handleSave = async () => {
    if (!editingSpeaker || !onRenameSpeaker || isSaving) return;
    setIsSaving(true);
    try {
      await onRenameSpeaker(editingSpeaker.label, draftName.trim());
      setEditingSpeaker(null);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error && e.message
          ? e.message
          : "Could not update the speaker name. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!speakers || speakers.length === 0) {
    return (
      <Surface
        elevation={0}
        style={[
          styles.empty,
          { backgroundColor: theme.colors.surfaceVariant, borderRadius: 8 },
        ]}
      >
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          No speaker breakdown available. This usually means the recording wasn&apos;t diarized
          (text-only transcript) or processing hasn&apos;t finished yet.
        </Text>
      </Surface>
    );
  }

  const sorted = [...speakers].sort((a, b) => {
    if (a.isPrincipalSpeaker !== b.isPrincipalSpeaker) {
      return a.isPrincipalSpeaker ? -1 : 1;
    }
    return b.speakingTimeSeconds - a.speakingTimeSeconds;
  });

  return (
    <View style={{ gap: 12, paddingBottom: 40 }}>
      {sorted.map((s) => {
        const displayName = s.identifiedName || s.label;
        const isPrincipal = s.isPrincipalSpeaker || principalSpeakerLabel === s.label;
        const initials = initialsFor(s.identifiedName, s.label);
        return (
          <Surface
            key={s.label}
            elevation={1}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderRadius: 12 },
            ]}
          >
            <View style={styles.headerRow}>
              <Avatar.Text
                size={44}
                label={initials}
                style={{
                  backgroundColor: isPrincipal
                    ? theme.colors.primary
                    : theme.colors.secondary,
                }}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.nameRow}>
                  <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                    {displayName}
                  </Text>
                  {onRenameSpeaker ? (
                    <IconButton
                      icon="pencil-outline"
                      size={16}
                      style={styles.editIcon}
                      iconColor={theme.colors.onSurfaceVariant}
                      accessibilityLabel={`Edit name for ${displayName}`}
                      onPress={() => openEditor(s)}
                    />
                  ) : null}
                  {!s.identifiedName && (
                    <Chip compact mode="outlined" style={styles.chip}>
                      unidentified
                    </Chip>
                  )}
                  {isPrincipal && (
                    <Chip
                      compact
                      style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                      textStyle={{ color: theme.colors.onPrimaryContainer }}
                    >
                      You
                    </Chip>
                  )}
                  {s.role ? (
                    <Chip compact mode="outlined" style={styles.chip}>
                      {s.role}
                    </Chip>
                  ) : null}
                  {s.sentiment ? (
                    <Chip compact mode="outlined" style={styles.chip}>
                      {s.sentiment.toLowerCase()}
                    </Chip>
                  ) : null}
                </View>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                >
                  {formatDuration(s.speakingTimeSeconds)} · {s.utteranceCount} utterance
                  {s.utteranceCount === 1 ? "" : "s"}
                  {s.identifiedName ? "" : ` · diarized label: ${s.label}`}
                </Text>
              </View>
            </View>

            {s.summary ? (
              <Text variant="bodyMedium" style={{ marginTop: 12, lineHeight: 20 }}>
                {s.summary}
              </Text>
            ) : null}

            {s.keyQuotes && s.keyQuotes.length > 0 ? (
              <View style={{ marginTop: 12, gap: 6 }}>
                {s.keyQuotes.map((q, i) => (
                  <View
                    key={i}
                    style={[
                      styles.quote,
                      { borderLeftColor: theme.colors.outlineVariant },
                    ]}
                  >
                    <Text
                      variant="bodySmall"
                      style={{
                        fontStyle: "italic",
                        color: theme.colors.onSurfaceVariant,
                      }}
                    >
                      “{q}”
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Surface>
        );
      })}

      {onRenameSpeaker ? (
        <Portal>
          <Dialog visible={editingSpeaker !== null} onDismiss={closeEditor}>
            <Dialog.Title style={{ color: theme.colors.onSurface }}>
              Edit speaker name
            </Dialog.Title>
            <Dialog.Content>
              <TextInput
                mode="outlined"
                label="Name"
                value={draftName}
                onChangeText={setDraftName}
                placeholder={editingSpeaker?.label}
                autoFocus
                disabled={isSaving}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
              >
                Leave blank to clear the name and show &quot;
                {editingSpeaker?.label ?? ""}&quot; again.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeEditor} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    padding: 16,
  },
  card: {
    padding: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    height: 24,
  },
  editIcon: {
    margin: 0,
    marginLeft: -4,
  },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
});

export default SpeakerInsightsTab;
