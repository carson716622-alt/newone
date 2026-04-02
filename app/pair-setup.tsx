import { Text, View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/app-auth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";

export default function PairSetupScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, refreshUser } = useAppAuth();

  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();

  const handleCopyCode = async () => {
    if (user?.inviteCode) {
      await Clipboard.setStringAsync(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoin = async () => {
    setError("");
    const code = partnerCode.trim().toUpperCase();
    if (!code) { setError("Please enter your partner's code"); return; }
    if (code.length < 6) { setError("Code must be 6 characters"); return; }

    setLoading(true);
    try {
      await utils.client.couple.joinByCode.mutate({ inviteCode: code });
      await refreshUser();
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.message || "Failed to pair";
      if (msg.includes("already paired")) setError("You are already paired with someone");
      else if (msg.includes("Invalid invite")) setError("Invalid invite code. Please check and try again.");
      else if (msg.includes("yourself")) setError("You can't pair with yourself!");
      else if (msg.includes("already paired")) setError("This person is already paired with someone else");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Connect with Your Partner</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Share your code or enter your partner's code to connect
          </Text>
        </View>

        {/* Your Code Section */}
        <View style={[styles.codeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.codeLabel, { color: colors.muted }]}>Your Invite Code</Text>
          <Text style={[styles.codeText, { color: colors.primary }]}>
            {user?.inviteCode || "------"}
          </Text>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: colors.primary + "18" }]}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text style={[styles.copyButtonText, { color: colors.primary }]}>
              {copied ? "Copied!" : "Copy Code"}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.codeHint, { color: colors.muted }]}>
            Send this code to your partner
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Enter Partner Code */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Enter Partner's Code</Text>
          <TextInput
            style={[styles.codeInput, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
            value={partnerCode}
            onChangeText={(t) => setPartnerCode(t.toUpperCase())}
            placeholder="XXXXXX"
            placeholderTextColor={colors.muted}
            maxLength={6}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleJoin}
          />

          {error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.connectButton, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleJoin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.connectButtonText}>Connect</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: colors.muted }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  codeCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    gap: 10,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  copyButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  codeHint: {
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputSection: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  codeInput: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
    borderWidth: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  connectButton: {
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  connectButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  skipButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
  },
});
