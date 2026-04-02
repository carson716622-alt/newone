import { Text, View, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Platform, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/app-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, isPaired, logout, refreshUser, loading: authLoading } = useAppAuth();
  const [copied, setCopied] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [pairError, setPairError] = useState("");
  const [pairLoading, setPairLoading] = useState(false);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/welcome");
    }
  }, [authLoading, isAuthenticated, router]);

  const partner = trpc.couple.getPartner.useQuery(undefined, {
    enabled: isAuthenticated && isPaired,
  });

  const widgetMsg = trpc.messages.getWidgetMessage.useQuery(undefined, {
    enabled: isAuthenticated && isPaired,
  });

  const handleCopyCode = async () => {
    if (user?.inviteCode) {
      await Clipboard.setStringAsync(user.inviteCode);
      setCopied(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinCouple = async () => {
    setPairError("");
    const code = partnerCode.trim().toUpperCase();
    if (!code || code.length < 6) {
      setPairError("Please enter a valid 6-character code");
      return;
    }
    setPairLoading(true);
    try {
      await utils.client.couple.joinByCode.mutate({ inviteCode: code });
      await refreshUser();
      setPartnerCode("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: any) {
      setPairError(e?.message || "Failed to pair");
    } finally {
      setPairLoading(false);
    }
  };

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/welcome");
  }, [logout, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <ScreenContainer className="flex-1">
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>

        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Profile</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Name</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>{user?.displayName}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Email</Text>
            <Text style={[styles.rowValue, { color: colors.muted }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Partner Section */}
        {isPaired && partner.data ? (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Partner</Text>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Connected with</Text>
              <Text style={[styles.rowValue, { color: colors.primary }]}>{partner.data.displayName}</Text>
            </View>
            {widgetMsg.data && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.widgetPreviewRow}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Widget Message</Text>
                  <Text style={[styles.widgetPreviewText, { color: colors.muted }]}>
                    "{widgetMsg.data.content}"
                  </Text>
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* Invite Code Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Invite Code</Text>
          <View style={styles.codeRow}>
            <Text style={[styles.codeText, { color: colors.primary }]}>
              {user?.inviteCode || "------"}
            </Text>
            <TouchableOpacity
              style={[styles.copyBtn, { backgroundColor: colors.primary + "18" }]}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                {copied ? "Copied!" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>

          {!isPaired && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.pairLabel, { color: colors.foreground }]}>Enter Partner's Code</Text>
              <View style={styles.pairRow}>
                <TextInput
                  style={[styles.pairInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={partnerCode}
                  onChangeText={(t) => setPartnerCode(t.toUpperCase())}
                  placeholder="XXXXXX"
                  placeholderTextColor={colors.muted}
                  maxLength={6}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.pairBtn, { backgroundColor: colors.primary }, pairLoading && { opacity: 0.7 }]}
                  onPress={handleJoinCouple}
                  activeOpacity={0.8}
                  disabled={pairLoading}
                >
                  {pairLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.pairBtnText}>Connect</Text>
                  )}
                </TouchableOpacity>
              </View>
              {pairError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{pairError}</Text>
              ) : null}
            </>
          )}
        </View>

        {/* Widget Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>Widget</Text>
          <Text style={[styles.widgetInfo, { color: colors.foreground }]}>
            Add the LoveSync widget to your home screen or lock screen to see your partner's latest message.
          </Text>
          <TouchableOpacity
            style={[styles.widgetButton, { backgroundColor: colors.primary + "18" }]}
            onPress={() => router.push("/widget-info" as any)}
            activeOpacity={0.7}
          >
            <Text style={[styles.widgetButtonText, { color: colors.primary }]}>Widget Setup Guide</Text>
          </TouchableOpacity>
          <Text style={[styles.widgetInfo, { color: colors.muted, marginTop: 8 }]}>
            Your User ID: {user?.id} (needed for widget setup)
          </Text>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.muted }]}>LoveSync v1.0.0</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  section: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  copyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pairLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  pairRow: {
    flexDirection: "row",
    gap: 10,
  },
  pairInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 3,
    textAlign: "center",
    borderWidth: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  pairBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  pairBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
  },
  widgetPreviewRow: {
    gap: 6,
  },
  widgetPreviewText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  widgetInfo: {
    fontSize: 14,
    lineHeight: 20,
  },
  widgetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  widgetButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  logoutButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  versionText: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 20,
  },
});
