import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/app-auth";
import { trpc } from "@/lib/trpc";
import { WidgetPreview } from "@/components/widget-preview";

export default function WidgetInfoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isPaired } = useAppAuth();

  const widgetMsg = trpc.messages.getWidgetMessage.useQuery(undefined, {
    enabled: isPaired,
  });

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={[styles.backText, { color: colors.primary }]}>{"← Back"}</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Widget Setup</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Add a LoveSync widget to your home screen or lock screen to see your partner's latest message at a glance.
        </Text>

        {/* Widget Preview */}
        <View style={styles.previewSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preview</Text>
          <WidgetPreview
            message={widgetMsg.data?.content ?? "I love you so much! Have a great day ❤️"}
            senderName={widgetMsg.data?.senderName ?? "Your Love"}
            timestamp={widgetMsg.data?.createdAt}
          />
        </View>

        {/* Setup Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How to Add Widget</Text>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Long press your home screen</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>
                Touch and hold an empty area until the apps start to jiggle
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Tap the + button</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>
                Find the "+" icon in the top-left corner and tap it
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Search for LoveSync</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>
                Find LoveSync in the widget gallery and select your preferred size
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Place the widget</Text>
              <Text style={[styles.stepDesc, { color: colors.muted }]}>
                Drag it to your preferred location on your home or lock screen
              </Text>
            </View>
          </View>
        </View>

        {/* User ID for widget config */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.infoTitle, { color: colors.primary }]}>Your Widget ID</Text>
          <Text style={[styles.infoId, { color: colors.primary }]}>{user?.id ?? "---"}</Text>
          <Text style={[styles.infoDesc, { color: colors.muted }]}>
            Use this ID when configuring the widget to receive your partner's messages
          </Text>
        </View>

        {/* How messages appear */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How It Works</Text>
          <Text style={[styles.howItWorks, { color: colors.muted }]}>
            When your partner sends you a message and sets it as a "Widget Message," it will automatically appear on your widget. You can also set any message as the widget message from the Messages tab.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  previewSection: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  instructionsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 16,
  },
  step: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  stepContent: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoId: {
    fontSize: 32,
    fontWeight: "800",
  },
  infoDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  howItWorks: {
    fontSize: 14,
    lineHeight: 22,
  },
});
