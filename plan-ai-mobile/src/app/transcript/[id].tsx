/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  Share,
  Linking,
} from "react-native";
import JSONTree from "react-native-json-tree";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Text,
  IconButton,
  useTheme,
  Surface,
  ActivityIndicator,
  SegmentedButtons,
  Button,
  Menu,
  Chip,
} from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import MermaidViewer from "../../components/MermaidViewer";
import { PostMeetingTasksPanel } from "../../components/PostMeetingTasksPanel";
import SpeakerInsightsTab, {
  type SpeakerInsight,
} from "../../components/SpeakerInsightsTab";
import { Transcript } from "@/services/planAiApi";
import type { components } from "@/types/api";

type TranscriptMetadata = components["schemas"]["TranscriptMetadata"];


const formatTimestamp = (seconds?: number | null) => {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `[${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`;
};

export default function TranscriptViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { api } = useAuth();

  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [isRetrying, setIsRetrying] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const refetchTranscript = React.useCallback(() => {
    if (!id) return;
    api
      .getTranscript(id)
      .then(setTranscript)
      .catch((e) => {
        console.error("Failed to load transcript", e);
      });
  }, [id, api]);

  useEffect(() => {
    if (id) {
      api
        .getTranscript(id)
        .then(setTranscript)
        .catch((e) => {
          console.error("Failed to load transcript", e);
          alert("Could not load meeting details.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, api]);

  // Live-poll the transcript while any post-meeting task is still PENDING so
  // doc/slides generation transitions appear without manual refresh.
  useEffect(() => {
    const meta = transcript?.metadata as TranscriptMetadata | null | undefined;
    const hasPendingPostMeetingTask =
      meta?.postMeetingTasks &&
      Object.values(meta.postMeetingTasks).some((t) => t?.status === "PENDING");
    if (!hasPendingPostMeetingTask) return;
    const timeoutId = setTimeout(() => refetchTranscript(), 3000);
    return () => clearTimeout(timeoutId);
  }, [transcript, refetchTranscript]);

  const handleRetry = async () => {
    if (!transcript) return;
    setIsRetrying(true);
    try {
      const updated = await api.reprocessTranscript(transcript.id);
      setTranscript(updated);
    } catch (e) {
      Alert.alert("Error", "Could not queue reprocessing. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  };

  const getShareableText = () => {
    if (!transcript) return "";
    let text = `Meeting: ${transcript.title || "Untitled"}\n`;
    text += `Date: ${new Date(transcript.recordedAt ?? transcript.createdAt).toLocaleDateString()}\n\n`;
    if (transcript.summary) {
      text += `--- SUMMARY ---\n${transcript.summary}\n\n`;
    }
    if (transcript.transcript) {
      text += `--- TRANSCRIPT ---\n${transcript.transcript}\n`;
    }
    return text;
  };

  const handleCopy = async () => {
    setMenuVisible(false);
    await Clipboard.setStringAsync(getShareableText());
    Alert.alert("Copied", "Transcript text copied to clipboard.");
  };

  const handleShare = async () => {
    setMenuVisible(false);
    try {
      await Share.share({
        message: getShareableText(),
        title: transcript?.title || "Transcript",
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleDownload = async () => {
    setMenuVisible(false);
    try {
      const fileName = `Transcript_${transcript?.id || "download"}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, getShareableText(), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error: any) {
      Alert.alert("Error", "Could not save file: " + error.message);
    }
  };

  const processingStatus = transcript?.metadata?.processingStatus;
  // Treat "legacy" masked transcripts (completed-with-error-title + 0 tasks,
  // from before the backend threw on AI failure) as failed so they surface the
  // Retry affordance instead of rendering the fallback error text as a summary.
  const transcriptTitle = transcript?.title || "";
  const isErrorTitle =
    transcriptTitle.startsWith("Processing Error") ||
    transcriptTitle.startsWith("Failed Transcript") ||
    transcriptTitle.startsWith("Authentication Error");
  const isFailed = processingStatus === "FAILED" || isErrorTitle;
  const isPending =
    processingStatus === "PENDING" || processingStatus === "PROCESSING";

  const renderSummaryTab = () => {
    if (isFailed || !transcript?.summary) {
      return (
        <View style={styles.emptyContainer}>
          {isFailed ? (
            <>
              <IconButton
                icon="alert-circle-outline"
                size={40}
                iconColor={theme.colors.error}
              />
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.error,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                AI Processing Failed
              </Text>
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  marginBottom: 20,
                  paddingHorizontal: 16,
                }}
              >
                The AI could not analyze this meeting. You can retry or view the
                raw transcript below.
              </Text>
              <Button
                mode="contained"
                icon={isRetrying ? undefined : "refresh"}
                onPress={handleRetry}
                disabled={isRetrying}
                loading={isRetrying}
              >
                {isRetrying ? "Queuing..." : "Retry AI Generation"}
              </Button>
            </>
          ) : isPending ? (
            <>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
                style={{ marginBottom: 16 }}
              />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                AI is analyzing this meeting...
              </Text>
            </>
          ) : (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No AI summary has been generated for this meeting yet.
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={{ paddingBottom: 40 }}>
        <Markdown
          rules={{
            fence: (node: any, children, parent, styles) => {
              if (node.sourceInfo === "mermaid") {
                return <MermaidViewer key={node.key} code={node.content} />;
              }
              return (
                <View key={node.key} style={styles.fence}>
                  <Text style={[styles.code_block]}>{node.content}</Text>
                </View>
              );
            },
          }}
          style={{
            body: {
              color: theme.colors.onSurface,
              fontSize: 16,
              lineHeight: 24,
            },
            heading1: {
              color: theme.colors.primary,
              marginTop: 16,
              marginBottom: 8,
            },
            heading2: {
              color: theme.colors.primary,
              marginTop: 16,
              marginBottom: 8,
            },
            heading3: {
              color: theme.colors.primary,
              marginTop: 12,
              marginBottom: 8,
            },
            list_item: { marginVertical: 4 },
            code_block: {
              backgroundColor: theme.colors.surfaceVariant,
              color: theme.colors.onSurfaceVariant,
              padding: 12,
              borderRadius: 8,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            },
            fence: {
              backgroundColor: theme.colors.surfaceVariant,
              color: theme.colors.onSurfaceVariant,
              padding: 12,
              borderRadius: 8,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            },
          }}
        >
          {transcript.summary}
        </Markdown>

        <PostMeetingTasksPanel
          transcriptId={transcript.id}
          tasks={(transcript.metadata as TranscriptMetadata | null)?.postMeetingTasks}
          onAfterRetry={refetchTranscript}
        />
      </View>
    );
  };

  const renderUtterancesTab = () => {
    type Utterance = {
      speaker: string;
      transcript: string;
      start: number;
      end: number;
    };
    const utterances = transcript?.utterances as Utterance[] | null | undefined;
    const principalSpeaker = transcript?.metadata?.principalSpeaker as
      | string
      | undefined;

    // Map raw diarized labels ("User 0") to the AI-identified names shown on the
    // Speakers tab. Keyed by label, which matches each utterance's `speaker`.
    const speakerByLabel = new Map<string, SpeakerInsight>(
      (
        (transcript?.metadata as { speakers?: SpeakerInsight[] } | null | undefined)
          ?.speakers ?? []
      ).map((s) => [s.label, s] as [string, SpeakerInsight]),
    );
    const resolveSpeaker = (rawLabel: string) => {
      const info = speakerByLabel.get(rawLabel);
      const isMe =
        info?.isPrincipalSpeaker ??
        (principalSpeaker ? rawLabel === principalSpeaker : false);
      const identified = info?.identifiedName?.trim() || null;
      const role = info?.role ?? null;
      // Prefer the identified name; show "You" for the principal speaker; else
      // fall back to the raw diarized label.
      let label = identified || (isMe ? "You" : rawLabel);
      if (isMe && identified) label += " (You)";
      if (role) label += ` · ${role}`;
      return { isMe, label };
    };

    if (utterances && utterances.length > 0) {
      return (
        <View style={{ paddingBottom: 40, gap: 16 }}>
          {utterances.map((u, i) => {
            const { isMe, label: speakerLabel } = resolveSpeaker(
              u.speaker || "Unknown",
            );
            return (
              <Surface
                key={i}
                style={[
                  styles.chatBubble,
                  {
                    backgroundColor: isMe
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                  },
                ]}
                elevation={0}
              >
                <Text
                  variant="labelMedium"
                  style={{
                    color: isMe ? theme.colors.primary : theme.colors.secondary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {formatTimestamp(u.start)} {speakerLabel}
                </Text>
                <Text style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
                  {u.transcript}
                </Text>
              </Surface>
            );
          })}
        </View>
      );
    }

    // Fallback for basic transcripts without utterances
    const rawText =
      transcript?.transcript || "No transcript content available.";
    console.log("🛑 Raw Transcript Text evaluating:", rawText);
    const blocks = rawText.split(/\n+/).filter(Boolean);

    // Check if the text has speaker labels in either desktop or mobile format
    const hasLabels = blocks.some(
      (b) => /^\[(.*?)\]\s*(.*)/.test(b) || /^(.{1,40}?):\s*(.*)/.test(b),
    );
    console.log("🛑 Has Labels:", hasLabels);

    if (hasLabels) {
      return (
        <View style={{ paddingBottom: 40, gap: 16 }}>
          {blocks.map((block, i) => {
            console.log(`🧐 Block [${i}]:`, block);
            let speaker = "Unknown";
            let text = block;

            const matchBracket = block.match(/^\[(.*?)\]\s*(.*)/);
            if (matchBracket) {
              speaker = matchBracket[1];
              text = matchBracket[2];
            } else {
              const matchColon = block.match(/^(.{1,40}?):\s*(.*)/);
              if (matchColon) {
                speaker = matchColon[1].trim();
                text = matchColon[2];
                if (speaker.toLowerCase() === "user") speaker = "Me";
              }
            }

            if (speaker === "Unknown") {
              return (
                <Text
                  key={i}
                  style={{ color: theme.colors.onSurface, lineHeight: 22 }}
                >
                  {block}
                </Text>
              );
            }

            const { isMe, label: displaySpeaker } = resolveSpeaker(speaker);

            return (
              <Surface
                key={i}
                style={[
                  styles.chatBubble,
                  {
                    backgroundColor: isMe
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                  },
                ]}
                elevation={0}
              >
                <Text
                  variant="labelMedium"
                  style={{
                    color: isMe ? theme.colors.primary : theme.colors.secondary,
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  {displaySpeaker}
                </Text>
                <Text style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
                  {text}
                </Text>
              </Surface>
            );
          })}
        </View>
      );
    }

    // Naked raw fallback (if zero speaker labels detected)
    return (
      <View style={{ paddingBottom: 40 }}>
        <Text style={{ color: theme.colors.onSurface, lineHeight: 24 }}>
          {rawText}
        </Text>
      </View>
    );
  };

  const renderKeyPointsTab = () => {
    const keyPoints = transcript?.metadata?.keyPoints || [];
    return (
      <View style={{ paddingBottom: 40, gap: 12 }}>
        <Text
          variant="titleMedium"
          style={{
            fontWeight: "bold",
            color: theme.colors.primary,
            marginBottom: 8,
            marginTop: 8,
          }}
        >
          Critical Insights & Pain Points
        </Text>
        {keyPoints.map((point: string, idx: number) => (
          <Surface
            key={idx}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: theme.colors.surfaceVariant,
            }}
            elevation={0}
          >
            <Text style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
              • {point}
            </Text>
          </Surface>
        ))}
      </View>
    );
  };

  const renderPainPointsTab = () => {
    const painPoints = transcript?.painPoints || [];
    const SEVERITY_COLOR: Record<string, string> = {
      BLOCKER: "#dc2626",
      HIGH: "#ea580c",
      MEDIUM: "#0284c7",
      LOW: "#6b7280",
    };
    const SEVERITY_RANK: Record<string, number> = {
      BLOCKER: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    const sorted = [...painPoints].sort(
      (a, b) => (SEVERITY_RANK[a.severity] ?? 99) - (SEVERITY_RANK[b.severity] ?? 99),
    );
    return (
      <View style={{ paddingBottom: 40, gap: 12 }}>
        <Text
          variant="titleMedium"
          style={{
            fontWeight: "bold",
            color: theme.colors.primary,
            marginBottom: 8,
            marginTop: 8,
          }}
        >
          Pain Points
        </Text>
        {sorted.map((pp) => (
          <Surface
            key={pp.id}
            style={{
              padding: 16,
              borderRadius: 12,
              backgroundColor: theme.colors.surfaceVariant,
            }}
            elevation={0}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: SEVERITY_COLOR[pp.severity] ?? "#6b7280",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text variant="labelSmall" style={{ color: "white", fontWeight: "bold" }}>
                  {pp.severity}
                </Text>
              </View>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, textTransform: "capitalize" }}
                >
                  {pp.status.replace(/_/g, " ").toLowerCase()}
                </Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.onSurface, lineHeight: 22, fontWeight: "600" }}>
              {pp.problem}
            </Text>
            {pp.affected ? (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                Affects: {pp.affected}
              </Text>
            ) : null}
            {pp.evidence ? (
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontStyle: "italic",
                  marginTop: 6,
                  lineHeight: 20,
                }}
              >
                {`“${pp.evidence}”`}
              </Text>
            ) : null}
            {pp.suggestedResolution ? (
              <Text style={{ color: theme.colors.onSurface, marginTop: 6, lineHeight: 20 }}>
                <Text style={{ fontWeight: "bold" }}>Suggested: </Text>
                {pp.suggestedResolution}
              </Text>
            ) : null}
          </Surface>
        ))}
      </View>
    );
  };

  const renderDocumentsTab = () => {
    const documents = transcript?.documents || [];
    return (
      <View style={{ paddingBottom: 40, gap: 12 }}>
        <Text
          variant="titleMedium"
          style={{
            fontWeight: "bold",
            color: theme.colors.primary,
            marginBottom: 8,
            marginTop: 8,
          }}
        >
          Generated Documents
        </Text>
        {documents.map((doc, idx: number) => (
          <TouchableOpacity
            key={idx}
            onPress={() => router.push(`/doc/${doc.id}`)}
          >
            <Surface
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              elevation={0}
            >
              <Text
                style={{
                  color: theme.colors.onSurface,
                  fontWeight: "600",
                  fontSize: 16,
                }}
              >
                {doc.title}
              </Text>
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 14,
                  marginTop: 4,
                }}
              >
                Status: {doc.status}
              </Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.outlineVariant },
        ]}
      >
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={{ marginLeft: -8 }}
        />
        <View style={{ flex: 1 }}>
          <Text
            variant="titleLarge"
            style={{ fontWeight: "bold", color: theme.colors.onBackground }}
            numberOfLines={1}
          >
            {transcript?.title || "Meeting Details"}
          </Text>
          {(transcript?.recordedAt || transcript?.createdAt) && (
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {new Date(
                transcript.recordedAt ?? transcript.createdAt,
              ).toLocaleDateString()}
            </Text>
          )}
          {transcript &&
            (transcript.durationSeconds ||
              transcript.speakerCount ||
              transcript.sentiment) && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {transcript.durationSeconds && (
                  <View
                    style={{
                      backgroundColor: theme.colors.surfaceVariant,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      ⏱️ {Math.floor(transcript.durationSeconds / 60)}m{" "}
                      {transcript.durationSeconds % 60}s
                    </Text>
                  </View>
                )}
                {transcript.speakerCount ? (
                  <View
                    style={{
                      backgroundColor: theme.colors.surfaceVariant,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      🎙️ {transcript.speakerCount}
                    </Text>
                  </View>
                ) : null}
                {transcript.metadata?.location && (
                  <TouchableOpacity
                    onPress={() => {
                      const lat = transcript.metadata?.location?.latitude;
                      const lng = transcript.metadata?.location?.longitude;
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                      );
                    }}
                    style={{
                      backgroundColor: theme.colors.surfaceVariant,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      📍 {transcript.metadata?.location?.latitude.toFixed(4)}, {transcript.metadata?.location?.longitude.toFixed(4)}
                    </Text>
                  </TouchableOpacity>
                )}
                {transcript.sentiment && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Sentiment:
                    </Text>
                    <View
                      style={{
                        backgroundColor:
                          transcript.sentiment === "POSITIVE"
                            ? "#dcfce7"
                            : transcript.sentiment === "NEGATIVE"
                              ? "#fee2e2"
                              : transcript.sentiment === "MIXED"
                                ? "#fef3c7"
                                : "#f1f5f9",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        variant="labelSmall"
                        style={{
                          color:
                            transcript.sentiment === "POSITIVE"
                              ? "#166534"
                              : transcript.sentiment === "NEGATIVE"
                                ? "#991b1b"
                                : transcript.sentiment === "MIXED"
                                  ? "#92400e"
                                  : "#334155",
                          fontWeight: "bold",
                        }}
                      >
                        {transcript.sentiment}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          {transcript?.metadata?.sentimentExplanation && (
            <Text
              style={{
                marginTop: 8,
                fontStyle: "italic",
                color: theme.colors.onSurfaceVariant,
                fontSize: 13,
                borderLeftWidth: 2,
                borderLeftColor: theme.colors.outlineVariant,
                paddingLeft: 8,
              }}
            >
              {transcript.metadata.sentimentExplanation}
            </Text>
          )}
        </View>

        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              iconColor={theme.colors.onBackground}
              size={24}
              onPress={() => setMenuVisible(true)}
              style={{ marginRight: -8 }}
            />
          }
        >
          <Menu.Item
            onPress={handleCopy}
            title="Copy to Clipboard"
            leadingIcon="content-copy"
          />
          <Menu.Item
            onPress={handleShare}
            title="Share Text"
            leadingIcon="share-variant"
          />
          <Menu.Item
            onPress={handleDownload}
            title="Save as File"
            leadingIcon="download"
          />
        </Menu>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <View style={styles.content}>
          {(() => {
            const meta = transcript?.metadata as TranscriptMetadata | null | undefined;
            const pt = meta?.postMeetingTasks;
            if (!pt) return null;
            const LABELS: Record<string, string> = {
              jira: "Jira",
              linear: "Linear",
              trello: "Trello",
              notion: "Notion",
              asana: "Asana",
              googleDrive: "Drive",
              oneDrive: "OneDrive",
              doc: "Doc",
              slides: "Slides",
            };
            const entries = Object.entries(pt).filter(([, s]) => s !== undefined);
            if (entries.length === 0) return null;
            return (
              <View style={styles.badgesContainer}>
                {entries.map(([kind, status]) => {
                  const color =
                    status?.status === "OK"
                      ? "#2e7d32"
                      : status?.status === "FAILED"
                        ? "#d32f2f"
                        : status?.status === "PENDING"
                          ? "#ed6c02"
                          : theme.colors.outline;
                  const icon =
                    status?.status === "OK"
                      ? "check-circle-outline"
                      : status?.status === "FAILED"
                        ? "alert-circle-outline"
                        : status?.status === "PENDING"
                          ? "timer-sand"
                          : "minus-circle-outline";
                  return (
                    <Chip
                      key={kind}
                      icon={icon}
                      compact
                      mode="outlined"
                      onPress={
                        status?.url
                          ? () => status.url && Linking.openURL(status.url)
                          : undefined
                      }
                      style={{
                        borderColor: color,
                        marginRight: 4,
                        marginBottom: 4,
                      }}
                      textStyle={{ color, fontSize: 11 }}
                    >
                      {LABELS[kind] || kind}
                    </Chip>
                  );
                })}
              </View>
            );
          })()}
          <View style={styles.segmentContainer}>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: "summary", label: "Summary" },
                ...(transcript?.documents?.length && transcript.documents.length > 0
                  ? [{ value: "documents", label: "Docs" }]
                  : []),
                ...(transcript?.metadata?.keyPoints && transcript.metadata.keyPoints.length > 0 ? [{ value: "keypoints", label: "Points" }] : []),
                ...(transcript?.painPoints && transcript.painPoints.length > 0 ? [{ value: "painpoints", label: "Pain" }] : []),
                { value: "utterances", label: "Transcript" },
                ...(() => {
                  const meta = transcript?.metadata as TranscriptMetadata | null | undefined;
                  const pt = meta?.postMeetingTasks;
                  const hasErrors =
                    meta?.errorMessage ||
                    (pt && Object.values(pt).some((s) => s?.status === "FAILED"));
                  return hasErrors ? [{ value: "errors", label: "Errors" }] : [];
                })(),
                ...(() => {
                  const speakers = (
                    transcript?.metadata as { speakers?: SpeakerInsight[] } | null | undefined
                  )?.speakers;
                  return speakers && speakers.length > 0
                    ? [{ value: "speakers", label: "Speakers" }]
                    : [];
                })(),
                { value: "metadata", label: "Meta" },
              ]}
            />
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === "summary" && renderSummaryTab()}
            {activeTab === "documents" && renderDocumentsTab()}
            {activeTab === "keypoints" && renderKeyPointsTab()}
            {activeTab === "painpoints" && renderPainPointsTab()}
            {activeTab === "utterances" && renderUtterancesTab()}
            {activeTab === "errors" && (
              <View style={{ gap: 12, paddingBottom: 40 }}>
                {(transcript?.metadata as TranscriptMetadata | null)?.errorMessage && (
                  <Surface
                    style={{
                      padding: 12,
                      backgroundColor: theme.colors.errorContainer,
                      borderRadius: 8,
                    }}
                    elevation={0}
                  >
                    <Text style={{ color: theme.colors.onErrorContainer, fontWeight: "bold" }}>
                      Processing error
                    </Text>
                    <Text style={{ color: theme.colors.onErrorContainer, marginTop: 4 }}>
                      {(transcript?.metadata as TranscriptMetadata).errorMessage}
                    </Text>
                  </Surface>
                )}
                {(() => {
                  const pt = (transcript?.metadata as TranscriptMetadata | null)
                    ?.postMeetingTasks;
                  if (!pt) return null;
                  return Object.entries(pt)
                    .filter(([, s]) => s?.status === "FAILED")
                    .map(([kind, status]) => (
                      <Surface
                        key={kind}
                        style={{
                          padding: 12,
                          backgroundColor: theme.colors.errorContainer,
                          borderRadius: 8,
                        }}
                        elevation={0}
                      >
                        <Text style={{ color: theme.colors.onErrorContainer, fontWeight: "bold" }}>
                          {kind} sync failed
                        </Text>
                        <Text style={{ color: theme.colors.onErrorContainer, marginTop: 4 }}>
                          {status?.error || "Unknown error"}
                        </Text>
                      </Surface>
                    ));
                })()}
              </View>
            )}
            {activeTab === "speakers" && (
              <SpeakerInsightsTab
                speakers={
                  (transcript?.metadata as { speakers?: SpeakerInsight[] } | null | undefined)
                    ?.speakers ?? []
                }
                principalSpeakerLabel={
                  (
                    transcript?.metadata as
                      | { principalSpeaker?: string }
                      | null
                      | undefined
                  )?.principalSpeaker ?? null
                }
                onRenameSpeaker={async (label, name) => {
                  if (!transcript) return;
                  const updated = await api.updateTranscriptSpeakers(
                    transcript.id,
                    { [label]: name },
                  );
                  setTranscript(updated);
                }}
              />
            )}
            {activeTab === "metadata" && (
              <Surface
                style={{
                  padding: 12,
                  marginBottom: 40,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 8,
                }}
                elevation={0}
              >
                <Button
                  mode="outlined"
                  compact
                  icon="content-copy"
                  onPress={() =>
                    Clipboard.setStringAsync(
                      JSON.stringify(transcript?.metadata ?? {}, null, 2),
                    )
                  }
                  style={{ alignSelf: "flex-start", marginBottom: 8 }}
                >
                  Copy JSON
                </Button>
                <ScrollView horizontal style={{ marginTop: 8 }}>
                  <JSONTree 
                    data={transcript?.metadata ?? {}} 
                    theme="monokai" 
                    invertTheme={false}
                    hideRoot
                  />
                </ScrollView>
              </Surface>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  segmentContainer: {
    padding: 16,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  chatBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "85%",
  },
});
