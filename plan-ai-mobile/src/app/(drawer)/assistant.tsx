import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import {
  Text,
  TextInput,
  useTheme,
  Avatar,
  ActivityIndicator,
  IconButton,
  Menu,
  Chip,
  Divider,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAssistantChatMobile, type AssistantUIMessage } from "../../services/assistantChat";
import AssistantMessage from "../../components/AssistantMessage";
import { planAiApi } from "../../context/AuthContext";
import type { Project } from "../../services/planAiApi";
import { ScreenHeader } from "../../components/ScreenHeader";
import * as Clipboard from "expo-clipboard";
import LiveAudioStream from "react-native-live-audio-stream";
import {
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";

export default function AssistantScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  const [isDictating, setIsDictating] = useState(false);

  // ── Project focus state ──────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);

  useEffect(() => {
    planAiApi.listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const focusedProject = projects.find((p) => p.id === selectedProjectId);

  // ── Chat over the AI SDK UI Message Stream (reasoning + tool cards) ────────
  const { messages, sendMessage, isStreaming } = useAssistantChatMobile({
    projectId: selectedProjectId || undefined,
  });
  const isTyping = isStreaming;

  // Plain text of a message = its text parts joined (for the copy button).
  const messageText = (m: AssistantUIMessage): string =>
    (m.parts ?? []).map((p) => (p.type === "text" ? p.text : "")).join("");

  const markdownStyles = React.useMemo(
    () => ({
      body: { color: theme.colors.onSurface, fontSize: 16, lineHeight: 24, marginVertical: 0 },
      paragraph: { marginTop: 0, marginBottom: 8 },
      list_item: { marginBottom: 4 },
      code_inline: {
        backgroundColor: theme.colors.surfaceVariant,
        color: theme.colors.primary,
        borderRadius: 4,
        paddingHorizontal: 4,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      },
      fence: {
        backgroundColor: theme.colors.surfaceVariant,
        color: theme.colors.onSurface,
        padding: 8,
        borderRadius: 8,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        marginTop: 8,
        marginBottom: 8,
      },
    }),
    [theme],
  );

  // Real-time dictation states
  const wsRef = useRef<WebSocket | null>(null);
  const [dictationInterim, setDictationInterim] = useState("");
  const g = global as any;

  useEffect(() => {
    LiveAudioStream.on("data", (data: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "input_audio",
            source: "mic",
            audio: data,
          }),
        );
      }
    });
  }, []);

  const stopDictation = (abort = false) => {
    if (!isDictating) return;
    setIsDictating(false);
    try {
      LiveAudioStream.stop();
      if (wsRef.current) {
        const ws = wsRef.current;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "end_stream" }));
        }

        if (abort) {
          ws.close();
        } else {
          // Keep socket alive for 1s to receive final transcripts of already-sent audio
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
              ws.close();
            }
          }, 1000);
        }
        // IMMEDIATELY nullify wsRef so LiveAudioStream.on("data") stops sending new audio
        wsRef.current = null;
      }
      setDictationInterim("");
    } catch (err) {
      console.error("Dictation stop Error:", err);
    }
  };

  const handleDictate = async () => {
    if (isDictating) {
      stopDictation(false);
    } else {
      try {
        const perm = await requestRecordingPermissionsAsync();
        if (!perm.granted) return alert("Microphone permission required.");

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          allowsBackgroundRecording: false,
        });

        // Connect WebSocket
        const ws = await planAiApi.startAudioStream();
        wsRef.current = ws;

        ws.onmessage = (event: MessageEvent) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "transcript") {
              if (msg.isFinal) {
                setInputText(
                  (prev) => prev + (prev.length > 0 ? " " : "") + msg.text,
                );
                setDictationInterim("");
              } else {
                setDictationInterim(msg.text);
              }
            }
          } catch (e) {
            console.error("WS Message error", e);
          }
        };

        ws.onclose = () => {
          if (wsRef.current === ws) {
            wsRef.current = null;
          }
          setDictationInterim("");
        };

        if (!g.__isAssistantAudioInitialized) {
          LiveAudioStream.init({
            sampleRate: 24000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 1, // MIC
            bufferSize: 4096,
            wavFile: "assistant_dictation.wav",
          });
          g.__isAssistantAudioInitialized = true;
        }

        LiveAudioStream.start();
        setIsDictating(true);
      } catch (e) {
        console.error("Recording start fail", e);
        alert("Failed to start dictation stream.");
      }
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    if (isDictating) {
      stopDictation(true); // abort dictation, don't let trailing words leak into the next input
    }

    sendMessage({ text });
    setInputText("");
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 16),
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title="Assistant" showProfile={false} />

      {/* Project focus selector */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.outlineVariant,
          backgroundColor: theme.colors.surface,
          gap: 8,
        }}
      >
        <Avatar.Icon
          size={24}
          icon="folder-outline"
          style={{ backgroundColor: "transparent" }}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Focus:
        </Text>
        <Menu
          visible={projectMenuVisible}
          onDismiss={() => setProjectMenuVisible(false)}
          anchor={
            <Pressable onPress={() => setProjectMenuVisible(true)}>
              <Chip
                icon={selectedProjectId ? "folder" : "folder-outline"}
                compact
                mode="outlined"
                onPress={() => setProjectMenuVisible(true)}
              >
                {focusedProject?.title || "All projects"}
              </Chip>
            </Pressable>
          }
          anchorPosition="bottom"
          contentStyle={{ maxHeight: 300 }}
        >
          <Menu.Item
            title="All projects (workspace-wide)"
            leadingIcon="folder-multiple-outline"
            onPress={() => {
              setSelectedProjectId("");
              setProjectMenuVisible(false);
            }}
          />
          <Divider />
          {projects.map((p) => (
            <Menu.Item
              key={p.id}
              title={p.title}
              leadingIcon={p.id === selectedProjectId ? "check" : "folder-outline"}
              onPress={() => {
                setSelectedProjectId(p.id);
                setProjectMenuVisible(false);
              }}
            />
          ))}
        </Menu>
        <View style={{ flex: 1 }} />
        {selectedProjectId ? (
          <Chip
            compact
            mode="flat"
            onClose={() => setSelectedProjectId("")}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            textStyle={{ fontSize: 10, color: theme.colors.onPrimaryContainer }}
          >
            Scoped to {focusedProject?.title}
          </Chip>
        ) : null}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const isLastAssistant = !isUser && index === messages.length - 1;
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAssistant,
              ]}
            >
              {!isUser && (
                <Avatar.Icon
                  size={32}
                  icon="robot"
                  style={{
                    marginRight: 8,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              )}
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: isUser
                      ? theme.colors.primaryContainer
                      : theme.colors.elevation.level1,
                  },
                ]}
              >
                <View style={{ paddingRight: 24 }}>
                  {isUser ? (
                    <Text style={{ color: theme.colors.onPrimaryContainer }}>
                      {messageText(msg)}
                    </Text>
                  ) : (
                    <AssistantMessage
                      message={msg}
                      streaming={isLastAssistant && isTyping}
                      markdownStyles={markdownStyles}
                    />
                  )}
                </View>
                <IconButton
                  icon="content-copy"
                  size={16}
                  iconColor={
                    isUser
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                  onPress={() => Clipboard.setStringAsync(messageText(msg))}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    margin: 0,
                    padding: 0,
                    width: 24,
                    height: 24,
                    opacity: 0.6,
                  }}
                />
              </View>
            </View>
          );
        })}
        {messages.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 24 }}>
            <Avatar.Icon size={56} icon="robot" style={{ backgroundColor: theme.colors.primary }} />
            <Text variant="titleMedium" style={{ marginTop: 16, textAlign: "center" }}>
              How can I help you today?
            </Text>
            <Text
              variant="bodySmall"
              style={{ marginTop: 8, textAlign: "center", opacity: 0.7 }}
            >
              Ask about your meetings, or take actions like syncing tasks to Linear — with your
              confirmation.
            </Text>
          </View>
        )}
        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <ActivityIndicator size="small" style={{ marginLeft: 40 }} />
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {isDictating && dictationInterim ? (
          <View
            style={{
              position: "absolute",
              top: -24,
              left: 24,
              right: 60,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.primary,
                fontStyle: "italic",
              }}
              numberOfLines={1}
            >
              {dictationInterim}
            </Text>
          </View>
        ) : isDictating ? (
          <View
            style={{
              position: "absolute",
              top: -20,
              left: 24,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: "#10B981",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Listening...
            </Text>
          </View>
        ) : null}
        <TextInput
          mode="outlined"
          placeholder={isDictating ? "Listening..." : "Message plan AI..."}
          value={inputText}
          onChangeText={setInputText}
          style={styles.textInput}
          multiline
          maxLength={500}
        />
        <IconButton
          icon={
            inputText.trim().length > 0
              ? "send"
              : isDictating
                ? "stop-circle"
                : "microphone"
          }
          iconColor={isDictating ? theme.colors.error : undefined}
          mode="contained"
          size={24}
          onPress={inputText.trim().length > 0 ? handleSend : handleDictate}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatArea: { flex: 1 },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  textInput: {
    flex: 1,
    marginRight: 12,
    backgroundColor: "transparent",
    maxHeight: 100,
  },
  sendButton: {
    marginBottom: 4,
  },
});
