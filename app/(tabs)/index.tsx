import { Text, View, TouchableOpacity, StyleSheet, FlatList, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAppAuth } from "@/lib/app-auth";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface FloatingHeart {
  id: string;
  x: number;
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isAuthenticated, isPaired, loading: authLoading } = useAppAuth();
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  // Redirect to welcome if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/welcome");
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect to pair setup if not paired
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isPaired) {
      router.replace("/pair-setup");
    }
  }, [authLoading, isAuthenticated, isPaired, router]);

  const heartStats = trpc.hearts.getStats.useQuery(undefined, {
    enabled: isAuthenticated && isPaired,
    refetchInterval: 10000,
  });

  const partner = trpc.couple.getPartner.useQuery(undefined, {
    enabled: isAuthenticated && isPaired,
  });

  const sendHeartMutation = trpc.hearts.send.useMutation({
    onSuccess: () => {
      heartStats.refetch();
    },
  });

  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const addFloatingHeart = useCallback(() => {
    const id = Date.now().toString();
    const x = Math.random() * 200 - 100;
    setFloatingHearts(prev => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 1500);
  }, []);

  const handleSendHeart = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    heartScale.value = withSequence(
      withTiming(0.85, { duration: 80 }),
      withSpring(1.15, { damping: 6, stiffness: 200 }),
      withTiming(1, { duration: 200 })
    );

    addFloatingHeart();

    try {
      await sendHeartMutation.mutateAsync();
    } catch (e) {
      console.error("Failed to send heart:", e);
    }
  }, [heartScale, addFloatingHeart, sendHeartMutation]);

  if (authLoading || !isAuthenticated || !isPaired) {
    return (
      <ScreenContainer className="flex-1">
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const stats = heartStats.data;
  const partnerName = partner.data?.displayName || user?.partnerName || "Your Love";

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.container}>
        {/* Partner Name */}
        <View style={styles.partnerSection}>
          <Text style={[styles.partnerLabel, { color: colors.muted }]}>Connected with</Text>
          <Text style={[styles.partnerName, { color: colors.foreground }]}>{partnerName}</Text>
        </View>

        {/* Heart Button Area */}
        <View style={styles.heartArea}>
          {/* Floating Hearts */}
          {floatingHearts.map(fh => (
            <FloatingHeartAnim key={fh.id} x={fh.x} color={colors.primary} />
          ))}

          <Animated.View style={heartAnimStyle}>
            <TouchableOpacity
              onPress={handleSendHeart}
              activeOpacity={0.9}
              style={[styles.heartButton, { backgroundColor: colors.primary + "15" }]}
            >
              <Text style={styles.heartEmoji}>{"❤️"}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[styles.tapHint, { color: colors.muted }]}>Tap to send love</Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats?.todaySent ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Today</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats?.totalSent ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Sent</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats?.totalReceived ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Received</Text>
          </View>
        </View>

        {/* Recent Hearts */}
        {stats?.recentHearts && stats.recentHearts.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.recentTitle, { color: colors.foreground }]}>Recent Activity</Text>
            <FlatList
              data={stats.recentHearts.slice(0, 5)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.recentItem, { borderBottomColor: colors.border }]}>
                  <Text style={{ fontSize: 18 }}>
                    {item.senderId === user?.id ? "💕" : "❤️"}
                  </Text>
                  <Text style={[styles.recentText, { color: colors.foreground }]}>
                    {item.senderId === user?.id ? "You sent a heart" : `${partnerName} sent you a heart`}
                  </Text>
                  <Text style={[styles.recentTime, { color: colors.muted }]}>
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function FloatingHeartAnim({ x, color }: { x: number; color: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    translateY.value = withTiming(-180, { duration: 1400 });
    opacity.value = withTiming(0, { duration: 1400 });
    scale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(0.8, { duration: 1100 })
    );
  }, [translateY, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.floatingHeart, animStyle]}>
      <Text style={{ fontSize: 28, color }}>{"❤️"}</Text>
    </Animated.View>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  partnerSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  partnerLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  partnerName: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  heartArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    position: "relative",
  },
  heartButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
  },
  heartEmoji: {
    fontSize: 64,
  },
  tapHint: {
    fontSize: 14,
    marginTop: 12,
  },
  floatingHeart: {
    position: "absolute",
    top: "40%",
    zIndex: 10,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  recentSection: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
  },
  recentTime: {
    fontSize: 13,
  },
});
