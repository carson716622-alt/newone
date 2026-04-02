import { Text, View, TextInput, TouchableOpacity, StyleSheet, FlatList, Platform, KeyboardAvoidingView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/app-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, isPaired, loading: authLoading } = useAppAuth();
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/welcome");
    }
  }, [authLoading, isAuthenticated, router]);

  const messagesList = trpc.messages.list.useQuery(undefined, {
    enabled: isAuthenticated && isPaired,
    refetchInterval: 10000,
  });

  const partner = trpc.couple.getPartner.useQuery(undefined, {
    enabled: isAuthenticated && isPaired,
  });

  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      messagesList.refetch();
    },
  });

  const setWidgetMutation = trpc.messages.setWidget.useMutation({
    onSuccess: () => {
      messagesList.refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
  });

  const handleSend = useCallback(async () => {
    const content = messageText.trim();
    if (!content) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await sendMutation.mutateAsync({ content });
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }, [messageText, sendMutation]);

  const handleSetWidget = useCallback(async (messageId: number) => {
    try {
      await setWidgetMutation.mutateAsync({ messageId });
    } catch (e) {
      console.error("Failed to set widget:", e);
    }
  }, [setWidgetMutation]);

  if (authLoading || !isAuthenticated) {
    return (
      <ScreenContainer className="flex-1">
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!isPaired) {
    return (
      <ScreenContainer className="flex-1">
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{"💌"}</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Partner Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Pair with your partner to start sending messages
          </Text>
          <TouchableOpacity
            style={[styles.pairButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/pair-setup")}
            activeOpacity={0.8}
          >
            <Text style={styles.pairButtonText}>Connect Now</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const partnerName = partner.data?.displayName || "Your Love";
  const messages = messagesList.data || [];
  const charCount = messageText.length;
  const maxChars = 200;

  return (
    <ScreenContainer className="flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Messages</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>with {partnerName}</Text>
          </View>

          {/* Messages List */}
          {messages.length === 0 ? (
            <View style={styles.emptyList}>
              <Text style={{ fontSize: 40 }}>{"💬"}</Text>
              <Text style={[styles.emptyListText, { color: colors.muted }]}>
                Send your first message!
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              inverted
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isMine = item.senderId === user?.id;
                return (
                  <View style={[
                    styles.messageBubble,
                    isMine ? styles.myMessage : styles.theirMessage,
                    {
                      backgroundColor: isMine ? colors.primary : colors.surface,
                      borderColor: isMine ? colors.primary : colors.border,
                    }
                  ]}>
                    <Text style={[
                      styles.messageText,
                      { color: isMine ? "#FFFFFF" : colors.foreground }
                    ]}>
                      {item.content}
                    </Text>
                    <View style={styles.messageFooter}>
                      <Text style={[
                        styles.messageTime,
                        { color: isMine ? "rgba(255,255,255,0.7)" : colors.muted }
                      ]}>
                        {formatMessageTime(item.createdAt)}
                      </Text>
                      {item.isWidgetMessage && (
                        <View style={[styles.widgetBadge, { backgroundColor: isMine ? "rgba(255,255,255,0.25)" : colors.primary + "20" }]}>
                          <Text style={[styles.widgetBadgeText, { color: isMine ? "#FFFFFF" : colors.primary }]}>
                            On Widget
                          </Text>
                        </View>
                      )}
                    </View>
                    {isMine && !item.isWidgetMessage && (
                      <TouchableOpacity
                        onPress={() => handleSetWidget(item.id)}
                        style={[styles.setWidgetBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.setWidgetText}>Set as Widget</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}

          {/* Input Area */}
          <View style={[styles.inputArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.foreground }]}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Write a sweet message..."
                placeholderTextColor={colors.muted}
                maxLength={maxChars}
                multiline
                returnKeyType="send"
              />
              <Text style={[styles.charCount, { color: charCount > maxChars - 20 ? colors.warning : colors.muted }]}>
                {charCount}/{maxChars}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || sendMutation.isPending}
              style={[
                styles.sendButton,
                { backgroundColor: messageText.trim() ? colors.primary : colors.border }
              ]}
              activeOpacity={0.8}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.sendIcon}>{"↑"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyListText: {
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  pairButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 16,
  },
  pairButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    padding: 14,
    marginVertical: 4,
    borderWidth: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  theirMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  messageTime: {
    fontSize: 12,
  },
  widgetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  widgetBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  setWidgetBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  setWidgetText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 10,
    borderTopWidth: 0.5,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 80,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
});
